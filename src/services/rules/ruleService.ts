// src/services/rules/ruleService.ts
import { SubmissionDetail, ComplianceCheckResult } from '../../types';

// Basic rule definitions
const rules = [
  {
    id: 'DOC-001',
    category: 'Document Completeness',
    condition: (submission: SubmissionDetail) => {
      // Check if financial statements are present
      return submission.documents.some(doc => 
        doc.type.toLowerCase().includes('financial') || 
        doc.name.toLowerCase().includes('financial')
      );
    },
    message: 'Financial statements are required',
    dataPoints: (submission: SubmissionDetail) => ({
      requiredDocuments: 'Financial Statements',
      availableDocuments: submission.documents.map(d => d.name).join(', ')
    })
  },
  {
    id: 'RISK-001',
    category: 'Risk Appetite',
    condition: (submission: SubmissionDetail) => {
      // Check for prohibited industry codes
      const prohibitedCodes = ['6531', '7371', '3579']; // Example prohibited codes
      return !prohibitedCodes.includes(submission.insured.industry.code);
    },
    message: 'Industry is outside risk appetite guidelines',
    dataPoints: (submission: SubmissionDetail) => ({
      industryCode: submission.insured.industry.code,
      industryDescription: submission.insured.industry.description
    })
  },
  {
    id: 'LOSS-001',
    category: 'Loss History Analysis',
    condition: (submission: SubmissionDetail) => {
      // This is a placeholder rule since we don't have loss history data
      // In a real application, you would check loss ratios, claim frequency, etc.
      return Math.random() > 0.5; // 50% chance of passing (just for demo)
    },
    message: 'Loss history indicates high risk profile',
    dataPoints: (submission: SubmissionDetail) => ({
      lossRatio: 'Not available',
      claimFrequency: 'Not available',
      largestLoss: 'Not available'
    })
  }
];

// Interface for rule engine response
interface RuleEngineResponse {
  checks: ComplianceCheckResult[];
  overallStatus: string;
}

class RuleService {
  static async evaluateSubmission(submission: SubmissionDetail): Promise<RuleEngineResponse> {
    try {
      console.log('Rule Engine evaluating submission:', submission.submissionId);
      
      const results: ComplianceCheckResult[] = [];
      
      // Evaluate each rule
      for (const rule of rules) {
        const isPassing = rule.condition(submission);
        
        results.push({
          checkId: rule.id,
          category: rule.category,
          status: isPassing ? 'compliant' : 'attention',
          findings: isPassing 
            ? `The submission meets the requirements for ${rule.category}`
            : rule.message,
          timestamp: new Date().toISOString(),
          dataPoints: rule.dataPoints(submission)
        });
      }
      
      // Determine overall status
      const hasFailures = results.some(r => r.status !== 'compliant');
      const overallStatus = hasFailures ? 'At Risk' : 'Compliant';
      
      return {
        checks: results,
        overallStatus
      };
    } catch (error) {
      console.error('Error in rule engine evaluation:', error);
      throw error;
    }
  }

  // Simple static method for local rule evaluation without API call
  static evaluateSubmissionLocal(submission: SubmissionDetail): RuleEngineResponse {
    console.log('Evaluating submission locally:', submission.submissionId);
    
    const results: ComplianceCheckResult[] = [];
    
    // Evaluate each rule
    for (const rule of rules) {
      try {
        const isPassing = rule.condition(submission);
        
        results.push({
          checkId: rule.id,
          category: rule.category,
          status: isPassing ? 'compliant' : 'attention',
          findings: isPassing 
            ? `The submission meets the requirements for ${rule.category}`
            : rule.message,
          timestamp: new Date().toISOString(),
          dataPoints: rule.dataPoints(submission)
        });
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        // Add a failed evaluation
        results.push({
          checkId: rule.id,
          category: rule.category,
          status: 'error',
          findings: 'Error evaluating this rule',
          timestamp: new Date().toISOString(),
          dataPoints: { error: 'Rule evaluation failed' }
        });
      }
    }
    
    // Determine overall status
    const hasFailures = results.some(r => r.status !== 'compliant');
    const overallStatus = hasFailures ? 'At Risk' : 'Compliant';
    
    return {
      checks: results,
      overallStatus
    };
  }
}

export default RuleService;