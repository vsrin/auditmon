// src/types/auditCompliance.ts

/**
 * Insurance lifecycle stages for audit compliance
 */
export enum LifecycleStage {
    SubmissionRiskAssessment = 1,
    RiskEngineeringTechnical = 2,
    PricingQuoting = 3,
    Binding = 4,
    PolicyIssuance = 5
  }
  
  /**
   * Interface for an audit question
   */
  export interface AuditQuestion {
    id: string;
    text: string;
    description: string;
    stage: LifecycleStage;
    structuredDataInputs: string[];
    unstructuredDataInputs: string[];
    capturePoint: string;
    validationPoint: string;
    relevantRuleCategories: string[];
  }
  
  /**
   * Interface for lifecycle stage with associated audit questions
   */
  export interface LifecycleStageDefinition {
    id: LifecycleStage;
    name: string;
    description: string;
    auditQuestions: AuditQuestion[];
  }
  
  /**
   * Status of compliance for a specific audit question
   */
  export type ComplianceStatus = 'compliant' | 'at-risk' | 'non-compliant' | 'not-evaluated';
  
  /**
   * Result of evaluating an audit question
   */
  export interface AuditQuestionResult {
    questionId: string;
    status: ComplianceStatus;
    triggeredRules: string[];
    findings: string;
    updatedAt: string;
  }
  
  /**
   * Results for a lifecycle stage
   */
  export interface StageComplianceResult {
    stageId: LifecycleStage;
    questionResults: AuditQuestionResult[];
    overallStatus: ComplianceStatus;
  }
  
  /**
   * Overall audit compliance status for a submission
   */
  export interface AuditComplianceStatus {
    submissionId: string;
    timestamp: string;
    stageResults: StageComplianceResult[];
    overallStatus: ComplianceStatus;
  }
  
  /**
   * Impact analysis for a rule change
   */
  export interface RuleImpactAnalysis {
    affectedSubmissions: number;
    beforeStatusCounts: Record<ComplianceStatus, number>;
    afterStatusCounts: Record<ComplianceStatus, number>;
    sampleAffected: {
      submissionId: string;
      insuredName: string;
      before: ComplianceStatus;
      after: ComplianceStatus;
    }[];
    auditQuestionImpact: {
      questionId: string;
      questionText: string;
      affectedCount: number;
    }[];
  }