// src/services/rules/ruleEngineProvider.ts
import axios from 'axios';
import { Submission, SubmissionDetail } from '../../types';
import RuleService from './ruleService';
import { RemoteRuleEngine } from './remoteRuleEngine';
import { LocalRuleEngine } from './localRuleEngine';
import { Rule } from './ruleEngineInterface';
import { 
  AuditComplianceStatus, 
  RuleImpactAnalysis 
} from '../../types/auditCompliance';
import { 
  generateAuditComplianceStatus 
} from './auditRuleMapping';
import { 
  analyzeRuleImpact 
} from './ruleImpactAnalysis';
import {
  clearEvaluationCache
} from './ruleEvaluationService';
import {
  clearRuleCache,
  clearRuleQuestionMappingCache
} from './ruleCacheService';

/**
 * RuleEngineProvider provides a unified interface for accessing rule engine functionality
 * whether local or remote.
 */
class RuleEngineProvider {
  private useRemoteEngine: boolean = false;
  private ruleEngineApiUrl: string = '';
  private currentDemoMode: boolean = true; // Default to demo mode
  
  // Cache for restricted NAICS codes
  private restrictedNaicsCodes: string[] = ['6531', '7371', '3579']; // Default restricted codes
  private naicsRuleEnabled: boolean = true;

  constructor() {
    this.useRemoteEngine = false;
    this.ruleEngineApiUrl = '';
  }

  /**
   * Configure the rule engine provider
   * @param useRemote Whether to use a remote rule engine
   * @param apiUrl The URL for the remote rule engine API
   */
  configure(useRemote: boolean, apiUrl: string): void {
    this.useRemoteEngine = useRemote;
    this.ruleEngineApiUrl = apiUrl;
    console.log(`Rule engine configured: useRemote=${useRemote}, apiUrl=${apiUrl}`);
    
    // Clear caches when configuration changes
    this.clearAllCaches();
  }

  /**
   * Set the current demo mode
   * @param isDemoMode Whether the application is in demo mode
   */
  setDemoMode(isDemoMode: boolean): void {
    const wasChanged = this.currentDemoMode !== isDemoMode;
    this.currentDemoMode = isDemoMode;
    if (wasChanged) {
      console.log(`Rule engine demo mode set to: ${isDemoMode ? 'DEMO' : 'LIVE'}`);
      
      // Clear caches when mode changes
      this.clearAllCaches();
    }
  }

  /**
   * Clear all caches
   */
  private clearAllCaches(): void {
    clearEvaluationCache();
    clearRuleCache();
    clearRuleQuestionMappingCache();
  }

  /**
   * Get the current demo mode
   * @returns Whether the application is in demo mode
   */
  isDemoMode(): boolean {
    return this.currentDemoMode;
  }

  /**
   * Update the list of restricted NAICS codes
   * @param codes The new list of restricted NAICS codes
   */
  updateRestrictedNaicsCodes(codes: string[]): void {
    this.restrictedNaicsCodes = codes;
    console.log('Updated restricted NAICS codes:', codes);
    
    // Clear evaluation cache since rules have changed
    clearEvaluationCache();
  }

  /**
   * Enable or disable the NAICS restriction rule
   * @param enabled Whether the rule should be enabled
   */
  setNaicsRuleEnabled(enabled: boolean): void {
    this.naicsRuleEnabled = enabled;
    console.log('NAICS rule enabled:', enabled);
    
    // Clear evaluation cache since rules have changed
    clearEvaluationCache();
  }

  /**
   * Get the current list of restricted NAICS codes
   * @returns The list of restricted NAICS codes
   */
  getRestrictedNaicsCodes(): string[] {
    return this.restrictedNaicsCodes;
  }

  /**
   * Check if the NAICS restriction rule is enabled
   * @returns Whether the rule is enabled
   */
  isNaicsRuleEnabled(): boolean {
    return this.naicsRuleEnabled;
  }

  /**
   * Get a single rule by ID
   * @param ruleId The rule ID
   * @returns The rule if found
   */
  async getRule(ruleId: string): Promise<Rule> {
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      return remoteEngine.getRule(ruleId);
    } else {
      const localEngine = new LocalRuleEngine();
      return localEngine.getRule(ruleId);
    }
  }
  
  /**
   * Get all rules, optionally filtered by category
   * @param category Optional category filter
   * @returns Array of rules
   */
  async getRules(category?: string): Promise<Rule[]> {
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      return remoteEngine.getRules(category);
    } else {
      const localEngine = new LocalRuleEngine();
      return localEngine.getRules(category);
    }
  }
  
  /**
   * Create a new rule
   * @param rule The rule to create
   * @returns The created rule
   */
  async createRule(rule: Rule): Promise<Rule> {
    let createdRule: Rule;
    
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      createdRule = await remoteEngine.createRule(rule);
    } else {
      const localEngine = new LocalRuleEngine();
      createdRule = await localEngine.createRule(rule);
    }
    
    // Clear caches since rules have changed
    clearRuleCache();
    clearEvaluationCache();
    
    return createdRule;
  }
  
  /**
   * Update an existing rule
   * @param rule The rule to update
   * @returns The updated rule
   */
  async updateRule(rule: Rule): Promise<Rule> {
    let updatedRule: Rule;
    
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      updatedRule = await remoteEngine.updateRule(rule);
    } else {
      const localEngine = new LocalRuleEngine();
      updatedRule = await localEngine.updateRule(rule);
    }
    
    // Clear caches since rules have changed
    clearRuleCache();
    clearEvaluationCache();
    
    return updatedRule;
  }
  
  /**
   * Delete a rule
   * @param ruleId The ID of the rule to delete
   * @returns Whether the deletion was successful
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    let success: boolean;
    
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      success = await remoteEngine.deleteRule(ruleId);
    } else {
      const localEngine = new LocalRuleEngine();
      success = await localEngine.deleteRule(ruleId);
    }
    
    // Clear caches since rules have changed
    if (success) {
      clearRuleCache();
      clearEvaluationCache();
    }
    
    return success;
  }
  
  /**
   * Test a rule against data
   * @param rule The rule to test
   * @param data The data to test against
   * @returns The test result
   */
  async testRule(rule: Rule, data: any): Promise<any> {
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      return remoteEngine.testRule(rule, data);
    } else {
      const localEngine = new LocalRuleEngine();
      return localEngine.testRule(rule, data);
    }
  }

  /**
   * Get rules for a specific audit question
   * @param questionId The audit question ID
   * @returns Rules related to the audit question
   */
  async getRulesByAuditQuestion(questionId: string): Promise<Rule[]> {
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      if (remoteEngine.getRulesByAuditQuestion) {
        return remoteEngine.getRulesByAuditQuestion(questionId);
      }
    } 
    
    // Fallback to local rule engine or if remote doesn't support this method
    const localEngine = new LocalRuleEngine();
    if (localEngine.getRulesByAuditQuestion) {
      return localEngine.getRulesByAuditQuestion(questionId);
    }
    
    // Fallback: fetch all rules and filter client-side
    const allRules = await this.getRules();
    return allRules.filter(rule => 
      rule.auditQuestionIds && rule.auditQuestionIds.includes(questionId)
    );
  }

  /**
   * Get audit compliance status for a submission
   * @param submission The submission to evaluate
   * @returns Audit compliance status
   */
  async getAuditComplianceStatus(submission: SubmissionDetail): Promise<AuditComplianceStatus> {
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      if (remoteEngine.getAuditComplianceStatus) {
        try {
          return await remoteEngine.getAuditComplianceStatus(submission);
        } catch (error) {
          console.error('Error getting audit compliance status from remote engine:', error);
          // Fall through to local evaluation
        }
      }
    }
    
    // Fallback to local evaluation
    // First evaluate the submission
    const evaluationResult = await this.evaluateSubmission(submission);
    
    // Then generate audit compliance status from those checks
    return generateAuditComplianceStatus(
      submission.submissionId,
      evaluationResult.checks
    );
  }

  /**
   * Analyze the impact of a rule change
   * @param rule The new or modified rule
   * @param originalRule The original rule (if modifying)
   * @param submissions Submissions to analyze
   * @returns Impact analysis
   */
  async analyzeRuleImpact(
    rule: Rule,
    originalRule: Rule | null,
    submissions: Submission[]
  ): Promise<RuleImpactAnalysis> {
    if (this.useRemoteEngine && !this.currentDemoMode) {
      const remoteEngine = new RemoteRuleEngine(this.ruleEngineApiUrl);
      if (remoteEngine.analyzeRuleImpact) {
        try {
          return await remoteEngine.analyzeRuleImpact(rule, originalRule, submissions);
        } catch (error) {
          console.error('Error analyzing rule impact with remote engine:', error);
          // Fall through to local analysis
        }
      }
    }
    
    // Fallback to local analysis
    return analyzeRuleImpact(
      rule,
      originalRule,
      submissions,
      this.currentDemoMode,
      this.ruleEngineApiUrl
    );
  }

  /**
   * Evaluates a submission against defined rules
   * @param submission The submission to evaluate
   * @returns Promise with evaluation results
   */
  async evaluateSubmission(submission: SubmissionDetail): Promise<{
    checks: any[];
    overallStatus: string;
  }> {
    console.log(`Rule engine evaluating submission: ${submission.submissionId}, Mode: ${this.currentDemoMode ? 'DEMO' : 'LIVE'}`);
    
    if (this.useRemoteEngine && !this.currentDemoMode) {
      console.log('Using remote rule engine for evaluation');
      return this.callRemoteRuleEngine(submission);
    } else {
      console.log('Using local rule engine for evaluation');
      // First, get the standard evaluation
      const standardEvaluation = await RuleService.evaluateSubmissionLocal(submission);
      
      // Then, apply the NAICS rule if it's enabled
      if (this.naicsRuleEnabled) {
        return this.applyNaicsRule(submission, standardEvaluation);
      }
      
      return standardEvaluation;
    }
  }

  /**
   * Apply the NAICS restriction rule to the evaluation result
   * @param submission The submission to evaluate
   * @param evaluation The initial evaluation result
   * @returns The updated evaluation result
   */
  private applyNaicsRule(submission: SubmissionDetail, evaluation: { checks: any[], overallStatus: string }): { checks: any[], overallStatus: string } {
    // Check if the submission's industry code is in the restricted list
    const industryCode = submission.insured?.industry?.code;
    
    if (industryCode && this.restrictedNaicsCodes.includes(industryCode)) {
      // Industry is restricted, mark as non-compliant
      const naicsCheck = {
        checkId: 'NAICS-RESTRICT-001',
        category: 'Risk Appetite',
        status: 'non-compliant',
        findings: `Industry code ${industryCode} is in the restricted list`,
        timestamp: new Date().toISOString(),
        dataPoints: {
          industryCode: industryCode,
          industryDescription: submission.insured?.industry?.description || '',
          restrictedCodes: this.restrictedNaicsCodes.join(', ')
        }
      };
      
      // Add the check to the list
      const updatedChecks = [...evaluation.checks, naicsCheck];
      
      // Update the overall status to non-compliant
      return {
        checks: updatedChecks,
        overallStatus: 'Non-Compliant'
      };
    }
    
    // Industry is not restricted, no change to evaluation
    return evaluation;
  }

  /**
   * Calls the remote rule engine API
   * @param submission The submission to evaluate
   * @returns Promise with evaluation results
   */
  private async callRemoteRuleEngine(submission: SubmissionDetail): Promise<{
    checks: any[];
    overallStatus: string;
  }> {
    try {
      console.log(`Calling remote rule engine at ${this.ruleEngineApiUrl}`);
      const response = await axios.post(`${this.ruleEngineApiUrl}/api/evaluate`, {
        submission: submission
      });

      console.log('Remote rule engine response:', response.data);
      
      // Apply NAICS rule to remote evaluation if enabled
      if (this.naicsRuleEnabled) {
        return this.applyNaicsRule(submission, {
          checks: response.data.checks || [],
          overallStatus: response.data.overallStatus || 'Unknown'
        });
      }
      
      return {
        checks: response.data.checks || [],
        overallStatus: response.data.overallStatus || 'Unknown'
      };
    } catch (error) {
      console.error('Error calling remote rule engine:', error);
      // Fallback to local rule engine if remote fails
      console.log('Falling back to local rule engine');
      const localEvaluation = await RuleService.evaluateSubmissionLocal(submission);
      
      // Apply NAICS rule to local evaluation if enabled
      if (this.naicsRuleEnabled) {
        return this.applyNaicsRule(submission, localEvaluation);
      }
      
      return localEvaluation;
    }
  }

  /**
   * Fetch restricted codes from backend
   */
  async fetchRestrictedCodesFromBackend(): Promise<void> {
    try {
      console.log('Fetching restricted NAICS codes from backend');
      // This would be implemented to connect to your backend API
      // For now, we'll just use the default codes
      return Promise.resolve();
    } catch (error) {
      console.error('Error fetching restricted codes:', error);
      return Promise.resolve();
    }
  }
}

// Export singleton instance
const ruleEngineProvider = new RuleEngineProvider();
export default ruleEngineProvider;