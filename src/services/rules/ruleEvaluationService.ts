// src/services/rules/ruleEvaluationService.ts
import { SubmissionDetail, ComplianceCheck } from '../../types';
import { 
  AuditComplianceStatus,
  LifecycleStage,
  AuditQuestionResult,
  ComplianceStatus
} from '../../types/auditCompliance';
import ruleEngineProvider from './ruleEngineProvider';
import { 
  generateAuditComplianceStatus,
  determineAuditQuestionCompliance
} from './auditRuleMapping';
import { getAllAuditQuestions, getAuditQuestionsByStage } from './auditQuestions';
import { 
  getMockAuditComplianceStatus, 
  getMockComplianceMetrics 
} from '../mock/mockData';

// Cache for evaluation results
const evaluationCache = new Map<string, {
  timestamp: number,
  result: AuditComplianceStatus
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Evaluate a submission against audit compliance rules
 * @param submission The submission to evaluate
 * @param forceRefresh Whether to force a refresh (ignore cache)
 * @param isDemoMode Whether the app is in demo mode
 * @returns The audit compliance status
 */
export const evaluateAuditCompliance = async (
  submission: SubmissionDetail,
  forceRefresh: boolean = false,
  isDemoMode: boolean = false
): Promise<AuditComplianceStatus> => {
  const submissionId = submission.submissionId;

  // Check cache if refresh not forced
  if (!forceRefresh) {
    const cached = evaluationCache.get(submissionId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRATION) {
      return cached.result;
    }
  }

  try {
    let auditStatus: AuditComplianceStatus;
    
    // Use mock data in demo mode
    if (isDemoMode) {
      auditStatus = getMockAuditComplianceStatus(submissionId);
    } else {
      // Get base compliance check results
      const evaluationResult = await ruleEngineProvider.evaluateSubmission(submission);
      
      // Generate audit compliance status
      auditStatus = generateAuditComplianceStatus(
        submissionId,
        evaluationResult.checks
      );
    }
    
    // Cache the result
    evaluationCache.set(submissionId, {
      timestamp: Date.now(),
      result: auditStatus
    });
    
    return auditStatus;
  } catch (error) {
    console.error(`Error evaluating audit compliance for submission ${submissionId}:`, error);
    
    // Return a fallback "not evaluated" status
    const notEvaluatedStatus: AuditComplianceStatus = {
      submissionId,
      timestamp: new Date().toISOString(),
      overallStatus: 'not-evaluated',
      stageResults: []
    };
    
    // Add stages with "not evaluated" status
    const stages = Object.values(LifecycleStage).filter(v => typeof v === 'number') as LifecycleStage[];
    
    for (const stage of stages) {
      const questions = getAuditQuestionsByStage(stage);
      const questionResults: AuditQuestionResult[] = questions.map(q => ({
        questionId: q.id,
        status: 'not-evaluated',
        findings: 'Evaluation failed due to an error',
        triggeredRules: [],
        updatedAt: new Date().toISOString()
      }));
      
      notEvaluatedStatus.stageResults.push({
        stageId: stage,
        questionResults,
        overallStatus: 'not-evaluated'
      });
    }
    
    return notEvaluatedStatus;
  }
};

/**
 * Evaluate a specific audit question for a submission
 * @param submission The submission to evaluate
 * @param questionId The audit question ID
 * @param isDemoMode Whether the app is in demo mode
 * @returns The evaluation result for the specific question
 */
export const evaluateAuditQuestion = async (
  submission: SubmissionDetail,
  questionId: string,
  isDemoMode: boolean = false
): Promise<AuditQuestionResult> => {
  // In demo mode, get from mock compliance status
  if (isDemoMode) {
    const mockStatus = getMockAuditComplianceStatus(submission.submissionId);
    for (const stage of mockStatus.stageResults) {
      const questionResult = stage.questionResults.find(q => q.questionId === questionId);
      if (questionResult) {
        return questionResult;
      }
    }
  }
  
  // Get rules related to this question
  const rules = await ruleEngineProvider.getRulesByAuditQuestion(questionId);
  
  // Evaluate each rule
  const checks: ComplianceCheck[] = [];
  
  for (const rule of rules) {
    if (rule.enabled) {
      const result = await ruleEngineProvider.testRule(rule, submission);
      if (result) {
        checks.push({
          checkId: rule.id,
          category: rule.category,
          status: result.severity === 'warning' ? 'at-risk' : 
                 result.severity === 'error' ? 'non-compliant' : 'compliant',
          findings: result.message,
          timestamp: new Date().toISOString(),
          dataPoints: result.dataPoints || {}
        });
      }
    }
  }
  
  // Determine compliance based on checks
  const compliance = determineAuditQuestionCompliance(questionId, checks);
  
  return {
    questionId,
    status: compliance.status,
    findings: compliance.findings,
    triggeredRules: compliance.triggeredRules,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Clear the evaluation cache for a specific submission or all submissions
 * @param submissionId Optional submission ID to clear
 */
export const clearEvaluationCache = (submissionId?: string): void => {
  if (submissionId) {
    evaluationCache.delete(submissionId);
  } else {
    evaluationCache.clear();
  }
};

/**
 * Calculate compliance metrics across multiple submissions
 * @param submissions Array of submissions
 * @param isDemoMode Whether the app is in demo mode
 * @returns Compliance metrics by stage and question
 */
export const calculateComplianceMetrics = async (
  submissions: SubmissionDetail[],
  isDemoMode: boolean = false
): Promise<{
  stageMetrics: Record<LifecycleStage, Record<ComplianceStatus, number>>,
  questionMetrics: Record<string, Record<ComplianceStatus, number>>
}> => {
  // In demo mode, return mock metrics
  if (isDemoMode) {
    return getMockComplianceMetrics();
  }
  
  // Initialize metrics
  const stageMetrics: Record<LifecycleStage, Record<ComplianceStatus, number>> = {} as any;
  const questionMetrics: Record<string, Record<ComplianceStatus, number>> = {};
  
  // Initialize status counts for each stage
  const stages = Object.values(LifecycleStage).filter(v => typeof v === 'number') as LifecycleStage[];
  for (const stage of stages) {
    stageMetrics[stage] = {
      'compliant': 0,
      'at-risk': 0,
      'non-compliant': 0,
      'not-evaluated': 0
    };
  }
  
  // Initialize status counts for each question
  const allQuestions = getAllAuditQuestions();
  for (const question of allQuestions) {
    questionMetrics[question.id] = {
      'compliant': 0,
      'at-risk': 0,
      'non-compliant': 0,
      'not-evaluated': 0
    };
  }
  
  // Process each submission
  for (const submission of submissions) {
    try {
      const auditStatus = await evaluateAuditCompliance(submission, false, isDemoMode);
      
      // Update stage metrics
      for (const stageResult of auditStatus.stageResults) {
        stageMetrics[stageResult.stageId][stageResult.overallStatus]++;
        
        // Update question metrics
        for (const questionResult of stageResult.questionResults) {
          questionMetrics[questionResult.questionId][questionResult.status]++;
        }
      }
    } catch (error) {
      console.error(`Error calculating compliance metrics for submission ${submission.submissionId}:`, error);
      // Skip this submission and continue with others
    }
  }
  
  return {
    stageMetrics,
    questionMetrics
  };
};