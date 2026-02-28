

export type Status = 'Pending' | 'In Progress' | 'Completed' | 'Critical' | 'Closed' | 'Released' | 'Rejected' | 'Pass' | 'Fail' | 'Approved' | 'Under Review' | 'Effective' | 'Draft' | 'Submitted' | 'Issued' | 'Archived' | 'Quarantine' | 'Superseded';

export type MeaningOfSignature = 'Authorship' | 'Review' | 'Approval' | 'Verification' | 'Witnessing' | 'Technical Release' | 'Line Clearance';

// Added Module type for App and Layout components
export type Module = 'dashboard' | 'deviations' | 'audits' | 'risk' | 'oos' | 'capa' | 'stability' | 'coa-manager' | 'ipqc-comp' | 'batch-records' | 'ai-advisor' | 'notifications' | 'changes' | 'audit-trail' | 'recall' | 'regulatory' | 'inventory' | 'lims' | 'warehouse' | 'archive';

export interface BMRStep {
  id: string;
  operation: string;
  instruction: string;
  equipmentId?: string;
  limit?: string;
  category: 'Preparation' | 'Processing' | 'QC' | 'Packaging';
  signOffBy?: string;
  signOffDate?: string;
  checkedBy?: string;
  checkedDate?: string;
  observation?: string;
  isCritical: boolean;
}

export interface Ingredient {
  materialName: string;
  qtyPerUnit: string; 
  theoreticalQty: string; 
  unit: string;
  lotNo?: string;
}

export interface MFR {
  id: string;
  productName: string;
  productCode: string;
  documentNo: string;
  revision: string;
  version: string;
  dosageForm: string;
  shelfLife: string;
  batchSize: string;
  effectiveDate: string;
  ingredients: Ingredient[];
  packagingMaterials: Ingredient[]; 
  steps: BMRStep[];
  packagingSteps: BMRStep[]; 
  status: Status;
  approvals: { name: string; designation: string; meaning: MeaningOfSignature }[];
  description: string;
  composition: string;
}

export interface BMRRecord {
  id: string;
  mfrId: string;
  batchNumber: string;
  productName: string;
  issuedBy: string;
  issuanceDate: string;
  status: Status;
  steps: BMRStep[];
  packagingSteps: BMRStep[];
  ingredients: Ingredient[];
  packagingMaterials: Ingredient[];
  lineClearance: {
    verifiedBy?: string;
    verifiedDate?: string;
    status: boolean;
  };
}

export interface User {
  username: string;
  fullName: string;
  role: string;
  department: string;
  email: string;
}

// Updated AuditTrailEntry to include previous/new values and reason for change
export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  recordId?: string;
  previousValue?: string;
  newValue?: string;
  reasonForChange?: string;
}

// Added Deviation interface for Deviations component
export interface Deviation {
  id: string;
  number: string;
  date: string;
  department: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: Status;
  capaId?: string;
  closedDate?: string;
  aiAnalysis?: {
    rootCause: string;
    correctiveAction: string;
    preventiveAction: string;
  };
}

// Added RiskRegisterEntry interface for RiskAssessment component
export interface RiskHistoryEntry {
  date: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  mitigation: string;
  residualRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface RiskRegisterEntry {
  id: string;
  processStep: string;
  hazard: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  mitigation: string;
  residualRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  status: Status;
  date: string;
  history?: RiskHistoryEntry[];
}

// Added Material interface for COASection component
export interface Material {
  id: string;
  name: string;
  specs: { t: string; s: string; r: string }[];
  micro?: boolean;
  microSpecs?: { t: string; s: string; r: string }[];
}

// Added IPQCData interface for IPQCSystem component
export interface IPQCData {
  id: string;
  batchNumber: string;
  productName: string;
  analysisNumber: string;
  sampleId: string;
  productionStage: string;
  manufacturer: string;
  pharmacopoeia: string;
  testName: string;
  readings: number[];
  mean: string;
  sd: string;
  cpk: string;
  status: 'PASS' | 'FAIL' | 'MARGINAL';
  timestamp: string;
  extraData?: {
    dosageForm: string;
  };
}

// Added Notification interfaces for Notification services and components
export interface Notification {
  id: string;
  type: 'Email' | 'System';
  category: 'Deviation' | 'CAPA' | 'Task' | 'Audit';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  recipient: string;
}

export interface NotificationPreferences {
  emailOnCriticalDeviation: boolean;
  emailOnCapaAssignment: boolean;
  emailOnOverdueTask: boolean;
  systemAlertsEnabled: boolean;
}

// Added ChangeRequest interfaces for ChangeControl component
export interface ChangeTask {
  id: string;
  description: string;
  owner: string;
  status: 'Open' | 'Completed';
}

export interface ChangeRequest {
  id: string;
  number: string;
  title: string;
  description: string;
  category: 'Process' | 'Equipment' | 'Facility' | 'IT' | 'Document' | 'Analytical';
  status: Status;
  priority: 'Minor' | 'Major' | 'Critical';
  riskScore?: number;
  impacts: string[];
  dateInitiated: string;
  initiatedBy: string;
  tasks: ChangeTask[];
}

// Added CAPA interface for CAPAManager component
export interface CAPA {
  id: string;
  number: string;
  source: 'Deviation' | 'Audit' | 'OOS';
  sourceRef: string;
  description: string;
  type: 'Corrective' | 'Preventive';
  owner: string;
  dueDate: string;
  status: Status;
  verificationDate?: string;
}

// Added StabilityStudy interface for StabilityManager component
export interface StabilityStudy {
  id: string;
  product: string;
  batchNumber: string;
  condition: string;
  startDate: string;
  nextTimePoint: string;
  status: 'Ongoing' | 'Completed' | 'Stopped';
  protocolId: string;
  intervals: string[];
}

// Added COA related interfaces for COAManager component
export interface MaterialSpec {
  t: string;
  s: string;
  r: string;
  status: 'pass' | 'fail' | 'Pending' | 'N/A';
  category: 'Descriptive' | 'Physical' | 'Chemical' | 'Microbiological';
}

export interface COAAttachment {
  name: string;
  type: string;
  data?: string;
}

/**
 * Fixed: Added shelfLife and status properties to COARecord to match usage in components/COAManager.tsx
 */
export type COAType = 'Finished Product' | 'Raw Material' | 'Water Analysis' | 'Microbiology' | 'Utilities' | 'API';

export interface COARecord {
  id: string;
  coaNumber: string;
  productName: string;
  genericName?: string;
  strength?: string;
  dosageForm: string;
  batchNumber: string;
  batchSize: string;
  mfgDate?: string;
  expiryDate?: string;
  issueDate?: string;
  category: COAType;
  specs: MaterialSpec[];
  releasedBy: string;
  releaseDate: string;
  expDate: string;
  storageCondition: string;
  manufacturer: string;
  manufacturerAddress?: string;
  manufacturerId?: string;
  sampleId?: string;
  analysisNo?: string;
  mfrNo?: string;
  attachments?: COAAttachment[];
  shelfLife?: string;
  status: Status;
  marketComplaintStatus?: string;
  analyzedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
}

// Added InventoryItem interface for MaterialManager component
export interface InventoryItem {
  id: string;
  name: string;
  category: 'API' | 'Excipient' | 'Packaging' | 'Consumable';
  lotNumber: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  status: 'Quarantine' | 'Approved' | 'Rejected' | 'Expired';
  expiryDate: string;
  manufacturerName: string;
  manufacturerAddress: string;
  manufacturerId: string;
  batchSize?: string;
  storageCondition: string;
  coaDocument?: COAAttachment;
}

// Added LIMSSample interface for LIMS component
export interface LIMSSample {
  id: string;
  sampleNo: string;
  productName: string;
  batchNo: string;
  type: 'Raw Material' | 'In-Process' | 'Finished Product' | 'Stability';
  status: 'Logged' | 'Testing' | 'Review' | 'Released' | 'Rejected';
  analyst: string;
  dateLogged: string;
}

export interface AuditRecord {
  id: string;
  department: string;
  date: string;
  status: Status;
  checklist: { checkItem: string; regulatoryRef: string; completed: boolean }[];
  auditor: string;
}
