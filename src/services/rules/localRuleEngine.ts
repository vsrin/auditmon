// src/services/rules/localRuleEngine.ts
import { 
    RuleEngineInterface, 
    Rule, 
    EvaluationResult, 
    ComplianceCheck 
  } from './ruleEngineInterface';
  
  export class LocalRuleEngine implements RuleEngineInterface {
    private rules: Rule[] = [];
    
    constructor() {
      // Initialize with default rules - in a real app this would load from a file or API
      // Note: These would match the existing rule logic in your current app
      this.rules = [
        {
          id: "risk_appetite_001",
          name: "Industry Risk Classification",
          description: "Validates if the industry is within acceptable risk appetite",
          category: "Risk Appetite",
          version: "1.0",
          lastUpdated: new Date().toISOString(),
          enabled: true,
          condition: {
            type: "expression",
            operator: "in",
            field: "insured.industry.code",
            values: ["5812", "7371", "6531"]
          },
          actions: [
            {
              type: "flag",
              severity: "warning",
              message: "Industry is in restricted list"
            }
          ]
        },
        // Add more rules that match your current logic
      ];
    }
    
    async evaluateSubmission(submission: any): Promise<EvaluationResult> {
      const checks: ComplianceCheck[] = [];
      let overallStatus = 'compliant';
      
      // Evaluate each rule against the submission
      for (const rule of this.rules.filter(r => r.enabled)) {
        const result = this.evaluateRule(rule, submission);
        
        if (result) {
          checks.push({
            checkId: rule.id,
            category: rule.category,
            status: result.severity === 'warning' ? 'at risk' : 
                   result.severity === 'error' ? 'non-compliant' : 'compliant',
            timestamp: new Date().toISOString(),
            findings: result.message,
            dataPoints: this.extractDataPoints(rule, submission)
          });
          
          // Update overall status
          if (result.severity === 'error' && overallStatus !== 'non-compliant') {
            overallStatus = 'non-compliant';
          } else if (result.severity === 'warning' && overallStatus === 'compliant') {
            overallStatus = 'at risk';
          }
        }
      }
      
      return {
        submissionId: submission.submissionId,
        timestamp: new Date().toISOString(),
        overallStatus,
        checks
      };
    }
    
    private evaluateRule(rule: Rule, submission: any): { severity: string, message: string } | null {
      const { condition, actions } = rule;
      
      // Simple evaluation logic
      if (this.evaluateCondition(condition, submission)) {
        // Rule condition was met, return the first action
        const action = actions[0];
        return {
          severity: action.severity,
          message: action.message
        };
      }
      
      return null;
    }
    
    private evaluateCondition(condition: any, data: any): boolean {
      if (!condition || !data) return false;
      
      const fieldValue = this.getFieldValue(condition.field, data);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.values[0];
        case 'notEquals':
          return fieldValue !== condition.values[0];
        case 'in':
          return Array.isArray(condition.values) && condition.values.includes(fieldValue);
        case 'notIn':
          return Array.isArray(condition.values) && !condition.values.includes(fieldValue);
        // Add more operators as needed
        default:
          return false;
      }
    }
    
    private getFieldValue(fieldPath: string, data: any): any {
      const parts = fieldPath.split('.');
      let value = data;
      
      for (const part of parts) {
        value = value && value[part];
        if (value === undefined) break;
      }
      
      return value;
    }
    
    private extractDataPoints(rule: Rule, submission: any): Record<string, any> {
      // Extract the relevant data points from the submission based on rule
      const result: Record<string, any> = {};
      
      // Example: Extract the field used in the condition
      if (rule.condition && rule.condition.field) {
        const fieldName = rule.condition.field.split('.').pop() || '';
        const fieldValue = this.getFieldValue(rule.condition.field, submission);
        
        if (fieldValue !== undefined) {
          result[fieldName] = fieldValue;
        }
      }
      
      // Add more contextual data as needed
      return result;
    }
    
    // Implement other RuleEngineInterface methods
    async getRule(ruleId: string): Promise<Rule> {
      const rule = this.rules.find(r => r.id === ruleId);
      if (!rule) throw new Error(`Rule not found: ${ruleId}`);
      return rule;
    }
    
    async getRules(category?: string): Promise<Rule[]> {
      if (category) {
        return this.rules.filter(r => r.category === category);
      }
      return this.rules;
    }
    
    async updateRule(rule: Rule): Promise<Rule> {
      const index = this.rules.findIndex(r => r.id === rule.id);
      if (index === -1) throw new Error(`Rule not found: ${rule.id}`);
      
      this.rules[index] = {
        ...rule,
        lastUpdated: new Date().toISOString()
      };
      
      return this.rules[index];
    }
    
    async createRule(rule: Rule): Promise<Rule> {
      // Ensure rule has all required fields
      if (!rule.id) throw new Error("Rule ID is required");
      
      // Check if rule with same ID already exists
      if (this.rules.some(r => r.id === rule.id)) {
        throw new Error(`Rule with ID ${rule.id} already exists`);
      }
      
      const newRule = {
        ...rule,
        version: rule.version || "1.0",
        lastUpdated: new Date().toISOString(),
        enabled: rule.enabled === undefined ? true : rule.enabled
      };
      
      this.rules.push(newRule);
      return newRule;
    }
    
    async deleteRule(ruleId: string): Promise<boolean> {
      const initialLength = this.rules.length;
      this.rules = this.rules.filter(r => r.id !== ruleId);
      return this.rules.length < initialLength;
    }
    
    async testRule(rule: Rule, data: any): Promise<any> {
      return this.evaluateRule(rule, data);
    }
  }