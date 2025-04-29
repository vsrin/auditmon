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
// IMPORTANT: We now explicitly define which industries are restricted or declined
// This ensures consistent risk appetite compliance across all submissions
const industries = [
  // Compliant industries (in appetite)
  { code: '2834', description: 'Pharmaceutical Manufacturing', riskAppetite: 'Standard' },
  { code: '8731', description: 'Research and Development', riskAppetite: 'Standard' },
  { code: '6211', description: 'Healthcare', riskAppetite: 'Standard' },
  { code: '5812', description: 'Restaurants', riskAppetite: 'Standard' },
  { code: '4724', description: 'Travel Agency', riskAppetite: 'Standard' },
  { code: '5411', description: 'Legal Services', riskAppetite: 'Standard' },
  
  // At Risk industries (restricted appetite)
  { code: '1531', description: 'Construction', riskAppetite: 'Restricted' },
  { code: '7371', description: 'Technology Services', riskAppetite: 'Restricted' },
  
  // Non-Compliant industries (declined)
  { code: '6531', description: 'Real Estate', riskAppetite: 'Declined' },
  { code: '3579', description: 'Office Equipment', riskAppetite: 'Declined' }
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

// Lines of business
const linesOfBusiness = [
  'Property', 
  'General Liability', 
  'Workers Compensation', 
  'Professional Liability'
];

// Company name components for more realistic names
const companyNamePrefixes = [
  'Apex', 'Blue Ridge', 'Cascade', 'Delta', 'Evergreen', 'Frontier', 
  'Golden Gate', 'Highland', 'Integrated', 'Keystone', 'Landmark', 
  'Meridian', 'Northern', 'Oceanview', 'Pioneer', 'Quantum', 
  'Redwood', 'Summit', 'Titan', 'United', 'Venture', 'Western', 
  'Xenith', 'Yellowstone', 'Zenith'
];

const companyNameTypes = [
  'Industries', 'Solutions', 'Technologies', 'Systems', 'Enterprises', 
  'Corporation', 'Partners', 'Group', 'Associates', 'Global', 
  'Inc.', 'LLC', 'Holdings', 'Ventures', 'International', 
  'Consolidated', 'Manufacturing', 'Services', 'Consulting', 'Properties'
];

// Broker firm names for more realism
const brokerFirmNames = [
  'Willis Towers Watson', 'Marsh & McLennan', 'Aon Risk Solutions',
  'Arthur J. Gallagher', 'USI Insurance', 'HUB International',
  'Brown & Brown', 'NFP Corp', 'Lockton Companies', 'Alliant Insurance',
  'Acrisure LLC', 'Woodruff Sawyer', 'Risk Strategies', 'Higginbotham',
  'BXS Insurance', 'McGriff', 'Oswald Companies', 'Hylant Group',
  'AssuredPartners', 'TrueNorth Companies'
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

// Generate a more realistic timestamp with better distribution
const generateTimestampForIndex = (index: number): string => {
  const date = new Date();
  
  // Create a more varied distribution over the last 90 days
  // Use a combination of techniques to spread dates out more naturally
  
  // Base spread - roughly last 3 months but with clustering
  let dayOffset = 0;
  
  // Use different distribution patterns based on index ranges
  if (index < TOTAL_SUBMISSIONS * 0.2) {
    // Most recent 20% of submissions - within last 2 weeks
    dayOffset = Math.floor(Math.random() * 14);
  } else if (index < TOTAL_SUBMISSIONS * 0.5) {
    // Next 30% - between 2 weeks and 1 month ago
    dayOffset = 14 + Math.floor(Math.random() * 16);
  } else if (index < TOTAL_SUBMISSIONS * 0.8) {
    // Next 30% - between 1 and 2 months ago
    dayOffset = 30 + Math.floor(Math.random() * 30);
  } else {
    // Oldest 20% - between 2 and 3 months ago
    dayOffset = 60 + Math.floor(Math.random() * 30);
  }
  
  // Add some slight clustering where submissions might come in batches
  // Every third submission comes in a cluster
  if (index % 3 === 0) {
    // Adjust to be within 1-2 days of a related submission
    dayOffset = Math.max(0, dayOffset - (index % 2));
  }
  
  date.setDate(date.getDate() - dayOffset);
  
  // Add time component - spread throughout the day
  date.setHours(9 + (index % 8)); // Business hours 9am-5pm
  date.setMinutes((index * 17) % 60); // Spread minutes
  
  return date.toISOString();
};

// Generate a realistic company name
const generateCompanyName = (index: number): string => {
  // Use a deterministic but seemingly random approach based on index
  const prefixIndex = (index * 3) % companyNamePrefixes.length;
  const typeIndex = (index * 7) % companyNameTypes.length;
  
  // For some names, add an industry-specific term
  let industryTerm = '';
  if (index % 5 === 0) {
    const industryTerms = [
      'Healthcare', 'Financial', 'Construction', 'Logistics', 
      'Manufacturing', 'Retail', 'Energy', 'Automotive', 'Media'
    ];
    industryTerm = ' ' + industryTerms[index % industryTerms.length];
  }
  
  return `${companyNamePrefixes[prefixIndex]}${industryTerm} ${companyNameTypes[typeIndex]}`;
};

// Generate a broker name
const getBrokerName = (index: number): string => {
  const firmIndex = index % brokerFirmNames.length;
  return brokerFirmNames[firmIndex];
};

// Function to ensure that the industry used in a submission matches the status
// This ensures NAICS risk appetite is consistent with submission status
const getIndustryForSubmission = (index: number, status: string): typeof industries[0] => {
  if (status === 'Compliant') {
    // For compliant submissions, use only compliant industries
    const compliantIndustries = industries.filter(i => i.riskAppetite === 'Standard');
    return compliantIndustries[index % compliantIndustries.length];
  } else if (status === 'At Risk') {
    // For at-risk submissions, either use restricted industries or create other compliance issues
    const atRiskChoices = [
      // Use restricted industry 70% of the time
      ...Array(7).fill('restricted-industry'),
      // Use other compliance issues 30% of the time
      ...Array(3).fill('other-issue')
    ];
    
    const choice = atRiskChoices[index % atRiskChoices.length];
    
    if (choice === 'restricted-industry') {
      const restrictedIndustries = industries.filter(i => i.riskAppetite === 'Restricted');
      return restrictedIndustries[index % restrictedIndustries.length];
    } else {
      // Use a compliant industry but will have other compliance issues
      const compliantIndustries = industries.filter(i => i.riskAppetite === 'Standard');
      return compliantIndustries[index % compliantIndustries.length];
    }
  } else {
    // For non-compliant submissions, mostly use declined industries
    const nonCompliantChoices = [
      // Use declined industry 80% of the time
      ...Array(8).fill('declined-industry'),
      // Use other compliance issues 20% of the time
      ...Array(2).fill('other-issue')
    ];
    
    const choice = nonCompliantChoices[index % nonCompliantChoices.length];
    
    if (choice === 'declined-industry') {
      const declinedIndustries = industries.filter(i => i.riskAppetite === 'Declined');
      return declinedIndustries[index % declinedIndustries.length];
    } else {
      // Use a compliant industry but will have other severe compliance issues
      const compliantIndustries = industries.filter(i => i.riskAppetite === 'Standard');
      return compliantIndustries[index % compliantIndustries.length];
    }
  }
};

// Generate mock submissions - ENSURE CONSISTENT RISK APPETITE
export const mockSubmissions: Submission[] = Array.from({ length: TOTAL_SUBMISSIONS }, (_, index) => {
  // Determine status based on position to match counts
  const status = getStatusForIndex(index);
  
  // Select industry for this submission that's consistent with its status
  const industry = getIndustryForSubmission(index, status);
  
  // Generate submission ID
  const submissionId = `SUB-${100000 + index}`;
  
  // Generate timestamp with better distribution
  const timestamp = generateTimestampForIndex(index);
  
  // Create submission object
  return {
    submissionId,
    timestamp,
    status,
    broker: {
      name: getBrokerName(index),
      email: `broker${(index % 10) + 1}@${brokerFirmNames[index % brokerFirmNames.length].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      code: `BR-${1000 + (index % 10)}`
    },
    insured: {
      name: generateCompanyName(index),
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
      status: docIndex === 0 ? 'processed' : (docIndex === 1 ? 'pending' : 'failed'),
      size: 100000 + (docIndex * 50000) // Document size in bytes
    };
  });
};

// Helper function to determine if a submission has risk appetite issues
const hasRiskAppetiteIssues = (submission: Submission): { hasIssue: boolean, severity: 'attention' | 'non-compliant' } => {
  // Get the industry from the submission
  const industryCode = submission.insured?.industry?.code;
  if (!industryCode) return { hasIssue: false, severity: 'attention' };
  
  // Find the industry in our industry list
  const industry = industries.find(i => i.code === industryCode);
  if (!industry) return { hasIssue: false, severity: 'attention' };
  
  if (industry.riskAppetite === 'Declined') {
    return { hasIssue: true, severity: 'non-compliant' };
  } else if (industry.riskAppetite === 'Restricted') {
    return { hasIssue: true, severity: 'attention' };
  } else {
    return { hasIssue: false, severity: 'attention' };
  }
};

// Function to get detailed submission by ID - IMPROVED FOR CONSISTENT COMPLIANCE
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
    complianceChecks: [] // Will be populated below based on status
  };
  
  // Generate compliance checks based on submission status
  const status = baseSubmission.status?.toLowerCase() || 'compliant';
  let checks: ComplianceCheck[] = [];
  
  // Always include document completeness check
  checks.push({
    checkId: 'DOC-001',
    category: 'Document Completeness',
    status: status === 'compliant' ? 'compliant' : 'attention',
    findings: status === 'compliant' 
      ? 'All required documents have been provided.' 
      : 'Missing or incomplete documentation detected.',
    timestamp: baseSubmission.timestamp,
    dataPoints: {
      requiredDocuments: 'Financial Statements, SOV, Application',
      providedDocuments: status === 'compliant' ? 'Financial Statements, SOV, Application' : 'Financial Statements, Application'
    }
  });
  
  // Check for risk appetite issues - CONSISTENT WITH NAICS CODE
  const riskAppetiteIssue = hasRiskAppetiteIssues(baseSubmission);
  checks.push({
    checkId: 'RISK-001',
    category: 'Risk Appetite',
    status: riskAppetiteIssue.hasIssue ? riskAppetiteIssue.severity : 'compliant',
    findings: !riskAppetiteIssue.hasIssue
      ? `${baseSubmission.insured?.industry?.description || 'Unknown Industry'} is within appetite for the requested lines of business.`
      : `${baseSubmission.insured?.industry?.description || 'Unknown Industry'} has risk factors that require additional review.`,
    timestamp: baseSubmission.timestamp,
    dataPoints: {
      industryCode: baseSubmission.insured?.industry?.code || 'Unknown',
      // Get the riskAppetite value from the industry definition
      riskAppetite: industries.find(i => i.code === baseSubmission.insured?.industry?.code)?.riskAppetite || 'Unknown'
    }
  });
  
  // For At Risk and Non-Compliant statuses, add additional compliance issues as needed
  if (status !== 'compliant') {
    // If the submission is not compliant due to industry, we already have that covered above
    // We might need to add other compliance issues, especially if the industry is actually in appetite
    
    // If risk appetite is actually compliant but status is not, add other compliance issues
    const industryHasIssues = riskAppetiteIssue.hasIssue;
    
    // Add loss history check if status is at risk or non-compliant
    checks.push({
      checkId: 'LOSS-001',
      category: 'Loss History',
      // If industry itself doesn't cause issues, make loss history align with overall status
      status: industryHasIssues ? 'compliant' : (status === 'at risk' ? 'attention' : 'non-compliant'),
      findings: industryHasIssues 
        ? 'Loss history is within acceptable parameters.'
        : 'Loss history indicates potential underwriting concerns.',
      timestamp: baseSubmission.timestamp,
      dataPoints: {
        lossRatio: industryHasIssues ? '35%' : (status === 'at risk' ? '65%' : '85%'),
        lossCount: industryHasIssues ? '1' : (status === 'at risk' ? '3' : '7'),
        largestLoss: industryHasIssues ? '$50,000' : (status === 'at risk' ? '$125,000' : '$450,000')
      }
    });
    
    // For non-compliant submissions that aren't due to industry, add severe underwriting issues
    if (status === 'non-compliant' && !industryHasIssues) {
      checks.push({
        checkId: 'UW-001',
        category: 'Underwriting Guidelines',
        status: 'non-compliant',
        findings: 'Submission does not meet underwriting guidelines for this line of business.',
        timestamp: baseSubmission.timestamp,
        dataPoints: {
          guidelines: 'Standard Property Guidelines',
          exceptions: '3',
          severity: 'High'
        }
      });
    }
  }
  
  // Store checks in the detailed submission
  detailedSubmission.complianceChecks = checks;
  
  return detailedSubmission;
};

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

// Generate data for reports
export const getReportsData = () => {
  // 1. Compliance Status Distribution
  const complianceDistribution = {
    compliant: COMPLIANT_COUNT,
    atRisk: AT_RISK_COUNT,
    nonCompliant: NON_COMPLIANT_COUNT
  };
  
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
        if (doc.status === 'processed') documentStatusCounts.processed++;
        else if (doc.status === 'pending') documentStatusCounts.pending++;
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
      // Fix: Handle possible undefined values with optional chaining and conditional check
      return detail?.coverage?.lines && detail.coverage.lines.includes(line) || false;
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
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
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
  getReportsData
};

export default mockDataExports;