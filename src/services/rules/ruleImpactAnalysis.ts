// src/services/rules/ruleImpactAnalysis.ts
import { Rule } from './ruleEngineInterface';
import { Submission, SubmissionDetail } from '../../types';
import { 
  ComplianceStatus, 
  RuleImpactAnalysis, 
  AuditComplianceStatus 
} from '../../types/auditCompliance';
import { RemoteRuleEngine } from './remoteRuleEngine';
import { LocalRuleEngine } from './localRuleEngine';
import { generateAuditComplianceStatus } from './auditRuleMapping';
import { getAllAuditQuestions } from './auditQuestions';

/**
 * Analyze the impact of a rule change on submissions
 * @param rule The rule to analyze (new or modified)
 * @param originalRule The original rule (if modifying)
 * @param submissions Array of submissions to analyze
 * @param isDemoMode Whether in demo mode
 * @param ruleEngineUrl The rule engine URL for live mode
 * @returns Impact analysis results
 */
export const analyzeRuleImpact = async (
  rule: Rule,
  originalRule: Rule | null,
  submissions: Submission[],
  isDemoMode: boolean,
  ruleEngineUrl: string
): Promise<RuleImpactAnalysis> => {
  // Initialize result structure
  const result: RuleImpactAnalysis = {
    affectedSubmissions: 0,
    beforeStatusCounts: {
      'compliant': 0,
      'at-risk': 0,
      'non-compliant': 0,
      'not-evaluated': 0
    },
    afterStatusCounts: {
      'compliant': 0,
      'at-risk': 0,
      'non-compliant': 0,
      'not-evaluated': 0
    },
    sampleAffected: [],
    auditQuestionImpact: []
  };
  
  // Keep track of audit questions that might be affected
  const affectedQuestionCounts: Record<string, number> = {};
  const allQuestions = getAllAuditQuestions();
  
  // Process each submission - limit to 100 for performance
  const submissionsToAnalyze = submissions.slice(0, 100);
  const auditStatusMap: Record<string, { before: AuditComplianceStatus, after: AuditComplianceStatus }> = {};
  
  // Create the appropriate rule engine
  const ruleEngine = isDemoMode 
    ? new LocalRuleEngine()
    : new RemoteRuleEngine(ruleEngineUrl);
  
  // For each submission
  for (const submission of submissionsToAnalyze) {
    // We need the full submission detail for rule evaluation
    const submissionDetail = submission as SubmissionDetail;
    
    // Evaluate with original rules (if any)
    let beforeChecks: any[] = [];
    if (originalRule) {
      const beforeResult = await ruleEngine.testRule(originalRule, submissionDetail);
      if (beforeResult) {
        beforeChecks = [beforeResult];
      }
    }
    
    // Evaluate with new rule
    const afterResult = await ruleEngine.testRule(rule, submissionDetail);
    const afterChecks = afterResult ? [afterResult] : [];
    
    // Generate audit compliance status before and after
    const beforeStatus = generateAuditComplianceStatus(
      submissionDetail.submissionId,
      beforeChecks
    );
    
    const afterStatus = generateAuditComplianceStatus(
      submissionDetail.submissionId,
      afterChecks
    );
    
    // Store for later analysis
    auditStatusMap[submissionDetail.submissionId] = {
      before: beforeStatus,
      after: afterStatus
    };
    
    // Count overall status changes
    result.beforeStatusCounts[beforeStatus.overallStatus]++;
    result.afterStatusCounts[afterStatus.overallStatus]++;
    
    // Check if status changed
    const statusChanged = beforeStatus.overallStatus !== afterStatus.overallStatus;
    if (statusChanged) {
      result.affectedSubmissions++;
      
      // Add to sample if we haven't collected too many yet
      if (result.sampleAffected.length < 10) {
        result.sampleAffected.push({
          submissionId: submissionDetail.submissionId,
          insuredName: submissionDetail.insured?.name || 'Unknown',
          before: beforeStatus.overallStatus,
          after: afterStatus.overallStatus
        });
      }
      
      // Record which audit questions were affected
      afterStatus.stageResults.forEach(stage => {
        stage.questionResults.forEach(question => {
          const beforeQuestion = beforeStatus.stageResults
            .find(s => s.stageId === stage.stageId)?.questionResults
            .find(q => q.questionId === question.questionId);
          
          if (beforeQuestion && beforeQuestion.status !== question.status) {
            // This question's status changed
            if (!affectedQuestionCounts[question.questionId]) {
              affectedQuestionCounts[question.questionId] = 0;
            }
            affectedQuestionCounts[question.questionId]++;
          }
        });
      });
    }
  }
  
  // Compile audit question impact data
  result.auditQuestionImpact = Object.entries(affectedQuestionCounts).map(([questionId, count]) => {
    const question = allQuestions.find(q => q.id === questionId);
    return {
      questionId,
      questionText: question?.text || 'Unknown question',
      affectedCount: count
    };
  });
  
  return result;
};