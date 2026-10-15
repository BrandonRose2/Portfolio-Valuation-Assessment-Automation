export type ReviewField = {
  id: string;
  label: string;
  value: string;
  source: string;
  confidence: "Verified" | "Review" | "Missing";
  manual?: boolean;
};

export type ScenarioRow = {
  id: string;
  unitSet: string;
  units: number;
  currentRent: number;
  maxLihtc: number;
  utilities: number;
  scenarioOne: number;
  manual?: boolean;
};

export type AuditEntry = {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  kind: "source" | "manual" | "system" | "review";
};

export type ReviewReport = {
  id: string;
  name: string;
  propertyName: string;
  fixture: "Cypress Cove" | "Springfield Crossing" | "Bluffs at Evergreen" | "New report";
  phase: "Ready for review" | "Needs inputs" | "In progress";
  fields: ReviewField[];
  scenarioRows: ScenarioRow[];
  audit: AuditEntry[];
  updatedAt: string;
};

const timestamp = "Initial fixture";

export const initialReports: ReviewReport[] = [
  {
    id: "cypress-cove",
    name: "Cypress Cove_control-review",
    propertyName: "Cypress Cove",
    fixture: "Cypress Cove",
    phase: "Ready for review",
    updatedAt: timestamp,
    fields: [
      { id: "property", label: "Property", value: "Cypress Cove", source: "Reference fixture", confidence: "Verified" },
      { id: "address", label: "Address", value: "Confirm from OM", source: "Offering memorandum", confidence: "Review" },
      { id: "asset-type", label: "Asset / restrictions", value: "Confirm LIHTC status", source: "Offering memorandum", confidence: "Review" },
      { id: "t12", label: "Operating history", value: "T-12 supplied", source: "Seller T-12", confidence: "Review" },
      { id: "rent-roll", label: "Rent roll", value: "Rent roll supplied", source: "Seller rent roll", confidence: "Review" },
      { id: "utility", label: "Utility allowance", value: "Required for net LIHTC", source: "Open question", confidence: "Missing" },
    ],
    scenarioRows: [
      { id: "cypress-1", unitSet: "Illustrative 1BR / 60% AMI", units: 12, currentRent: 980, maxLihtc: 1195, utilities: 105, scenarioOne: 1080 },
      { id: "cypress-2", unitSet: "Illustrative 2BR / 60% AMI", units: 8, currentRent: 1140, maxLihtc: 0, utilities: 130, scenarioOne: 1210 },
    ],
    audit: [
      { id: "cypress-a1", label: "Reference fixture registered", detail: "Cypress Cove OM, rent roll, and T-12 are retained in the supplied source repository.", timestamp, kind: "source" },
      { id: "cypress-a2", label: "Review boundary created", detail: "No property-level value is treated as final until it is reconciled to the source workbook.", timestamp, kind: "review" },
    ],
  },
  {
    id: "springfield-crossing",
    name: "Springfield Crossing_control-review",
    propertyName: "Springfield Crossing",
    fixture: "Springfield Crossing",
    phase: "Needs inputs",
    updatedAt: timestamp,
    fields: [
      { id: "property", label: "Property", value: "Springfield Crossing", source: "Reference fixture", confidence: "Verified" },
      { id: "address", label: "Address", value: "Confirm from OM", source: "Offering memorandum", confidence: "Review" },
      { id: "asset-type", label: "Asset / restrictions", value: "Confirm LIHTC status", source: "Offering memorandum", confidence: "Review" },
      { id: "t12", label: "Operating history", value: "12-month statement supplied", source: "Seller T-12", confidence: "Review" },
      { id: "rent-roll", label: "Rent roll", value: "Rent roll supplied", source: "Seller rent roll", confidence: "Review" },
      { id: "payroll", label: "Payroll", value: "Payroll overview supplied", source: "Seller payroll", confidence: "Review" },
    ],
    scenarioRows: [
      { id: "springfield-1", unitSet: "Illustrative restricted unit set", units: 10, currentRent: 1050, maxLihtc: 1260, utilities: 120, scenarioOne: 1120 },
    ],
    audit: [
      { id: "springfield-a1", label: "Reference fixture registered", detail: "Springfield OM, T-12, rent roll, and payroll are retained in the supplied source repository.", timestamp, kind: "source" },
      { id: "springfield-a2", label: "Awaiting expected-output baseline", detail: "A completed approved model is needed before automated variance testing can be enabled.", timestamp, kind: "review" },
    ],
  },
  {
    id: "bluffs-evergreen",
    name: "Bluffs at Evergreen_control-review",
    propertyName: "Bluffs at Evergreen",
    fixture: "Bluffs at Evergreen",
    phase: "In progress",
    updatedAt: timestamp,
    fields: [
      { id: "property", label: "Property", value: "Bluffs at Evergreen", source: "Reference fixture", confidence: "Verified" },
      { id: "address", label: "Address", value: "Confirm from OM", source: "Offering memorandum", confidence: "Review" },
      { id: "t12", label: "Operating history", value: "T-12 supplied", source: "Seller T-12", confidence: "Review" },
      { id: "rent-roll", label: "Rent roll", value: "Rent roll supplied", source: "Seller rent roll", confidence: "Review" },
      { id: "payroll", label: "Payroll", value: "Payroll schedule supplied", source: "Seller payroll", confidence: "Review" },
      { id: "lihtc", label: "Rent-limit source", value: "Confirm placed-in-service year", source: "Open question", confidence: "Missing" },
    ],
    scenarioRows: [
      { id: "bluffs-1", unitSet: "Illustrative LIHTC unit set", units: 9, currentRent: 920, maxLihtc: 1120, utilities: 95, scenarioOne: 1040 },
    ],
    audit: [
      { id: "bluffs-a1", label: "Reference fixture registered", detail: "Bluffs OM, T-12, rent roll, and payroll files are retained in the supplied source repository.", timestamp, kind: "source" },
      { id: "bluffs-a2", label: "Regression candidate added", detail: "Use this fixture to exercise a separate management-system layout after expected outputs are approved.", timestamp, kind: "review" },
    ],
  },
];
