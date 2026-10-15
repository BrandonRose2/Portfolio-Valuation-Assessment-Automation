import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  History,
  Info,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import {
  initialReports,
  type AuditEntry,
  type ReviewField,
  type ReviewReport,
  type ScenarioRow,
} from "@/data/referenceDeals";

const STORAGE_KEY = "gpc-control-center-reports-v1";

const statusTone = {
  "Ready for review": "status-ready",
  "Needs inputs": "status-review",
  "In progress": "status-progress",
} as const;

const confidenceTone = {
  Verified: "badge-verified",
  Review: "badge-review",
  Missing: "badge-missing",
} as const;

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function timestamp() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function cloneInitialReports() {
  return JSON.parse(JSON.stringify(initialReports)) as ReviewReport[];
}

function scenarioFourMonthly(row: ScenarioRow) {
  const maxNetLihtc = Math.max(row.maxLihtc - row.utilities, 0);
  return row.maxLihtc > 0 ? Math.max(maxNetLihtc, row.scenarioOne) : row.currentRent;
}

function newReport(index: number): ReviewReport {
  const createdAt = timestamp();
  const name = `New property_control-review_${index + 1}`;
  return {
    id: `new-report-${Date.now()}`,
    name,
    propertyName: "New property",
    fixture: "New report",
    phase: "In progress",
    updatedAt: createdAt,
    fields: [
      { id: "property", label: "Property", value: "New property", source: "Operator entered", confidence: "Review", manual: true },
      { id: "address", label: "Address", value: "Add from source document", source: "Not set", confidence: "Missing" },
      { id: "asset-type", label: "Asset / restrictions", value: "Confirm asset class and restrictions", source: "Not set", confidence: "Missing" },
      { id: "t12", label: "Operating history", value: "Attach / reconcile T-12", source: "Not set", confidence: "Missing" },
      { id: "rent-roll", label: "Rent roll", value: "Attach / reconcile rent roll", source: "Not set", confidence: "Missing" },
      { id: "utility", label: "Utility allowance", value: "Required for net LIHTC", source: "Not set", confidence: "Missing" },
    ],
    scenarioRows: [
      { id: `unit-set-${Date.now()}`, unitSet: "New unit set", units: 0, currentRent: 0, maxLihtc: 0, utilities: 0, scenarioOne: 0 },
    ],
    audit: [
      { id: `audit-${Date.now()}`, label: "Report created", detail: "New workspace created. Add documents and reconcile values before use.", timestamp: createdAt, kind: "system" },
    ],
  };
}

export default function Home() {
  const [reports, setReports] = useState<ReviewReport[]>(cloneInitialReports);
  const [selectedId, setSelectedId] = useState(initialReports[0].id);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [activeTab, setActiveTab] = useState<"workspace" | "validation">("workspace");

  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem(STORAGE_KEY);
      if (persisted) {
        const parsed = JSON.parse(persisted) as ReviewReport[];
        if (Array.isArray(parsed) && parsed.length) {
          setReports(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch {
      // A malformed local entry should never prevent access to the review workspace.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [reports, hydrated]);

  const selected = useMemo(
    () => reports.find(report => report.id === selectedId) ?? reports[0],
    [reports, selectedId]
  );

  const scenarioTotals = useMemo(() => {
    if (!selected) return { current: 0, scenarioFour: 0, annualDelta: 0 };
    const current = selected.scenarioRows.reduce((sum, row) => sum + row.currentRent * row.units, 0);
    const scenarioFour = selected.scenarioRows.reduce(
      (sum, row) => sum + scenarioFourMonthly(row) * row.units,
      0
    );
    return { current, scenarioFour, annualDelta: (scenarioFour - current) * 12 };
  }, [selected]);

  const replaceSelected = (nextReport: ReviewReport) => {
    setReports(current => current.map(report => (report.id === nextReport.id ? nextReport : report)));
  };

  const addAudit = (report: ReviewReport, entry: Omit<AuditEntry, "id" | "timestamp">): ReviewReport => ({
    ...report,
    updatedAt: timestamp(),
    audit: [
      { ...entry, id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`, timestamp: timestamp() },
      ...report.audit,
    ].slice(0, 12),
  });

  const updateField = (field: ReviewField, value: string) => {
    if (!selected) return;
    const nextBase: ReviewReport = {
      ...selected,
      propertyName: field.id === "property" ? value || "Untitled property" : selected.propertyName,
      fields: selected.fields.map(item =>
        item.id === field.id
          ? { ...item, value, source: "Operator entered", confidence: "Review" as const, manual: true }
          : item
      ),
    };
    // onChange fires for every keystroke. The first edit receives an audit event;
    // continued typing only updates the same operator-owned draft.
    const next = field.manual
      ? nextBase
      : addAudit(nextBase, {
          label: `${field.label} overridden`,
          detail: `Changed from ${field.source}; current value is explicitly marked Typed in.`,
          kind: "manual",
        });
    replaceSelected(next);
  };

  const updateScenario = (
    rowId: string,
    key: "unitSet" | "units" | "currentRent" | "maxLihtc" | "utilities" | "scenarioOne",
    raw: string
  ) => {
    if (!selected) return;
    const editedRow = selected.scenarioRows.find(row => row.id === rowId);
    if (!editedRow) return;
    const nextBase: ReviewReport = {
      ...selected,
      updatedAt: timestamp(),
      scenarioRows: selected.scenarioRows.map(row => {
        if (row.id !== rowId) return row;
        if (key === "unitSet") return { ...row, unitSet: raw, manual: true };
        // Controlled number inputs briefly emit "" during replacement. Normalize the
        // interim zero before applying the next digit so edits do not become 01210.
        const normalized = raw.replace(/^0+(?=\d)/, "");
        return { ...row, [key]: Number(normalized || 0), manual: true };
      }),
    };
    // Like evidence inputs, the first operator edit is logged once; continued typing
    // updates that same user-owned row without creating a keystroke-sized audit trail.
    const next = editedRow.manual
      ? nextBase
      : addAudit(nextBase, {
          label: `Scenario 4 inputs overridden`,
          detail: `${editedRow.unitSet} is now an operator-entered Scenario 4 control row.`,
          kind: "manual",
        });
    replaceSelected(next);
  };

  const updateNumericScenario = (
    rowId: string,
    key: "units" | "currentRent" | "maxLihtc" | "utilities" | "scenarioOne",
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const normalized = event.target.value.replace(/^0+(?=\d)/, "");
    if (normalized !== event.target.value) event.target.value = normalized;
    updateScenario(rowId, key, normalized);
  };

  const createReport = () => {
    const next = newReport(reports.length);
    setReports(current => [next, ...current]);
    setSelectedId(next.id);
    setActiveTab("workspace");
  };

  const renameReport = () => {
    if (!selected) return;
    const name = window.prompt("Rename this report", selected.name)?.trim();
    if (!name) return;
    replaceSelected(addAudit({ ...selected, name }, { label: "Report renamed", detail: `Report name changed to “${name}”.`, kind: "system" }));
  };

  const deleteReport = () => {
    if (!selected) return;
    const accepted = window.confirm(`Delete “${selected.name}” from this browser? This cannot be undone.`);
    if (!accepted) return;
    const remaining = reports.filter(report => report.id !== selected.id);
    const safeRemaining = remaining.length ? remaining : [newReport(0)];
    setReports(safeRemaining);
    setSelectedId(safeRemaining[0].id);
  };

  const resetFixtures = () => {
    const accepted = window.confirm("Restore the supplied three reference fixtures and discard browser-only edits?");
    if (!accepted) return;
    const next = cloneInitialReports();
    setReports(next);
    setSelectedId(next[0].id);
  };

  if (!selected) return null;

  return (
    <main className="control-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="GPC Control">
          <div className="brand-mark"><span>GPC</span><i /></div>
          <div>
            <p className="eyebrow">UNDERWRITING CONTROL CENTER</p>
            <h1>GPC / Control</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className={`save-indicator ${saveState}`} aria-live="polite">
            <span className="save-dot" />
            {saveState === "saving" ? "Saving review state…" : saveState === "error" ? "Browser storage unavailable" : "Saved in this browser"}
          </div>
          <a className="button button-primary" href="/GPC_Underwriting_Model_Template_v5.xlsx" download>
            <Download size={16} /> Model v5
          </a>
        </div>
      </header>

      <section className="disclosure-bar">
        <Info size={16} />
        <span><strong>Companion validation build.</strong> It preserves review decisions in this browser and deliberately does not replace the live OM Intake Desk’s authenticated extraction or server-backed report workflow.</span>
      </section>

      <div className="app-grid">
        <aside className="report-rail">
          <div className="rail-heading">
            <div>
              <p className="eyebrow">SAVED REVIEWS</p>
              <h2>Deal control</h2>
            </div>
            <button className="icon-button" onClick={createReport} aria-label="Create a new report"><Plus size={18} /></button>
          </div>
          <p className="rail-description">Only Cypress Cove, Springfield Crossing, and Bluffs at Evergreen are seeded as reference fixtures.</p>

          <div className="report-list" role="list">
            {reports.map(report => (
              <button
                key={report.id}
                className={`report-card ${report.id === selected.id ? "selected" : ""}`}
                onClick={() => setSelectedId(report.id)}
                role="listitem"
              >
                <span className={`status-pill ${statusTone[report.phase]}`}>{report.phase}</span>
                <strong>{report.propertyName}</strong>
                <small>{report.fixture === "New report" ? "Manual workspace" : "Reference fixture"}</small>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>

          <div className="rail-footer">
            <button className="plain-action" onClick={resetFixtures}><RefreshCcw size={15} /> Restore fixtures</button>
            <p><ShieldCheck size={14} /> No tenant, payroll, or source-file contents are copied into this control layer.</p>
          </div>
        </aside>

        <section className="workspace">
          <div className="workspace-header">
            <div>
              <div className="breadcrumb"><FolderOpen size={15} /> Deals <ChevronRight size={14} /> {selected.fixture}</div>
              <h2>{selected.propertyName}</h2>
              <p>{selected.name} · last local change {selected.updatedAt}</p>
            </div>
            <div className="report-actions">
              <button className="button button-secondary" onClick={renameReport}><Pencil size={15} /> Rename</button>
              <button className="button button-danger" onClick={deleteReport}><Trash2 size={15} /> Delete</button>
            </div>
          </div>

          <nav className="tabs" aria-label="Report sections">
            <button className={activeTab === "workspace" ? "active" : ""} onClick={() => setActiveTab("workspace")}><BookOpen size={16} /> Evidence workspace</button>
            <button className={activeTab === "validation" ? "active" : ""} onClick={() => setActiveTab("validation")}><ClipboardCheckIcon /> Regression readiness</button>
          </nav>

          {activeTab === "workspace" ? (
            <div className="workspace-content">
              <section className="decision-banner">
                <div>
                  <p className="eyebrow">DECISION BOUNDARY</p>
                  <h3>Show the source before the number.</h3>
                  <p>This review workspace distinguishes document evidence, operator entries, missing inputs, and model rules before anyone treats an output as an underwriting conclusion.</p>
                </div>
                <div className="decision-summary">
                  <span>Current control state</span>
                  <strong>{selected.phase}</strong>
                  <small>{selected.fields.filter(field => field.confidence === "Missing").length} blocking input{selected.fields.filter(field => field.confidence === "Missing").length === 1 ? "" : "s"}</small>
                </div>
              </section>

              <div className="workspace-columns">
                <div className="primary-stack">
                  <section className="panel evidence-panel">
                    <div className="panel-heading">
                      <div><p className="eyebrow">PROPERTY &amp; INPUTS</p><h3>Editable evidence register</h3></div>
                      <span className="panel-note"><Pencil size={14} /> Editing creates a typed-in marker</span>
                    </div>
                    <div className="field-grid">
                      {selected.fields.map(field => (
                        <label className={`field-card ${field.manual ? "manual" : ""}`} key={field.id}>
                          <span className="field-topline"><span>{field.label}</span><span className={`confidence-badge ${confidenceTone[field.confidence]}`}>{field.confidence}</span></span>
                          <input value={field.value} onChange={event => updateField(field, event.target.value)} aria-label={field.label} />
                          <small><FileText size={12} /> {field.manual ? "Typed in · prior source retained in activity" : field.source}</small>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="panel scenario-panel">
                    <div className="panel-heading">
                      <div><p className="eyebrow">SCENARIO 4 CONTROL</p><h3>Max Net LIHTC with voucher floor</h3></div>
                      <a href="/GPC_Underwriting_Model_Template_v5.xlsx" download className="quiet-link"><FileSpreadsheet size={15} /> Inspect v5 workbook</a>
                    </div>
                    <div className="formula-strip">
                      <span className="formula-label">Stated rule</span>
                      <code>if max LIHTC exists → MAX(net LIHTC, Scenario 1); otherwise → current rent</code>
                    </div>
                    <div className="table-scroll">
                      <table className="scenario-table">
                        <thead>
                          <tr><th>Unit set</th><th>Units</th><th>Current rent</th><th>Max LIHTC</th><th>Utilities</th><th>Scenario 1</th><th>Scenario 4 / mo.</th><th>Annual Δ</th></tr>
                        </thead>
                        <tbody>
                          {selected.scenarioRows.map(row => {
                            const scenarioFour = scenarioFourMonthly(row);
                            const annualDelta = (scenarioFour - row.currentRent) * row.units * 12;
                            return (
                              <tr key={row.id}>
                                <td><div className="unit-name-cell"><input className="unit-name" value={row.unitSet} onChange={event => updateScenario(row.id, "unitSet", event.target.value)} />{row.manual && <small className="scenario-typed">Typed in</small>}</div></td>
                                <td><input type="number" value={row.units} onChange={event => updateNumericScenario(row.id, "units", event)} /></td>
                                <td><input type="number" value={row.currentRent} onChange={event => updateNumericScenario(row.id, "currentRent", event)} /></td>
                                <td><input type="number" value={row.maxLihtc} onChange={event => updateNumericScenario(row.id, "maxLihtc", event)} /></td>
                                <td><input type="number" value={row.utilities} onChange={event => updateNumericScenario(row.id, "utilities", event)} /></td>
                                <td><input type="number" value={row.scenarioOne} onChange={event => updateNumericScenario(row.id, "scenarioOne", event)} /></td>
                                <td className="calculated">{currency(scenarioFour)}</td>
                                <td className={annualDelta >= 0 ? "positive" : "negative"}>{annualDelta >= 0 ? "+" : ""}{currency(annualDelta)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="scenario-summary">
                      <div><span>Current monthly potential</span><strong>{currency(scenarioTotals.current)}</strong></div>
                      <div><span>Scenario 4 monthly potential</span><strong>{currency(scenarioTotals.scenarioFour)}</strong></div>
                      <div className={scenarioTotals.annualDelta >= 0 ? "positive" : "negative"}><span>Annualized change</span><strong>{scenarioTotals.annualDelta >= 0 ? "+" : ""}{currency(scenarioTotals.annualDelta)}</strong></div>
                      <div className="review-callout"><AlertTriangle size={17} /><span><strong>Review gate:</strong> This is a transparent control calculation, not an approved underwriting output. Reconcile to the generated v5 model and source files.</span></div>
                    </div>
                  </section>
                </div>

                <aside className="audit-stack">
                  <section className="panel audit-panel">
                    <div className="panel-heading"><div><p className="eyebrow">ACTIVITY</p><h3>Audit trail</h3></div><History size={18} /></div>
                    <ol className="audit-list">
                      {selected.audit.map(entry => (
                        <li key={entry.id} className={`audit-${entry.kind}`}>
                          <span className="audit-icon">{entry.kind === "manual" ? <Pencil size={14} /> : entry.kind === "review" ? <CircleHelp size={14} /> : <CheckCircle2 size={14} />}</span>
                          <div><strong>{entry.label}</strong><p>{entry.detail}</p><small>{entry.timestamp}</small></div>
                        </li>
                      ))}
                    </ol>
                  </section>
                  <section className="panel model-panel">
                    <div className="model-icon"><FileSpreadsheet size={20} /></div>
                    <p className="eyebrow">MODEL ASSET</p>
                    <h3>GPC Template v5</h3>
                    <p>Scenario 4 follows Scenario 3, reads its own Unit Mix output, and opens in normal worksheet view so Excel does not overlay “Page 1.”</p>
                    <a className="button button-secondary block-button" href="/GPC_Underwriting_Model_Template_v5.xlsx" download><Download size={15} /> Download v5</a>
                  </section>
                </aside>
              </div>
            </div>
          ) : (
            <ValidationLane reports={reports} />
          )}
        </section>
      </div>
    </main>
  );
}

function ClipboardCheckIcon() {
  return <BadgeCheck size={16} />;
}

function ValidationLane({ reports }: { reports: ReviewReport[] }) {
  const fixtureReports = initialReports.map(seed => reports.find(report => report.id === seed.id) ?? seed);
  return (
    <div className="validation-lane">
      <section className="validation-intro">
        <div>
          <p className="eyebrow">REFERENCE REGRESSION LANE</p>
          <h3>Three real fixture packages. Zero invented accuracy claims.</h3>
          <p>The supplied source repository contains the relevant file families for Cypress Cove, Springfield Crossing, and Bluffs at Evergreen. They still need signed-off finished-model outputs and expected variance tolerances before an automation can credibly pass or fail a deal.</p>
        </div>
        <a href="/GPC_Underwriting_Model_Template_v5.xlsx" download className="button button-primary"><Download size={16} /> Download model v5</a>
      </section>
      <div className="validation-grid">
        {fixtureReports.map(report => {
          const supplied = report.fields.filter(field => !field.value.toLowerCase().includes("confirm") && field.confidence !== "Missing").length;
          const missing = report.fields.filter(field => field.confidence === "Missing").length;
          const sourceSummary = report.audit.find(entry => entry.kind === "source")?.detail ?? "Reference source package is available for review.";
          return (
            <article className="validation-card" key={report.id}>
              <div className="validation-card-top"><span className={`status-pill ${statusTone[report.phase]}`}>{report.phase}</span><ArrowUpRight size={17} /></div>
              <h4>{report.propertyName}</h4>
              <p>{sourceSummary}</p>
              <div className="fixture-meter"><span>Evidence register</span><strong>{supplied}/{report.fields.length} non-blocking inputs</strong><i><b style={{ width: `${Math.round((supplied / report.fields.length) * 100)}%` }} /></i></div>
              <ul>
                <li><CheckCircle2 size={14} /> Source package remains private in supplied source repository</li>
                <li><CheckCircle2 size={14} /> Scenario 4 control path available</li>
                <li className={missing ? "blocked" : ""}>{missing ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}{missing ? `${missing} open input${missing === 1 ? "" : "s"} to resolve` : "No seeded blocking inputs"}</li>
                <li className="blocked"><AlertTriangle size={14} /> Approved finished-model baseline still required</li>
              </ul>
            </article>
          );
        })}
      </div>
      <section className="definition-card">
        <ShieldCheck size={22} />
        <div><h4>What “validated” will mean here</h4><p>A report is not marked validated because an AI produced numbers. It needs source-file lineage, an approved expected model, calculation-level variance thresholds, and a reviewer sign-off. That threshold protects the good work already done in the live desk from a false “ready” claim.</p></div>
      </section>
    </div>
  );
}
