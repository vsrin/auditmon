// src/services/rules/ruleEngineInterface.ts
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
    evaluateSubmission(submission: any): Promise<EvaluationResult>;
    getRule(ruleId: string): Promise<Rule>;
    getRules(category?: string): Promise<Rule[]>;
    updateRule(rule: Rule): Promise<Rule>;
    createRule(rule: Rule): Promise<Rule>;
    deleteRule(ruleId: string): Promise<boolean>;
    testRule(rule: Rule, data: any): Promise<any>;
  }