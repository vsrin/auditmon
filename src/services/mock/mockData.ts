// src/services/mock/mockData.ts
import { Submission, SubmissionDetail, ComplianceCheck } from '../../types';
import { 
  AuditComplianceStatus, 
  LifecycleStage, 
  ComplianceStatus 
} from '../../types/auditCompliance';
import { lifecycleStages } from '../../services/rules/auditQuestions';

// Configure the exact counts to match dashboard metrics
const TOTAL_SUBMISSIONS = 42;
const COMPLIANT_COUNT = 28; // ~67%
const AT_RISK_COUNT = 10; // ~24%
// Using NON_COMPLIANT_COUNT in getStatusForIndex function
const NON_COMPLIANT_COUNT = 4; // ~9%

// Industry codes and descriptions
const industries = [
  { code: '6531', description: 'Real Estate' },
  { code: '7371', description: 'Technology Services' },
  { code: '3579', description: 'Office Equipment' },
  { code: '2834', description: 'Pharmaceutical Manufacturing' },
  { code: '1531', description: 'Construction' },
  { code: '8731', description: 'Research and Development' },
  { code: '4724', description: 'Travel Agency' },
  { code: '5411', description: 'Legal Services' },
  { code: '6211', description: 'Healthcare' },
  { code: '5812', description: 'Restaurants' }
];

// Document types
const documentTypes = [
  'Application Form',
  'Financial Statement',
  'Loss History',
  'Property Schedule',
  'Risk Assessment',
  'Certificates of Insurance',
  'SOV'
];

// Status distribution using NON_COMPLIANT_COUNT to make ESLint happy
const getStatusForIndex = (index: number): string => {
  if (index < COMPLIANT_COUNT) {
    return 'Compliant';
  } else if (index < COMPLIANT_COUNT + AT_RISK_COUNT) {
    return 'At Risk';
  } else if (index < COMPLIANT_COUNT + AT_RISK_COUNT + NON_COMPLIANT_COUNT) {
    return 'Non-Compliant';
  } else {
    return 'Unknown';
  }
};

// Generate mock submissions
export const mockSubmissions: Submission[] = Array.from({ length: TOTAL_SUBMISSIONS }, (_, index) => {
  // Select industry for this submission
  const industryIndex = index % industries.length;
  const industry = industries[industryIndex];
  
  // Generate submission ID
  const submissionId = `SUB-${100000 + index}`;
  
  // Determine status based on position to match counts
  const status = getStatusForIndex(index);
  
  // Generate timestamp within the last 30 days
  const date = new Date();
  date.setDate(date.getDate() - (index % 30));
  const timestamp = date.toISOString();
  
  // Create submission object
  return {
    submissionId,
    timestamp,
    status,
    broker: {
      name: `Broker ${(index % 10) + 1}`,
      email: `broker${(index % 10) + 1}@example.com`,
      code: `BR-${1000 + (index % 10)}`
    },
    insured: {
      name: `Insured Company ${index + 1}`,
      industry: {
        code: industry.code,
        description: industry.description
      },
      address: {
        street: `${1000 + index} Main St`,
        city: `City ${(index % 5) + 1}`,
        state: `State ${(index % 5) + 1}`,
        zip: `${10000 + index}`
      },
      yearsInBusiness: 5 + (index % 20),
      employeeCount: 50 + (index * 25)
    }
  };
});

// Create documents for a submission
const createDocumentsForSubmission = (submissionId: string, index: number) => {
  // Number of documents varies by submission
  const documentCount = 2 + (index % 4);
  
  return Array.from({ length: documentCount }, (_, docIndex) => {
    const documentTypeIndex = (index + docIndex) % documentTypes.length;
    
    return {
      id: `doc-${index * 10 + docIndex}`,
      name: `${documentTypes[documentTypeIndex]} - ${submissionId}`,
      type: documentTypes[documentTypeIndex],
      status: docIndex === 0 ? 'processed' : (docIndex === 1 ? 'pending' : 'error'),
      size: 100000 + (docIndex * 50000) // Document size in bytes
    };
  });
};

// Function to get detailed submission by ID
export const getMockSubmissionDetail = (id: string): SubmissionDetail | null => {
  // Find the base submission
  const baseSubmission = mockSubmissions.find(sub => sub.submissionId === id);
  
  if (!baseSubmission) {
    return null;
  }
  
  // Get index for document generation
  const index = mockSubmissions.indexOf(baseSubmission);
  
  // Create detailed submission
  const detailedSubmission: SubmissionDetail = {
    ...baseSubmission,
    coverage: {
      lines: ['Property', 'General Liability', 'Workers Compensation', 'Professional Liability'].slice(0, 1 + (index % 3)),
      effectiveDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      expirationDate: new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, 1).toISOString()
    },
    documents: createDocumentsForSubmission(id, index),
    complianceChecks: [] // Will be populated below
  };
  
  return detailedSubmission;
};

// Generate compliance checks for each submission
mockSubmissions.forEach(submission => {
  const status = submission.status?.toLowerCase() || 'compliant';
  let checks: ComplianceCheck[] = [];
  
  // Always include document completeness check
  checks.push({
    checkId: 'DOC-001',
    category: 'Document Completeness',
    status: status === 'compliant' ? 'compliant' : 'attention',
    findings: status === 'compliant' 
      ? 'All required documents have been provided.' 
      : 'Missing or incomplete documentation detected.',
    timestamp: submission.timestamp,
    dataPoints: {
      requiredDocuments: 'Financial Statements, SOV, Application',
      providedDocuments: status === 'compliant' ? 'Financial Statements, SOV, Application' : 'Financial Statements, Application'
    }
  });
  
  // Add risk appetite check
  checks.push({
    checkId: 'RISK-001',
    category: 'Risk Appetite',
    status: status === 'compliant' ? 'compliant' : (status === 'at risk' ? 'attention' : 'non-compliant'),
    findings: status === 'compliant' 
      ? `${submission.insured?.industry?.description || 'Unknown Industry'} is within appetite for the requested lines of business.` 
      : `${submission.insured?.industry?.description || 'Unknown Industry'} has risk factors that require additional review.`,
    timestamp: submission.timestamp,
    dataPoints: {
      industryCode: submission.insured?.industry?.code || 'Unknown',
      riskAppetite: status === 'compliant' ? 'Standard' : (status === 'at risk' ? 'Restricted' : 'Declined')
    }
  });
  
  // Add loss history check
  if (status !== 'compliant') {
    checks.push({
      checkId: 'LOSS-001',
      category: 'Loss History',
      status: status === 'at risk' ? 'attention' : 'non-compliant',
      findings: 'Loss history indicates potential underwriting concerns.',
      timestamp: submission.timestamp,
      dataPoints: {
        lossRatio: status === 'at risk' ? '65%' : '85%',
        lossCount: status === 'at risk' ? '3' : '7',
        largestLoss: status === 'at risk' ? '$125,000' : '$450,000'
      }
    });
  }
  
  // Store checks in object for retrieval
  const detail = getMockSubmissionDetail(submission.submissionId);
  if (detail) {
    detail.complianceChecks = checks;
  }
});

// =====================================================
// NEW AUDIT COMPLIANCE MOCK DATA FOR DEMO MODE
// =====================================================

// Generate mock audit compliance status for a submission
export const getMockAuditComplianceStatus = (submissionId: string): AuditComplianceStatus => {
  // Find the base submission to use its status
  const baseSubmission = mockSubmissions.find(sub => sub.submissionId === submissionId);
  const baseStatus = baseSubmission?.status?.toLowerCase() || 'compliant';
  
  // Generate a deterministic but seemingly random status based on submission ID
  const seed = submissionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const stageResults = lifecycleStages.map(stage => {
    const questionResults = stage.auditQuestions.map(question => {
      // Generate a deterministic status based on question ID and submission ID
      const questionSeed = question.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const combinedSeed = (seed + questionSeed) % 100;
      
      // Base status on submission status but with some variation
      let status: ComplianceStatus;
      if (baseStatus === 'compliant') {
        // Mostly compliant with some at-risk
        status = combinedSeed < 85 ? 'compliant' : 'at-risk';
      } else if (baseStatus === 'at risk') {
        // Mix of compliant, at-risk, and some non-compliant
        if (combinedSeed < 40) {
          status = 'compliant';
        } else if (combinedSeed < 85) {
          status = 'at-risk';
        } else {
          status = 'non-compliant';
        }
      } else {
        // Mostly non-compliant with some at-risk
        status = combinedSeed < 30 ? 'at-risk' : 'non-compliant';
      }
      
      // Generate findings based on status
      let findings = '';
      if (status === 'at-risk') {
        findings = `Potential issues identified with ${question.text.toLowerCase()}`;
      } else if (status === 'non-compliant') {
        findings = `Failed compliance check: ${question.text.toLowerCase()}`;
      } else if (status === 'compliant') {
        findings = `All compliance requirements met for ${question.text.toLowerCase()}`;
      } else {
        findings = 'No evaluation performed';
      }
      
      return {
        questionId: question.id,
        status,
        findings,
        triggeredRules: status !== 'compliant' ? [`mock-rule-${questionSeed % 10}`] : [],
        updatedAt: new Date().toISOString()
      };
    });
    
    // Determine overall status for stage
    let overallStatus: ComplianceStatus = 'compliant';
    if (questionResults.some(q => q.status === 'non-compliant')) {
      overallStatus = 'non-compliant';
    } else if (questionResults.some(q => q.status === 'at-risk')) {
      overallStatus = 'at-risk';
    } else if (questionResults.some(q => q.status as string === 'not-evaluated')) {
      overallStatus = 'not-evaluated';
    }
    
    return {
      stageId: stage.id,
      questionResults,
      overallStatus
    };
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
    timestamp: new Date().toISOString(),
    stageResults,
    overallStatus
  };
};

// Generate mock compliance metrics
export const getMockComplianceMetrics = () => {
  const stageMetrics: Record<LifecycleStage, Record<ComplianceStatus, number>> = {} as any;
  const questionMetrics: Record<string, Record<ComplianceStatus, number>> = {};
  
  // Calculate percentages based on our existing submission counts
  const total = TOTAL_SUBMISSIONS;
  const compliantPct = COMPLIANT_COUNT / total;
  const atRiskPct = AT_RISK_COUNT / total;
  const nonCompliantPct = NON_COMPLIANT_COUNT / total;
  
  // Initialize metrics for each stage
  lifecycleStages.forEach(stage => {
    // Distribute counts based on our existing ratios
    stageMetrics[stage.id] = {
      'compliant': Math.round(total * compliantPct),
      'at-risk': Math.round(total * atRiskPct),
      'non-compliant': Math.round(total * nonCompliantPct),
      'not-evaluated': 0 // None not evaluated for demo
    };
    
    // Initialize metrics for each question - with some variation
    stage.auditQuestions.forEach((question, index) => {
      // Add some variation to make it interesting
      const variation = (index % 3 - 1) * 0.1; // -0.1, 0, or 0.1
      
      questionMetrics[question.id] = {
        'compliant': Math.round(total * (compliantPct + variation)),
        'at-risk': Math.round(total * (atRiskPct + variation / 2)),
        'non-compliant': Math.round(total * (nonCompliantPct + variation / 2)),
        'not-evaluated': 0 // None not evaluated for demo
      };
      
      // Make sure we have at least 1 in each category for demo purposes
      if (questionMetrics[question.id]['compliant'] < 1) questionMetrics[question.id]['compliant'] = 1;
      if (questionMetrics[question.id]['at-risk'] < 1) questionMetrics[question.id]['at-risk'] = 1;
      if (questionMetrics[question.id]['non-compliant'] < 1) questionMetrics[question.id]['non-compliant'] = 1;
      
      // Make sure total adds up to TOTAL_SUBMISSIONS
      const currentTotal = Object.values(questionMetrics[question.id]).reduce((a, b) => a + b, 0);
      if (currentTotal !== total) {
        const diff = total - currentTotal;
        questionMetrics[question.id]['compliant'] += diff;
      }
    });
  });
  
  return { stageMetrics, questionMetrics };
};

// Create a named export object to avoid the ESLint warning
const mockDataExports = {
  mockSubmissions,
  getMockSubmissionDetail,
  getMockAuditComplianceStatus,
  getMockComplianceMetrics
};

export default mockDataExports;