// src/services/rules/ruleEngineProvider.ts
import axios from 'axios';
import { SubmissionDetail } from '../../types';
import RuleService from './ruleService';

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
    }
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
  }

  /**
   * Enable or disable the NAICS restriction rule
   * @param enabled Whether the rule should be enabled
   */
  setNaicsRuleEnabled(enabled: boolean): void {
    this.naicsRuleEnabled = enabled;
    console.log('NAICS rule enabled:', enabled);
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