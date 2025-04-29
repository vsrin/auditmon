// src/services/rules/ruleEvaluationPipeline.ts
import { SubmissionDetail } from '../../types';
import { Rule } from './ruleEngineInterface';
import { 
  AuditComplianceStatus, 
  LifecycleStage,
  StageComplianceResult
} from '../../types/auditCompliance';
import ruleEngineProvider from './ruleEngineProvider';
import { evaluateAuditCompliance } from './ruleEvaluationService';
import { 
  getCachedRules, 
  cacheRules,
  getCachedRuleQuestionMapping,
  cacheRuleQuestionMapping
} from './ruleCacheService';
import { mapRuleToAuditQuestions } from './auditRuleMapping';
import { getAuditQuestionsByStage } from './auditQuestions';

/**
 * Process a submission through the complete rule evaluation pipeline
 * @param submission The submission to evaluate
 * @returns The audit compliance status
 */
export const processSubmission = async (
  submission: SubmissionDetail
): Promise<AuditComplianceStatus> => {
  console.log(`Processing submission ${submission.submissionId} through rule evaluation pipeline`);
  
  // Step 1: Evaluate submission against all rules
  const complianceStatus = await evaluateAuditCompliance(submission);
  
  // Step 2: Log results
  logComplianceResults(submission.submissionId, complianceStatus);
  
  return complianceStatus;
};

/**
 * Get rules for a specific stage
 * @param stage The lifecycle stage
 * @returns Rules applicable to the stage
 */
export const getRulesForStage = async (
  stage: LifecycleStage
): Promise<Rule[]> => {
  // Get questions for this stage
  const questions = getAuditQuestionsByStage(stage);
  const questionCategories = questions.flatMap(q => q.relevantRuleCategories);
  
  // Get rules for these categories
  const allRules: Rule[] = [];
  
  for (const category of questionCategories) {
    // Check cache first
    let rules = getCachedRules(category);
    
    if (!rules) {
      // Not in cache, fetch from provider
      rules = await ruleEngineProvider.getRules(category);
      
      // Cache for future use
      cacheRules(category, rules);
    }
    
    // Add to our collection, avoiding duplicates
    for (const rule of rules) {
      if (!allRules.some(r => r.id === rule.id)) {
        allRules.push(rule);
      }
    }
  }
  
  return allRules;
};

/**
 * Map rules to audit questions with caching
 * @param rules Array of rules to map
 * @returns Mapping of rule IDs to question IDs
 */
export const mapRulesToAuditQuestionsWithCache = (
  rules: Rule[]
): Record<string, string[]> => {
  const mapping: Record<string, string[]> = {};
  
  for (const rule of rules) {
    // Check cache first
    let questionIds = getCachedRuleQuestionMapping(rule.id);
    
    if (!questionIds) {
      // Not in cache, compute mapping
      questionIds = rule.auditQuestionIds || mapRuleToAuditQuestions(rule);
      
      // Cache for future use
      cacheRuleQuestionMapping(rule.id, questionIds);
    }
    
    mapping[rule.id] = questionIds;
  }
  
  return mapping;
};

/**
 * Log compliance results for a submission
 * @param submissionId The submission ID
 * @param status The audit compliance status
 */
const logComplianceResults = (
  submissionId: string,
  status: AuditComplianceStatus
): void => {
  console.log(`Compliance status for submission ${submissionId}: ${status.overallStatus}`);
  
  for (const stageResult of status.stageResults) {
    console.log(`- Stage ${stageResult.stageId}: ${stageResult.overallStatus}`);
    
    const nonCompliantQuestions = stageResult.questionResults
      .filter(q => q.status !== 'compliant');
    
    if (nonCompliantQuestions.length > 0) {
      console.log(`  Non-compliant questions:`);
      for (const question of nonCompliantQuestions) {
        console.log(`  - ${question.questionId}: ${question.status}`);
        console.log(`    Findings: ${question.findings}`);
      }
    }
  }
};

/**
 * Filter applicable rules for a submission
 * @param submission The submission to check
 * @param rules Array of rules to filter
 * @returns Rules applicable to the submission
 */
export const filterApplicableRules = (
  submission: SubmissionDetail,
  rules: Rule[]
): Rule[] => {
  // This is a placeholder for more sophisticated filtering logic
  // In the future, this could check submission attributes to determine
  // which rules are relevant based on business logic
  
  // For now, we'll just return all enabled rules
  return rules.filter(rule => rule.enabled);
};