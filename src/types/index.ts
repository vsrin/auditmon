// src/types/index.ts
export interface Broker {
    name: string;
    email: string;
  }
  
  export interface Industry {
    code: string;
    description: string;
  }
  
  export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
  }
  
  export interface Insured {
    name: string;
    industry: Industry;
    address: Address;
    yearsInBusiness?: number;
    employeeCount?: number;
  }
  
  export interface Coverage {
    lines: string[];
    effectiveDate: string;
    expirationDate: string;
  }
  
  export interface Document {
    id: string;
    name: string;
    type: string;
    contentType: string;
    size: number;
    status: 'processed' | 'pending' | 'failed';
    extractedData?: Record<string, any>;
  }
  
  export interface ComplianceCheckResult {
    checkId: string;
    category: string;
    status: 'compliant' | 'attention' | 'non-compliant';
    findings: string;
    timestamp: string;
    dataPoints: Record<string, any>;
  }
  
  export interface SubmissionData {
    submissionId: string;
    timestamp: string;
    broker: Broker;
    insured: Insured;
    coverage: Coverage;
    exposure: Record<string, any>;
    documents: Document[];
    status: string;
  }
  
  export interface SubmissionDetail extends SubmissionData {
    complianceChecks: ComplianceCheckResult[];
    financialAnalysis?: Record<string, any>;
    lossHistory?: Record<string, any>;
  }
  
  export type ComplianceStatus = 'compliant' | 'attention' | 'non-compliant';