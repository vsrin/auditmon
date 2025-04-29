// src/services/rules/auditQuestions.ts
import { LifecycleStageDefinition, LifecycleStage, AuditQuestion } from '../../types/auditCompliance';

/**
 * Stage 1: Submission and Risk Assessment audit questions
 */
const stage1Questions: AuditQuestion[] = [
  {
    id: "doc-completeness",
    text: "Were submissions, applications and supplemental apps received?",
    description: "Verifies that all required submission documents have been received and are complete",
    stage: LifecycleStage.SubmissionRiskAssessment,
    structuredDataInputs: [
      "Document receipt timestamps",
      "Document type classifications",
      "Document repository index",
      "Application checklist status"
    ],
    unstructuredDataInputs: [
      "Actual submission documents",
      "Application forms",
      "Supplemental application documents",
      "Email correspondence"
    ],
    capturePoint: "Initial submission receipt",
    validationPoint: "Submission review completion",
    relevantRuleCategories: ["Document Completeness"]
  },
  {
    id: "risk-appetite",
    text: "Does risk selection reflect product line / portfolio management strategy and underwriting appetite?",
    description: "Ensures the submission aligns with defined risk appetite and underwriting strategy",
    stage: LifecycleStage.SubmissionRiskAssessment,
    structuredDataInputs: [
      "Prohibited business classes list",
      "Excluded perils list",
      "Product line strategy metrics",
      "Risk appetite thresholds",
      "Industry codes (SIC/NAICS)"
    ],
    unstructuredDataInputs: [
      "Underwriting guidelines documents",
      "Portfolio management strategy documents",
      "Underwriter notes on risk selection rationale",
      "Exception approval documentation"
    ],
    capturePoint: "Initial risk triage",
    validationPoint: "Before quote generation",
    relevantRuleCategories: ["Risk Appetite"]
  },
  {
    id: "industry-classification",
    text: "Was industry and occupational classification adequately assessed?",
    description: "Validates that the industry classification is accurate and properly evaluated",
    stage: LifecycleStage.SubmissionRiskAssessment,
    structuredDataInputs: [
      "SIC/NAICS codes in submission",
      "SIC/NAICS codes in rating model",
      "Industry classification data",
      "Occupational hazard ratings"
    ],
    unstructuredDataInputs: [
      "Industry assessment documentation",
      "Occupational risk evaluation notes",
      "Underwriter's industry-specific analysis"
    ],
    capturePoint: "Initial submission review",
    validationPoint: "Rating/pricing stage",
    relevantRuleCategories: ["Industry Classification"]
  },
  {
    id: "financial-strength",
    text: "Has the Insured's financial strength been analyzed?",
    description: "Confirms that financial analysis has been performed and meets guidelines",
    stage: LifecycleStage.SubmissionRiskAssessment,
    structuredDataInputs: [
      "Financial ratings (D&B, etc.)",
      "Financial ratio calculations",
      "Balance sheet metrics",
      "Income statement data points",
      "Financial guideline thresholds"
    ],
    unstructuredDataInputs: [
      "Financial statements",
      "D&B reports",
      "Credit rating agency reports",
      "Financial analysis documentation",
      "Approval documentation for exceptions"
    ],
    capturePoint: "Financial documentation review",
    validationPoint: "Prior to quoting",
    relevantRuleCategories: ["Financial Strength"]
  },
  {
    id: "loss-history",
    text: "Was an up-to-date loss history received and adequately analyzed?",
    description: "Verifies that loss history has been properly reviewed and assessed",
    stage: LifecycleStage.SubmissionRiskAssessment,
    structuredDataInputs: [
      "Loss history date stamps",
      "Loss run data points",
      "Loss ratio calculations",
      "Industry average loss benchmarks"
    ],
    unstructuredDataInputs: [
      "Loss run reports",
      "Loss analysis documentation",
      "Underwriter's notes on loss trends",
      "Claim details narratives"
    ],
    capturePoint: "Loss documentation review",
    validationPoint: "Prior to quoting",
    relevantRuleCategories: ["Loss History"]
  }
];

/**
 * Stage 2: Risk Engineering and Technical Assessment audit questions
 */
const stage2Questions: AuditQuestion[] = [
  {
    id: "risk-engineering",
    text: "Were Risk Engineering reviews ordered & received in a timely manner per guidelines?",
    description: "Confirms that required risk engineering assessments were completed appropriately",
    stage: LifecycleStage.RiskEngineeringTechnical,
    structuredDataInputs: [
      "Risk engineering request timestamps",
      "Risk engineering report receipt timestamps",
      "Risk engineering requirement flags",
      "Timeliness metrics vs. guidelines"
    ],
    unstructuredDataInputs: [
      "Risk engineering reports",
      "Risk mitigation recommendations",
      "Underwriter notes on engineering findings",
      "Risk improvement plans"
    ],
    capturePoint: "Risk engineering request",
    validationPoint: "Prior to final pricing",
    relevantRuleCategories: ["Risk Engineering"]
  },
  {
    id: "cat-exposure",
    text: "Has natural CAT exposure been underwritten per line of business guidelines?",
    description: "Ensures catastrophe exposure has been evaluated against established guidelines",
    stage: LifecycleStage.RiskEngineeringTechnical,
    structuredDataInputs: [
      "CAT model inputs",
      "CAT exposure calculations",
      "CAT exposure vs. thresholds",
      "Natural CAT premium adequacy metrics"
    ],
    unstructuredDataInputs: [
      "CAT modeling reports",
      "Reinsurance guidelines for CAT exposures",
      "Underwriter notes on CAT risks",
      "Exception documentation for CAT exposures"
    ],
    capturePoint: "CAT modeling stage",
    validationPoint: "Prior to binding",
    relevantRuleCategories: ["Natural CAT Exposure"]
  }
];

/**
 * Lifecycle stages with audit questions
 */
export const lifecycleStages: LifecycleStageDefinition[] = [
  {
    id: LifecycleStage.SubmissionRiskAssessment,
    name: "Submission and Risk Assessment",
    description: "Initial evaluation of submission and risk assessment",
    auditQuestions: stage1Questions
  },
  {
    id: LifecycleStage.RiskEngineeringTechnical,
    name: "Risk Engineering and Technical Assessment",
    description: "Technical risk assessment and engineering evaluation",
    auditQuestions: stage2Questions
  }
];

/**
 * Get all audit questions across all stages
 */
export const getAllAuditQuestions = (): AuditQuestion[] => {
  return lifecycleStages.flatMap(stage => stage.auditQuestions);
};

/**
 * Get audit questions for a specific stage
 */
export const getAuditQuestionsByStage = (stage: LifecycleStage): AuditQuestion[] => {
  const stageDefinition = lifecycleStages.find(s => s.id === stage);
  return stageDefinition ? stageDefinition.auditQuestions : [];
};

/**
 * Get an audit question by ID
 */
export const getAuditQuestionById = (id: string): AuditQuestion | undefined => {
  return getAllAuditQuestions().find(q => q.id === id);
};

/**
 * Map rule category to relevant audit questions
 */
export const getRuleCategoriesToAuditQuestions = (): Record<string, string[]> => {
  const mapping: Record<string, string[]> = {};
  
  getAllAuditQuestions().forEach(question => {
    question.relevantRuleCategories.forEach(category => {
      if (!mapping[category]) {
        mapping[category] = [];
      }
      if (!mapping[category].includes(question.id)) {
        mapping[category].push(question.id);
      }
    });
  });
  
  return mapping;
};