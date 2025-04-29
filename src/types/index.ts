// src/types/index.ts

// Define industry interface with code property
export interface Industry {
  code?: string;
  description?: string;
}

// Define address interface
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// Define insured party interface
export interface Insured {
  name?: string;
  industry?: Industry;
  address?: Address;
  yearsInBusiness?: number;
  employeeCount?: number;
}

// Define broker interface
export interface Broker {
  name?: string;
  code?: string;
  email?: string; // Added email field to match usage in apiService
}

// Define coverage interface
export interface Coverage {
  lines?: string[];
  effectiveDate?: string;
  expirationDate?: string;
}

// Define document interface
export interface Document {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  size?: number;
}

// Define data points interface for compliance checks
export interface DataPoints {
  [key: string]: string | number | boolean | null | undefined;
}

// Define compliance check interface
export interface ComplianceCheck {
  checkId?: string;
  category?: string;
  status?: string;
  findings?: string;
  timestamp?: string;
  dataPoints?: DataPoints;
}

// Alias ComplianceCheckResult to ComplianceCheck for backward compatibility
export type ComplianceCheckResult = ComplianceCheck;

// Define base submission interface (used for list view)
export interface Submission {
  submissionId: string;
  insured?: Insured;
  broker?: Broker;
  timestamp: string;
  status?: string;
}

// Alias SubmissionData to Submission for backward compatibility
export type SubmissionData = Submission;

// Define detailed submission interface (used for detail view)
export interface SubmissionDetail extends Submission {
  coverage?: Coverage;
  documents?: Document[];
  complianceChecks?: ComplianceCheck[];
}

// Define configuration state interface
export interface ConfigState {
  isDemoMode: boolean;
  apiEndpoint: string;
  apiMapping: Record<string, any>;
  useRemoteRuleEngine: boolean;
  ruleEngineApiUrl: string;
}

// Export audit compliance types
export * from './auditCompliance';