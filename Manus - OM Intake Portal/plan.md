# GPC Underwriting Control Center — Implementation Plan

## Product scope

The supplied repository confirms that the existing OM Intake Desk is a working, substantial prototype. It implements browser-side OM/seller-file ingestion, Claude extraction, LIHTC/FMR data services, report autosave, workbook storage/versioning, user administration, and a Scenario 0–4 workflow. Its production source is archived in a compressed Bun loader rather than maintained as readable application files, and the repository contains no regression suite or human-readable deployment source.

This project delivers a **companion control center**, not a misleading reimplementation of the existing intake engine. It makes the underwriting workflow more transparent and easier to operate by providing:

- a saved-report workspace with automatic browser persistence, rename, delete, and new-report actions;
- explicit field provenance, confidence, validation status, and manual-override indicators;
- a Scenario 4 review calculator that shows the exact stated decision rule before it is used in the model;
- a reference-regression lane focused only on Cypress Cove, Springfield Crossing, and Bluffs at Evergreen;
- a downloadable, audited `GPC Underwriting Model Template v5` built from the supplied v4 template with Scenario 4 after Scenario 3 and page-break-preview artifacts removed.

The portal will **not** claim to calculate a final investment decision, parse an uploaded OM, or replace the live extraction service in this increment. Those capabilities require the existing readable source, authenticated storage, and a set of signed-off reference-model expectations.

## Design direction

### Candidate styles

1. **Institutional deal room** (chosen, 0.07): sober, review-first interface inspired by investment-committee workpapers.
2. **Spreadsheet-native utility** (0.05): compact grid with minimal chrome and formula-forward controls.
3. **Broker operations console** (0.08): higher-density workflow board with document queues and alerts.

### Chosen: institutional deal room

- **Design movement:** Financial workpaper editorial — dark ink, warm paper surfaces, precise table geometry, and carefully weighted typography.
- **Core principles:** Evidence before confidence; no hidden model decisions; direct editability; progression from source document to reviewed output.
- **Color philosophy:** Deep navy carries authority, muted stone keeps dense figures readable, teal denotes verified data, amber denotes operator attention, and red is reserved for blocking exceptions.
- **Layout paradigm:** A persistent report rail leads into a two-column operating workspace, with evidence/audit material available alongside—not buried behind—calculations.
- **Signature elements:** Provenance badges, compact audit timeline, and a scenario-rule ribbon that exposes each formula decision.
- **Interaction philosophy:** Every user edit is immediately marked as a manual override and autosaved locally after a short debounce. Rename and delete require intentional, reversible-in-context actions.
- **Animation:** Only subtle opacity/position transitions for save state and selected report changes; reduced-motion users receive the final state immediately.
- **Typography:** `Georgia` for sectional hierarchy and `Inter, ui-sans-serif, system-ui` for tabular interface work.
- **Brand essence:** An evidence-first control surface for multifamily underwriting—not another opaque extraction demo.
- **Personality:** Exacting, calm, transparent.
- **Brand voice:** “Show the source before the number.” / “Ready for review—not ready to assume.”
- **Wordmark:** `GPC / Control` with a small offset divider, suggesting a spreadsheet rule and an approval boundary.
- **Signature brand color:** `#0D3B4C` (deep blue-teal).

## Architecture

- **Client:** React 19 + TypeScript + Tailwind, a self-contained operator workspace using `localStorage` for honest in-browser persistence during this validation build.
- **Server/database:** The initialized Express/tRPC/Drizzle stack remains available for a subsequent authenticated persistence and upload-handling increment. This increment deliberately does not pretend that browser storage is shared, multi-user server persistence.
- **Workbook:** A reproducible Python/openpyxl script upgrades the supplied GPC v4 file. It adds an independent Scenario 4 sheet and Unit Mix section, updates visible scenario references to 0–4, and returns worksheets to normal workbook view to remove Excel’s Page 1 overlays.
- **Reference suite:** Cypress Cove, Springfield Crossing, and Bluffs at Evergreen are registered as review fixtures only; their seller files and OMs are not loaded into browser storage or exposed in the web application.

## Project structure

| Path | Responsibility |
| --- | --- |
| `client/src/pages/Home.tsx` | Control-center interface, autosave interaction, scenario review controls, report management |
| `client/src/data/referenceDeals.ts` | Non-sensitive fixture metadata and report seed values |
| `client/src/index.css` | Application theme, responsive layout, print and accessibility details |
| `client/public/manus-routes.json` | Route manifest for the Preview runtime |
| `scripts/upgrade_workbook.py` | Repeatable v4 → v5 workbook upgrade with assertions |
| `client/public/GPC_Underwriting_Model_Template_v5.xlsx` | Generated workbook ready for download and model review |
| `TODO.md` | Delivery outcomes and concrete acceptance clauses |

## Key interaction contracts

| Interaction | Observable behavior |
| --- | --- |
| Autosave | A field change immediately becomes a draft in the UI, persists to browser storage after a short debounce, and shows `Saving…` until the local write completes. Reloading restores the latest saved data. |
| Manual override | Editing a seeded/extracted field adds a `Typed in` marker, preserves the previous source in the audit timeline, and never silently presents the new value as extracted. |
| Rename | The prompt starts with the current report name. A blank/cancelled value leaves the committed name unchanged. A successful rename persists and is reflected in the report rail. |
| Delete | Deleting asks for confirmation, removes only the selected browser-stored report, and selects a safe remaining report or creates a blank workspace. |
| Scenario 4 | The control surface calculates `max(net LIHTC, Scenario 1 voucher outcome)` when a maximum LIHTC rent exists; otherwise it retains current rent. It labels the result as operator-review-only until reconciliation is complete. |

## Material limits and next integration

The existing live portal includes several capabilities that should be retained rather than casually duplicated: server-backed reports, signed-in ownership, tenant/employee PII minimization, a base workbook version history, and HUD lookup services. To connect this control center to those live capabilities safely, the next increment should begin with the readable Bun source extracted from the archived loader, its original Railway configuration, and approved Cypress/Springfield/Bluffs expected output values. No production deployment is claimed or authorized by this validation build.
