// src/services/rules/ruleCacheService.ts
import { Rule } from './ruleEngineInterface';
import { AuditQuestion } from '../../types/auditCompliance';
import { getAllAuditQuestions } from './auditQuestions';

// Cache for rules
const ruleCache = new Map<string, {
  timestamp: number,
  rules: Rule[]
}>();

// Cache for audit questions
const questionCache = new Map<string, AuditQuestion>();

// Cache for rule-to-question mappings
const ruleQuestionMappingCache = new Map<string, string[]>();

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000;

/**
 * Cache rules for a category
 * @param category The rule category
 * @param rules The rules to cache
 */
export const cacheRules = (category: string, rules: Rule[]): void => {
  ruleCache.set(category, {
    timestamp: Date.now(),
    rules
  });
};

/**
 * Get cached rules for a category
 * @param category The rule category
 * @returns The cached rules, or null if expired/not found
 */
export const getCachedRules = (category: string): Rule[] | null => {
  const cached = ruleCache.get(category);
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRATION) {
    return cached.rules;
  }
  return null;
};

/**
 * Clear the rule cache for a specific category or all categories
 * @param category Optional category to clear
 */
export const clearRuleCache = (category?: string): void => {
  if (category) {
    ruleCache.delete(category);
  } else {
    ruleCache.clear();
  }
};

/**
 * Initialize the audit question cache
 */
export const initializeQuestionCache = (): void => {
  const allQuestions = getAllAuditQuestions();
  for (const question of allQuestions) {
    questionCache.set(question.id, question);
  }
};

/**
 * Get an audit question from cache
 * @param questionId The question ID
 * @returns The audit question, or undefined if not found
 */
export const getCachedQuestion = (questionId: string): AuditQuestion | undefined => {
  return questionCache.get(questionId);
};

/**
 * Cache the mapping between a rule and audit questions
 * @param ruleId The rule ID
 * @param questionIds Array of question IDs
 */
export const cacheRuleQuestionMapping = (ruleId: string, questionIds: string[]): void => {
  ruleQuestionMappingCache.set(ruleId, questionIds);
};

/**
 * Get cached mapping between rule and audit questions
 * @param ruleId The rule ID
 * @returns Array of question IDs, or null if not cached
 */
export const getCachedRuleQuestionMapping = (ruleId: string): string[] | null => {
  return ruleQuestionMappingCache.get(ruleId) || null;
};

/**
 * Clear the rule-question mapping cache
 */
export const clearRuleQuestionMappingCache = (): void => {
  ruleQuestionMappingCache.clear();
};

// Initialize the question cache when the module is loaded
initializeQuestionCache();