// src/services/mock/mockData.ts
import { SubmissionData, ComplianceCheckResult, SubmissionDetail } from '../../types';

// Configure the exact counts to match dashboard metrics
const TOTAL_SUBMISSIONS = 42;
const COMPLIANT_SUBMISSIONS = 28;
const AT_RISK_SUBMISSIONS = 10;
const NON_COMPLIANT_SUBMISSIONS = 4;

// Generate random date within past month
const randomRecentDate = () => {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
  return pastDate.toISOString();
};

// Sample industry data for creating varied submissions
const industries = [
  { code: '332999', description: 'All Other Miscellaneous Fabricated Metal Product Manufacturing' },
  { code: '448120', description: 'Family Clothing Stores' },
  { code: '541511', description: 'Custom Computer Programming Services' },
  { code: '722511', description: 'Full-Service Restaurants' },
  { code: '236220', description: 'Commercial Building Construction' },
  { code: '621111', description: 'Offices of Physicians' },
  { code: '522110', description: 'Commercial Banking' },
  { code: '484121', description: 'General Freight Trucking, Long-Distance' },
  { code: '611310', description: 'Colleges and Universities' },
  { code: '721110', description: 'Hotels and Motels' }
];

// Sample broker data
const brokers = [
  { name: 'Marsh Insurance Brokers', email: 'john.smith@marsh.com' },
  { name: 'Willis Towers Watson', email: 'sarah.johnson@willistowerswatson.com' },
  { name: 'Aon Risk Solutions', email: 'mark.chen@aon.com' },
  { name: 'Gallagher Insurance', email: 'jennifer.adams@gallagher.com' },
  { name: 'HUB International', email: 'robert.miller@hubinternational.com' }
];

// Sample company names
const companyNames = [
  'Acme Manufacturing Inc.',
  'Urban Outfitters Group LLC',
  'NextGen Software Solutions Inc.',
  'Riverdale Healthcare Partners',
  'Consolidated Building Services',
  'Atlantic Shipping & Logistics',
  'Summit Financial Holdings',
  'Harvest Valley Foods',
  'Pinnacle Energy Systems',
  'Global Hospitality Group'
];

// Helper function to create a submission with a specific status
const createMockSubmission = (status: string, index: number): SubmissionData => {
  const industryIndex = index % industries.length;
  const brokerIndex = index % brokers.length;
  const companyIndex = index % companyNames.length;
  
  return {
    submissionId: `SUB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(index + 100).padStart(3, '0')}`,
    timestamp: randomRecentDate(),
    broker: {
      name: brokers[brokerIndex].name,
      email: brokers[brokerIndex].email
    },
    insured: {
      name: `${companyNames[companyIndex]} ${String.fromCharCode(65 + (index % 26))}`,
      industry: {
        code: industries[industryIndex].code,
        description: industries[industryIndex].description
      },
      address: {
        street: `${1000 + index} Business St`,
        city: ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Miami', 'Boston', 'Atlanta'][index % 7],
        state: ['NY', 'IL', 'CA', 'TX', 'FL', 'MA', 'GA'][index % 7],
        zip: String(10000 + (index * 100))
      },
      yearsInBusiness: 5 + (index % 20),
      employeeCount: 50 + (index * 25)
    },
    coverage: {
      lines: ['Property', 'General Liability', 'Workers Compensation', 'Professional Liability'].slice(0, 1 + (index % 3)),
      effectiveDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      expirationDate: new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, 1).toISOString()
    },
    documents: [
      {
        id: `doc-${index * 3 + 1}`,
        name: 'Application.pdf',
        type: 'application',
        contentType: 'application/pdf',
        status: 'processed',
        size: 250000 + (index * 1000)
      },
      {
        id: `doc-${index * 3 + 2}`,
        name: 'Loss Runs.pdf',
        type: 'lossHistory',
        contentType: 'application/pdf',
        status: 'processed',
        size: 350000 + (index * 1000)
      },
      {
        id: `doc-${index * 3 + 3}`,
        name: 'Financial Statements.pdf',
        type: 'financials',
        contentType: 'application/pdf',
        status: 'processed',
        size: 450000 + (index * 1000)
      }
    ],
    status: status
  };
};

// Generate mock submissions
let mockSubmissionsData: SubmissionData[] = [];

// Generate Compliant submissions
for (let i = 0; i < COMPLIANT_SUBMISSIONS; i++) {
  mockSubmissionsData.push(createMockSubmission('Compliant', i));
}

// Generate At Risk submissions
for (let i = 0; i < AT_RISK_SUBMISSIONS; i++) {
  mockSubmissionsData.push(createMockSubmission('At Risk', i + COMPLIANT_SUBMISSIONS));
}

// Generate Non-Compliant submissions
for (let i = 0; i < NON_COMPLIANT_SUBMISSIONS; i++) {
  mockSubmissionsData.push(createMockSubmission('Non-Compliant', i + COMPLIANT_SUBMISSIONS + AT_RISK_SUBMISSIONS));
}

// Export the mock submissions
export const mockSubmissions: SubmissionData[] = mockSubmissionsData;

// Create basic compliance checks for each submission
export const mockComplianceChecks: { [key: string]: ComplianceCheckResult[] } = {};

// Generate compliance checks for each submission
mockSubmissions.forEach(submission => {
  const status = submission.status.toLowerCase();
  let checks: ComplianceCheckResult[] = [];
  
  // Always include document completeness check
  checks.push({
    checkId: `DOC-${submission.submissionId}`,
    category: 'Document Completeness',
    status: 'compliant',
    findings: 'All required submission documents were received and properly indexed.',
    timestamp: submission.timestamp,
    dataPoints: {
      requiredDocuments: 3,
      receivedDocuments: 3
    }
  });
  
  // Add risk appetite check based on status
  checks.push({
    checkId: `APP-${submission.submissionId}`,
    category: 'Risk Appetite Alignment',
    status: status === 'compliant' ? 'compliant' : (status === 'at risk' ? 'attention' : 'non-compliant'),
    findings: status === 'compliant' 
      ? `${submission.insured.industry.description} is within appetite for the requested lines of business.` 
      : `${submission.insured.industry.description} has risk factors that require additional review.`,
    timestamp: submission.timestamp,
    dataPoints: {
      industryCode: submission.insured.industry.code,
      riskAppetite: status === 'compliant' ? 'Standard' : (status === 'at risk' ? 'Restricted' : 'Declined')
    }
  });
  
  // Add financial check
  checks.push({
    checkId: `FIN-${submission.submissionId}`,
    category: 'Financial Strength Analysis',
    status: status === 'non-compliant' ? 'non-compliant' : 'compliant',
    findings: status === 'compliant' 
      ? 'Financial metrics exceed minimum requirements with positive net income and strong current ratio.'
      : 'Financial metrics indicate potential concerns that need to be addressed.',
    timestamp: submission.timestamp,
    dataPoints: {
      currentRatio: status === 'compliant' ? 1.8 : 0.9,
      debtToEquityRatio: status === 'compliant' ? 0.6 : 1.5,
      dbRating: status === 'compliant' ? '3A2' : '1R2'
    }
  });
  
  // Add checks that match the submission's status
  if (status === 'at risk' || status === 'non-compliant') {
    checks.push({
      checkId: `LOSS-${submission.submissionId}`,
      category: 'Loss History Analysis',
      status: status === 'at risk' ? 'attention' : 'non-compliant',
      findings: status === 'at risk'
        ? 'Loss history shows an increasing trend that requires further review.'
        : 'Loss history exceeds acceptable thresholds for underwriting.',
      timestamp: submission.timestamp,
      dataPoints: {
        lossRatio: status === 'at risk' ? 22.5 : 45.8,
        claimFrequency: status === 'at risk' ? 0.8 : 2.1,
        largestLoss: status === 'at risk' ? 150000 : 500000
      }
    });
  }
  
  // Store checks for this submission
  mockComplianceChecks[submission.submissionId] = checks;
});

// Helper function to get full submission details
export const getMockSubmissionDetail = (id: string): SubmissionDetail | undefined => {
  const submission = mockSubmissions.find(s => s.submissionId === id);
  if (!submission) return undefined;
  
  return {
    ...submission,
    complianceChecks: mockComplianceChecks[id] || []
  };
};