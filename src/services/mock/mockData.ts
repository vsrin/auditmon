// src/services/mock/mockData.ts
import { Submission, SubmissionDetail, ComplianceCheck } from '../../types';
import { 
  AuditComplianceStatus, 
  LifecycleStage, 
  ComplianceStatus 
} from '../../types/auditCompliance';
import { lifecycleStages } from '../../services/rules/auditQuestions';
import ruleEngineProvider from '../rules/ruleEngineProvider';

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

// Realistic company names for demo data
const companyNames = [
  'Horizon Properties LLC',
  'TechVision Systems Inc.',
  'Pacific Office Solutions',
  'MediPharm Laboratories',
  'Cornerstone Construction Group',
  'Innovate Research Partners',
  'Worldwide Travel Associates',
  'Montgomery & Associates Legal',
  'Wellness Medical Center',
  'Bistro Restaurant Group',
  'Riverfront Development Corp',
  'Synergy Software Solutions',
  'Premier Equipment Supply',
  'BioScience Innovations',
  'Highland Builders Inc.',
  'Quantum Analytics Group',
  'Elite Travel Services',
  'Justice Partners LLP',
  'Community Health Network',
  'Urban Dining Concepts',
  'Atlas Property Management',
  'Digital Frontier Technologies',
  'Modern Office Interiors',
  'Advanced Medical Research',
  'Continental Construction LLC',
  'Discovery Research Institute',
  'Voyager Travel Consultants',
  'Thompson Legal Associates',
  'Integrated Health Systems',
  'Gourmet Hospitality Group',
  'Metropolitan Housing Corp',
  'Cloud Networks Inc.',
  'Workspace Solutions LLC',
  'Nova Pharmaceutical Group',
  'Foundation Building Services',
  'Catalyst Research Partners',
  'Global Travel Specialists',
  'Addison Law Partners',
  'Precision Healthcare Group',
  'Savory Restaurant Holdings',
  'Landmark Properties Trust',
  'Nexus Technology Solutions'
];

// Broker names
const brokerNames = [
  'Smith & Associates',
  'Global Risk Partners',
  'Allstate Insurance',
  'Meridian Brokerage',
  'Guardian Insurance',
  'Pinnacle Risk Solutions',
  'Heritage Insurance Group',
  'Liberty Risk Management',
  'Alliance Insurance Partners',
  'Safeguard Insurance Group'
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

// Generate realistic, varied timestamps for demo data
const generateRealisticTimestamp = (index: number): string => {
  const now = new Date();
  
  // Create a variety of submission dates:
  // - More recent submissions (last 7 days): 40%
  // - Medium-term submissions (8-30 days): 40%
  // - Older submissions (31-90 days): 20%
  
  let dayOffset: number;
  
  if (index % 10 < 4) {
    // More recent (0-7 days ago)
    dayOffset = index % 7;
  } else if (index % 10 < 8) {
    // Medium-term (8-30 days ago)
    dayOffset = 8 + (index % 23);
  } else {
    // Older (31-90 days ago)
    dayOffset = 31 + (index % 60);
  }
  
  // Add some hour/minute variation
  const hourOffset = (index * 2) % 24;
  const minuteOffset = (index * 7) % 60;
  
  const date = new Date(now);
  date.setDate(date.getDate() - dayOffset);
  date.setHours(9 + hourOffset); // Business hours (9am - 9pm)
  date.setMinutes(minuteOffset);
  
  return date.toISOString();
};

// Generate mock submissions with realistic data
export const mockSubmissions: Submission[] = Array.from({ length: TOTAL_SUBMISSIONS }, (_, index) => {
  // Select industry for this submission
  const industryIndex = index % industries.length;
  const industry = industries[industryIndex];
  
  // Generate submission ID
  const submissionId = `SUB-${100000 + index}`;
  
  // Determine status based on position to match counts
  const status = getStatusForIndex(index);
  
  // Generate timestamp with realistic distribution
  const timestamp = generateRealisticTimestamp(index);
  
  // Select company name
  const companyName = companyNames[index % companyNames.length];
  
  // Select broker
  const brokerIndex = index % brokerNames.length;
  
  // Create submission object
  return {
    submissionId,
    timestamp,
    status,
    broker: {
      name: brokerNames[brokerIndex],
      email: `broker@${brokerNames[brokerIndex].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      code: `BR-${1000 + brokerIndex}`
    },
    insured: {
      name: companyName,
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

// Check if a submission's industry is restricted by the current rule engine settings
const isIndustryRestricted = (industryCode?: string): boolean => {
  if (!industryCode) return false;
  
  if (!ruleEngineProvider || !ruleEngineProvider.isNaicsRuleEnabled) {
    return false;
  }
  
  // Check if the rule is enabled first
  const isRuleEnabled = ruleEngineProvider.isNaicsRuleEnabled();
  if (!isRuleEnabled) return false;
  
  // Get the current restricted NAICS codes
  const restrictedCodes = ruleEngineProvider.getRestrictedNaicsCodes();
  return restrictedCodes.includes(industryCode);
};

// Determine the live status based on rule engine state
const getLiveComplianceStatus = (submission: Submission): string => {
  // Check if the submission's industry is restricted
  if (isIndustryRestricted(submission.insured?.industry?.code)) {
    return 'Non-Compliant';
  }
  
  // If not restricted by industry, use original status or default to Compliant
  return submission.status || 'Compliant';
};

// Generate compliance checks based on current rule engine state and submission
const generateComplianceChecks = (submission: Submission, liveStatus: string): ComplianceCheck[] => {
  const status = liveStatus.toLowerCase();
  const checks: ComplianceCheck[] = [];
  
  // Document Completeness - Include for all submissions
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
  
  // Risk Appetite - Directly tied to industry restrictions
  const industryCode = submission.insured?.industry?.code;
  const isRestricted = isIndustryRestricted(industryCode);
  
  checks.push({
    checkId: 'RISK-001',
    category: 'Risk Appetite',
    // Status is 'non-compliant' if industry is restricted
    status: isRestricted ? 'non-compliant' : (status === 'at risk' ? 'attention' : 'compliant'),
    findings: isRestricted
      ? `${submission.insured?.industry?.description || 'Unknown Industry'} is on the restricted industry list. This submission is outside of risk appetite.`
      : status === 'at risk'
        ? `${submission.insured?.industry?.description || 'Unknown Industry'} requires additional review for risk appetite.`
        : `${submission.insured?.industry?.description || 'Unknown Industry'} is within appetite for the requested lines of business.`,
    timestamp: submission.timestamp,
    dataPoints: {
      industryCode: submission.insured?.industry?.code || 'Unknown',
      riskAppetite: isRestricted ? 'Declined' : (status === 'at risk' ? 'Restricted' : 'Standard')
    }
  });
  
  // Loss History - Include for at risk and non-compliant submissions
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
  
  // Additional check for non-compliant submissions not caused by restricted industry
  if (status === 'non-compliant' && !isRestricted) {
    checks.push({
      checkId: 'UW-001',
      category: 'Underwriting Guidelines',
      status: 'non-compliant',
      findings: 'Submission does not meet underwriting guidelines for this line of business.',
      timestamp: submission.timestamp,
      dataPoints: {
        guidelines: 'Standard Property Guidelines',
        exceptions: '3',
        severity: 'High'
      }
    });
  }
  
  return checks;
};

// Predefined lines of business
const linesOfBusiness = [
  'Property', 
  'General Liability', 
  'Workers Compensation', 
  'Professional Liability',
  'Cyber Liability',
  'Directors & Officers',
  'Employment Practices',
  'Umbrella'
];

// Function to get detailed submission by ID - WITH LIVE RULE ENGINE INTEGRATION
export const getMockSubmissionDetail = (id: string): SubmissionDetail | null => {
  // Find the base submission
  const baseSubmission = mockSubmissions.find(sub => sub.submissionId === id);
  
  if (!baseSubmission) {
    return null;
  }
  
  // Get index for document generation
  const index = mockSubmissions.indexOf(baseSubmission);
  
  // Determine the current compliance status based on rule engine
  const liveStatus = getLiveComplianceStatus(baseSubmission);
  
  // Select lines of business based on index for variety but deterministic results
  const selectedLines = [];
  const lineCount = 1 + (index % 4); // 1 to 4 lines
  
  for (let i = 0; i < lineCount; i++) {
    const lineIndex = (index + i) % linesOfBusiness.length;
    selectedLines.push(linesOfBusiness[lineIndex]);
  }
  
  // Create detailed submission
  const detailedSubmission: SubmissionDetail = {
    ...baseSubmission,
    // Update status based on current rule engine state
    status: liveStatus,
    coverage: {
      lines: selectedLines,
      effectiveDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      expirationDate: new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, 1).toISOString()
    },
    documents: createDocumentsForSubmission(id, index),
    // Generate compliance checks based on current rule engine state
    complianceChecks: generateComplianceChecks(baseSubmission, liveStatus)
  };
  
  return detailedSubmission;
};

// =====================================================
// NEW AUDIT COMPLIANCE MOCK DATA FOR DEMO MODE
// =====================================================

// Generate mock audit compliance status for a submission
export const getMockAuditComplianceStatus = (submissionId: string): AuditComplianceStatus => {
  // Find the base submission to use its status
  const baseSubmission = mockSubmissions.find(sub => sub.submissionId === submissionId);
  
  // Get the live status based on current rule engine state
  const liveStatus = baseSubmission ? getLiveComplianceStatus(baseSubmission).toLowerCase() : 'compliant';
  
  // Generate a deterministic but seemingly random status based on submission ID
  const seed = submissionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const stageResults = lifecycleStages.map(stage => {
    const questionResults = stage.auditQuestions.map(question => {
      // Generate a deterministic status based on question ID and submission ID
      const questionSeed = question.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const combinedSeed = (seed + questionSeed) % 100;
      
      // Base status on submission status but with some variation
      let status: ComplianceStatus;
      if (liveStatus === 'compliant') {
        // Mostly compliant with some at-risk
        status = combinedSeed < 85 ? 'compliant' : 'at-risk';
      } else if (liveStatus === 'at risk') {
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
      
      // Special case for risk appetite question when industry is restricted
      if (
        baseSubmission && 
        isIndustryRestricted(baseSubmission.insured?.industry?.code) && 
        (question.text.toLowerCase().includes('risk appetite') || 
         question.text.toLowerCase().includes('underwriting appetite'))
      ) {
        status = 'non-compliant';
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
  // Count submissions in each category based on current rule engine state
  const submissionStatusCounts = {
    compliant: 0,
    'at-risk': 0,
    'non-compliant': 0,
    'not-evaluated': 0
  };
  
  mockSubmissions.forEach(sub => {
    const status = getLiveComplianceStatus(sub).toLowerCase();
    if (status === 'compliant') {
      submissionStatusCounts.compliant++;
    } else if (status === 'at risk') {
      submissionStatusCounts['at-risk']++;
    } else if (status === 'non-compliant') {
      submissionStatusCounts['non-compliant']++;
    } else {
      submissionStatusCounts['not-evaluated']++;
    }
  });
  
  const stageMetrics: Record<LifecycleStage, Record<ComplianceStatus, number>> = {} as any;
  const questionMetrics: Record<string, Record<ComplianceStatus, number>> = {};
  
  // Calculate percentages based on our current counts
  const total = TOTAL_SUBMISSIONS;
  const compliantPct = submissionStatusCounts.compliant / total;
  const atRiskPct = submissionStatusCounts['at-risk'] / total;
  const nonCompliantPct = submissionStatusCounts['non-compliant'] / total;
  
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

// Function to generate reports data for the Reports component
export const getReportsData = () => {
  // 1. Compliance Status Distribution based on current rule engine state
  const complianceDistribution = {
    compliant: 0,
    atRisk: 0,
    nonCompliant: 0
  };
  
  // Count submissions in each category based on current rule engine state
  mockSubmissions.forEach(sub => {
    const liveStatus = getLiveComplianceStatus(sub).toLowerCase();
    if (liveStatus === 'compliant') {
      complianceDistribution.compliant++;
    } else if (liveStatus === 'at risk') {
      complianceDistribution.atRisk++;
    } else if (liveStatus === 'non-compliant') {
      complianceDistribution.nonCompliant++;
    }
  });
  
  // 2. Document Status Distribution
  const documentStatusCounts = {
    processed: 0,
    pending: 0,
    failed: 0
  };
  
  // Calculate document counts - process all submissions
  mockSubmissions.forEach(sub => {
    const detail = getMockSubmissionDetail(sub.submissionId);
    if (detail && detail.documents) {
      detail.documents.forEach(doc => {
        const status = doc.status?.toLowerCase() || '';
        if (status === 'processed') documentStatusCounts.processed++;
        else if (status === 'pending') documentStatusCounts.pending++;
        else documentStatusCounts.failed++;
      });
    }
  });
  
  // 3. Compliance Issues by Category
  const issueCategories = [
    'Document Completeness',
    'Risk Appetite',
    'Loss History',
    'Underwriting Guidelines',
    'Pricing Adequacy'
  ];
  
  const topComplianceIssues = issueCategories.map(category => {
    // Count non-compliant checks for this category
    let count = 0;
    mockSubmissions.forEach(sub => {
      const detail = getMockSubmissionDetail(sub.submissionId);
      if (detail && detail.complianceChecks) {
        detail.complianceChecks.forEach(check => {
          if (check.category === category && check.status !== 'compliant') {
            count++;
          }
        });
      }
    });
    
    return {
      name: category,
      value: count
    };
  }).sort((a, b) => b.value - a.value);
  
  // 4. Industry Distribution
  const industryDistribution = industries.map(industry => {
    const count = mockSubmissions.filter(sub => 
      sub.insured?.industry?.code === industry.code
    ).length;
    
    return {
      name: industry.description,
      value: count
    };
  }).filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
  
  // 5. Line of Business Distribution
  const lineDistribution = linesOfBusiness.map(line => {
    const count = mockSubmissions.filter(sub => {
      const detail = getMockSubmissionDetail(sub.submissionId);
      return detail?.coverage?.lines?.includes(line) || false; // Fixed TypeScript error with optional chaining
    }).length;
    
    return {
      name: line,
      value: count
    };
  }).filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
  
  // 6. Document Types Distribution
  const documentTypesDistribution = documentTypes.map(type => {
    let count = 0;
    mockSubmissions.forEach(sub => {
      const detail = getMockSubmissionDetail(sub.submissionId);
      if (detail && detail.documents) {
        detail.documents.forEach(doc => {
          if (doc.type === type) {
            count++;
          }
        });
      }
    });
    
    return {
      name: type,
      value: count
    };
  }).filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
  
  // 7. Submission Trend Data (last 14 days)
  const trendData = [];
  const now = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Count submissions for this date
    const count = mockSubmissions.filter(sub => {
      const subDate = new Date(sub.timestamp).toISOString().split('T')[0];
      return subDate === dateStr;
    }).length;
    
    trendData.push({
      date: dateStr,
      count: count
    });
  }
  
  return {
    complianceDistribution,
    documentStatusCounts,
    topComplianceIssues,
    industryDistribution,
    lineDistribution,
    documentTypesDistribution,
    trendData
  };
};

// Create a named export object to avoid the ESLint warning
const mockDataExports = {
  mockSubmissions,
  getMockSubmissionDetail,
  getMockAuditComplianceStatus,
  getMockComplianceMetrics,
  getReportsData // Export the getReportsData function
};

export default mockDataExports;