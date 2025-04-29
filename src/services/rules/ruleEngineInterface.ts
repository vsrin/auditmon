// src/services/rules/ruleEngineInterface.ts
import { AuditComplianceStatus, RuleImpactAnalysis } from '../../types/auditCompliance';

export interface Rule {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    lastUpdated: string;
    enabled: boolean;
    condition: RuleCondition;
    actions: RuleAction[];
    // New fields for audit compliance
    auditQuestionIds?: string[]; // IDs of related audit questions
    regulatoryReference?: string; // Reference to regulatory requirement
    businessImpact?: 'low' | 'medium' | 'high'; // Business impact of non-compliance
}
  
export interface RuleCondition {
    type: string;
    operator: string;
    field: string;
    values?: any[];
    // Other condition properties
}
  
export interface RuleAction {
    type: string;
    severity: string;
    message: string;
    // Other action properties
}
  
export interface EvaluationResult {
    submissionId: string;
    timestamp: string;
    overallStatus: string;
    checks: ComplianceCheck[];
}
  
export interface ComplianceCheck {
    checkId: string;
    category: string;
    status: string;
    timestamp: string;
    findings: string;
    dataPoints: Record<string, any>;
}
  
export interface RuleEngineInterface {
    // Existing methods
    evaluateSubmission(submission: any): Promise<EvaluationResult>;
    getRule(ruleId: string): Promise<Rule>;
    getRules(category?: string): Promise<Rule[]>;
    updateRule(rule: Rule): Promise<Rule>;
    createRule(rule: Rule): Promise<Rule>;
    deleteRule(ruleId: string): Promise<boolean>;
    testRule(rule: Rule, data: any): Promise<any>;
    
    // New methods for audit compliance
    getRulesByAuditQuestion?(questionId: string): Promise<Rule[]>;
    getAuditComplianceStatus?(submissionId: string): Promise<AuditComplianceStatus>;
    analyzeRuleImpact?(rule: Rule, originalRule: Rule | null, submissions: any[]): Promise<RuleImpactAnalysis>;
}