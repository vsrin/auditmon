// src/types/index.ts

// Document interface
export interface Document {
  id: string;
  name: string;
  type: string;
  contentType?: string;
  size: number;
  status: string;
}

// ComplianceCheck interface
export interface ComplianceCheckResult {
  checkId: string;
  category: string;
  status: string;
  timestamp: string;
  findings: string;
  dataPoints: Record<string, any>;
}

// Basic submission data interface
export interface SubmissionData {
  submissionId: string;
  timestamp: string;
  broker: {
    name: string;
    email?: string;
  };
  insured: {
    name: string;
    industry: {
      code: string;
      description: string;
    };
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    yearsInBusiness?: number;
    employeeCount?: number;
  };
  coverage: {
    lines: string[];
    effectiveDate: string;
    expirationDate: string;
  };
  exposure?: {
    property?: {
      tiv: number;
      locationsCount: number;
    };
    generalLiability?: {
      limits: {
        eachOccurrence: number;
        generalAggregate: number;
      };
    };
  };
  documents: Document[];
  status: string;
}

// Full submission detail interface
export interface SubmissionDetail extends SubmissionData {
  complianceChecks: ComplianceCheckResult[];
}

// Config state interface
export interface ConfigState {
  isDemoMode: boolean;
  apiEndpoint: string;
  apiMapping: Record<string, any>;
  useRemoteRuleEngine: boolean;
  ruleEngineApiUrl: string;
}

// Submissions state interface
export interface SubmissionsState {
  submissions: SubmissionData[];
  selectedSubmission: SubmissionDetail | null;
  loading: boolean;
  error: string | null;
}

// Root state interface for Redux
export interface RootState {
  config: ConfigState;
  submissions: SubmissionsState;
}

// API response interface for handling external API responses
export interface ApiResponseData {
  [key: string]: any;
  compliance_checks?: any[];
}