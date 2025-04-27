// src/services/rules/remoteRuleEngine.ts
import axios from 'axios';
import { 
  RuleEngineInterface, 
  Rule, 
  EvaluationResult
} from './ruleEngineInterface';

export class RemoteRuleEngine implements RuleEngineInterface {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
// src/services/rules/remoteRuleEngine.ts
async evaluateSubmission(submission: any): Promise<EvaluationResult> {
    try {
      console.log("Sending submission to remote rule engine:", submission);
      // Make sure the request body matches what your API expects
      const response = await axios.post(`${this.baseUrl}/evaluate`, { submission });
      console.log("Response from rule engine:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error evaluating submission:', error);
      throw new Error('Failed to evaluate submission with remote rule engine');
    }
  }
  
  async getRule(ruleId: string): Promise<Rule> {
    try {
      const response = await axios.get(`${this.baseUrl}/rules/${ruleId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching rule ${ruleId}:`, error);
      throw new Error(`Failed to get rule ${ruleId} from remote rule engine`);
    }
  }
  
  async getRules(category?: string): Promise<Rule[]> {
    try {
      const url = category 
        ? `${this.baseUrl}/rules?category=${encodeURIComponent(category)}`
        : `${this.baseUrl}/rules`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching rules:', error);
      throw new Error('Failed to get rules from remote rule engine');
    }
  }
  
  async updateRule(rule: Rule): Promise<Rule> {
    try {
      const response = await axios.put(`${this.baseUrl}/rules/${rule.id}`, rule);
      return response.data;
    } catch (error) {
      console.error(`Error updating rule ${rule.id}:`, error);
      throw new Error(`Failed to update rule ${rule.id} in remote rule engine`);
    }
  }
  
  async createRule(rule: Rule): Promise<Rule> {
    try {
      const response = await axios.post(`${this.baseUrl}/rules`, rule);
      return response.data;
    } catch (error) {
      console.error('Error creating rule:', error);
      throw new Error('Failed to create rule in remote rule engine');
    }
  }
  
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/rules/${ruleId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting rule ${ruleId}:`, error);
      throw new Error(`Failed to delete rule ${ruleId} from remote rule engine`);
    }
  }
  
  async testRule(rule: Rule, data: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/test-rule`, { rule, data });
      return response.data;
    } catch (error) {
      console.error('Error testing rule:', error);
      throw new Error('Failed to test rule with remote rule engine');
    }
  }
}