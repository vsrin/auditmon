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
   * Evaluates a submission against defined rules
   * @param submission The submission to evaluate
   * @returns Promise with evaluation results
   */
  async evaluateSubmission(submission: SubmissionDetail): Promise<{
    checks: any[];
    overallStatus: string;
  }> {
    if (this.useRemoteEngine) {
      console.log('Using remote rule engine for evaluation');
      return this.callRemoteRuleEngine(submission);
    } else {
      console.log('Using local rule engine for evaluation');
      return RuleService.evaluateSubmissionLocal(submission);
    }
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
      return {
        checks: response.data.checks || [],
        overallStatus: response.data.overallStatus || 'Unknown'
      };
    } catch (error) {
      console.error('Error calling remote rule engine:', error);
      // Fallback to local rule engine if remote fails
      console.log('Falling back to local rule engine');
      return RuleService.evaluateSubmissionLocal(submission);
    }
  }
}

// Export singleton instance
const ruleEngineProvider = new RuleEngineProvider();
export default ruleEngineProvider;