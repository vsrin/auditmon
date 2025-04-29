// src/services/rules/auditRuleMapping.ts
import { Rule } from './ruleEngineInterface';
import { 
  AuditQuestion, 
  AuditQuestionResult, 
  ComplianceStatus, 
  StageComplianceResult, 
  AuditComplianceStatus, 
  LifecycleStage 
} from '../../types/auditCompliance';
import { ComplianceCheck } from '../../types';
import { 
  getAllAuditQuestions, 
  getAuditQuestionsByStage, 
  getRuleCategoriesToAuditQuestions 
} from './auditQuestions';

/**
 * Maps a rule to relevant audit questions
 * @param rule The rule to map
 * @returns Array of audit question IDs
 */
export const mapRuleToAuditQuestions = (rule: Rule): string[] => {
  const categoryMapping = getRuleCategoriesToAuditQuestions();
  
  // Direct mapping by category
  if (categoryMapping[rule.category]) {
    return categoryMapping[rule.category];
  }
  
  // Try to infer based on keywords in rule name/description
  const allQuestions = getAllAuditQuestions();
  const relatedQuestions: string[] = [];
  
  allQuestions.forEach(question => {
    // Check for keyword matches in rule name/description
    const ruleText = `${rule.name.toLowerCase()} ${rule.description.toLowerCase()}`;
    const questionKeywords = question.text.toLowerCase().split(' ')
      .filter(word => word.length > 4) // Only consider significant words
      .map(word => word.replace(/[^a-z0-9]/g, '')); // Remove punctuation
    
    const matchScore = questionKeywords.reduce((score, keyword) => {
      return ruleText.includes(keyword) ? score + 1 : score;
    }, 0);
    
    // If we have a reasonable match, include this question
    if (matchScore >= 2) {
      relatedQuestions.push(question.id);
    }
  });
  
  return relatedQuestions;
};

/**
 * Maps a compliance check to relevant audit questions
 * @param check The compliance check
 * @returns Array of audit question IDs
 */
export const mapComplianceCheckToAuditQuestions = (check: ComplianceCheck): string[] => {
  const categoryMapping = getRuleCategoriesToAuditQuestions();
  
  // Direct mapping by category
  if (check.category && categoryMapping[check.category]) {
    return categoryMapping[check.category];
  }
  
  return [];
};

/**
 * Determine compliance status for a specific audit question based on related checks
 * @param questionId The audit question ID
 * @param checks Array of compliance checks
 * @returns The compliance status and related findings
 */
export const determineAuditQuestionCompliance = (
  questionId: string, 
  checks: ComplianceCheck[]
): { status: ComplianceStatus, findings: string, triggeredRules: string[] } => {
  // Get the audit question
  const allQuestions = getAllAuditQuestions();
  const question = allQuestions.find(q => q.id === questionId);
  
  if (!question) {
    return { 
      status: 'not-evaluated', 
      findings: 'Audit question not defined',
      triggeredRules: []
    };
  }
  
  // Find checks related to this question's categories
  const relatedChecks = checks.filter(check => {
    if (!check.category) return false;
    return question.relevantRuleCategories.includes(check.category);
  });
  
  if (relatedChecks.length === 0) {
    return {
      status: 'not-evaluated',
      findings: 'No compliance checks performed for this audit question',
      triggeredRules: []
    };
  }
  
  // Determine overall status
  let worstStatus: ComplianceStatus = 'compliant';
  const failedChecks: ComplianceCheck[] = [];
  const triggeredRules: string[] = [];
  
  relatedChecks.forEach(check => {
    if (check.checkId) {
      triggeredRules.push(check.checkId);
    }
    
    if (check.status === 'non-compliant') {
      worstStatus = 'non-compliant';
      failedChecks.push(check);
    } else if (check.status === 'at-risk' && worstStatus === 'compliant') {
      worstStatus = 'at-risk';
      failedChecks.push(check);
    }
  });
  
  // Compile findings
  let findings = '';
  if (failedChecks.length > 0) {
    findings = failedChecks.map(check => check.findings).join('; ');
  } else {
    findings = 'All compliance checks passed';
  }
  
  return {
    status: worstStatus,
    findings,
    triggeredRules
  };
};

/**
 * Generate audit compliance status for all stages based on compliance checks
 * @param submissionId The submission ID
 * @param checks Array of compliance checks
 * @returns Complete audit compliance status
 */
export const generateAuditComplianceStatus = (
  submissionId: string,
  checks: ComplianceCheck[]
): AuditComplianceStatus => {
  const timestamp = new Date().toISOString();
  const stageResults: StageComplianceResult[] = [];
  
  // Process Stage 1: Submission and Risk Assessment
  const stage1Questions = getAuditQuestionsByStage(LifecycleStage.SubmissionRiskAssessment);
  const stage1Results: AuditQuestionResult[] = stage1Questions.map(question => {
    const compliance = determineAuditQuestionCompliance(question.id, checks);
    return {
      questionId: question.id,
      status: compliance.status,
      findings: compliance.findings,
      triggeredRules: compliance.triggeredRules,
      updatedAt: timestamp
    };
  });
  
  // Process Stage 2: Risk Engineering and Technical Assessment
  const stage2Questions = getAuditQuestionsByStage(LifecycleStage.RiskEngineeringTechnical);
  const stage2Results: AuditQuestionResult[] = stage2Questions.map(question => {
    const compliance = determineAuditQuestionCompliance(question.id, checks);
    return {
      questionId: question.id,
      status: compliance.status,
      findings: compliance.findings,
      triggeredRules: compliance.triggeredRules,
      updatedAt: timestamp
    };
  });
  
  // Determine overall status for each stage
  const getStageStatus = (results: AuditQuestionResult[]): ComplianceStatus => {
    if (results.some(r => r.status === 'non-compliant')) return 'non-compliant';
    if (results.some(r => r.status === 'at-risk')) return 'at-risk';
    if (results.some(r => r.status === 'not-evaluated')) {
      return results.some(r => r.status === 'compliant') ? 'at-risk' : 'not-evaluated';
    }
    return 'compliant';
  };
  
  const stage1Status = getStageStatus(stage1Results);
  const stage2Status = getStageStatus(stage2Results);
  
  stageResults.push({
    stageId: LifecycleStage.SubmissionRiskAssessment,
    questionResults: stage1Results,
    overallStatus: stage1Status
  });
  
  stageResults.push({
    stageId: LifecycleStage.RiskEngineeringTechnical,
    questionResults: stage2Results,
    overallStatus: stage2Status
  });
  
  // Determine overall submission compliance status
  let overallStatus: ComplianceStatus = 'compliant';
  if (stageResults.some(s => s.overallStatus === 'non-compliant')) {
    overallStatus = 'non-compliant';
  } else if (stageResults.some(s => s.overallStatus === 'at-risk')) {
    overallStatus = 'at-risk';
  } else if (stageResults.some(s => s.overallStatus === 'not-evaluated')) {
    overallStatus = 'not-evaluated';
  }
  
  return {
    submissionId,
    timestamp,
    stageResults,
    overallStatus
  };
};