// src/services/mock/mockData.ts
import { SubmissionData, ComplianceCheckResult, SubmissionDetail } from '../../types';

// Mock submission data
export const mockSubmissions: SubmissionData[] = [
  {
    submissionId: 'SUB20250426-001',
    timestamp: '2025-04-20T14:30:45Z',
    broker: {
      name: 'Marsh Insurance Brokers',
      email: 'john.smith@marsh.com'
    },
    insured: {
      name: 'Acme Manufacturing Inc.',
      industry: {
        code: '332999',
        description: 'All Other Miscellaneous Fabricated Metal Product Manufacturing'
      },
      address: {
        street: '123 Industrial Parkway',
        city: 'Cleveland',
        state: 'OH',
        zip: '44115'
      },
      yearsInBusiness: 27,
      employeeCount: 215
    },
    coverage: {
      lines: ['Property', 'General Liability'],
      effectiveDate: '2025-06-01',
      expirationDate: '2026-06-01'
    },
    exposure: {
      property: {
        tiv: 35000000,
        locationsCount: 2
      },
      generalLiability: {
        limits: {
          eachOccurrence: 1000000,
          generalAggregate: 2000000
        }
      }
    },
    documents: [
      {
        id: 'doc-001',
        name: 'ACORD 125.pdf',
        type: 'application',
        contentType: 'application/pdf',
        size: 245789,
        status: 'processed'
      },
      {
        id: 'doc-002',
        name: 'Loss Runs.pdf',
        type: 'lossHistory',
        contentType: 'application/pdf',
        size: 389012,
        status: 'processed'
      },
      {
        id: 'doc-003',
        name: 'Financial Statements.pdf',
        type: 'financials',
        contentType: 'application/pdf',
        size: 512456,
        status: 'processed'
      }
    ],
    status: 'In Review'
  },
  // Add the retail submission
  {
    submissionId: 'SUB20250426-002',
    timestamp: '2025-04-22T10:15:30Z',
    broker: {
      name: 'Willis Towers Watson',
      email: 'sarah.johnson@willistowerswatson.com'
    },
    insured: {
      name: 'Urban Outfitters Group LLC',
      industry: {
        code: '448120',
        description: 'Family Clothing Stores'
      },
      address: {
        street: '500 Fashion Avenue',
        city: 'Atlanta',
        state: 'GA',
        zip: '30303'
      },
      yearsInBusiness: 12,
      employeeCount: 350
    },
    coverage: {
      lines: ['Property', 'General Liability'],
      effectiveDate: '2025-07-15',
      expirationDate: '2026-07-15'
    },
    exposure: {
      property: {
        tiv: 48000000,
        locationsCount: 10
      },
      generalLiability: {
        limits: {
          eachOccurrence: 2000000,
          generalAggregate: 4000000
        }
      }
    },
    documents: [
      {
        id: 'doc-004',
        name: 'ACORD 125.pdf',
        type: 'application',
        contentType: 'application/pdf',
        size: 278943,
        status: 'processed'
      },
      {
        id: 'doc-005',
        name: 'Urban_Loss_History_2020-2025.pdf',
        type: 'lossHistory',
        contentType: 'application/pdf',
        size: 412678,
        status: 'processed'
      },
      {
        id: 'doc-006',
        name: 'Urban_Financials_2022-2024.pdf',
        type: 'financials',
        contentType: 'application/pdf',
        size: 583921,
        status: 'processed'
      }
    ],
    status: 'At Risk'
  },
  // Add the tech company submission
  {
    submissionId: 'SUB20250426-003',
    timestamp: '2025-04-25T09:45:22Z',
    broker: {
      name: 'Aon Risk Solutions',
      email: 'mark.chen@aon.com'
    },
    insured: {
      name: 'NextGen Software Solutions Inc.',
      industry: {
        code: '541511',
        description: 'Custom Computer Programming Services'
      },
      address: {
        street: '789 Tech Parkway',
        city: 'Boston',
        state: 'MA',
        zip: '02110'
      },
      yearsInBusiness: 8,
      employeeCount: 125
    },
    coverage: {
      lines: ['Property', 'General Liability'],
      effectiveDate: '2025-08-01',
      expirationDate: '2026-08-01'
    },
    exposure: {
      property: {
        tiv: 12500000,
        locationsCount: 1
      },
      generalLiability: {
        limits: {
          eachOccurrence: 1000000,
          generalAggregate: 2000000
        }
      }
    },
    documents: [
      {
        id: 'doc-007',
        name: 'ACORD 125.pdf',
        type: 'application',
        contentType: 'application/pdf',
        size: 198742,
        status: 'processed'
      },
      {
        id: 'doc-008',
        name: 'NextGen_Loss_Runs_2020-2025.pdf',
        type: 'lossHistory',
        contentType: 'application/pdf',
        size: 156789,
        status: 'processed'
      },
      {
        id: 'doc-009',
        name: 'NextGen_Financial_Statement_2024.pdf',
        type: 'financials',
        contentType: 'application/pdf',
        size: 432156,
        status: 'processed'
      }
    ],
    status: 'Compliant'
  }
];

// Compliance check mock data for detailed views
export const mockComplianceChecks: { [key: string]: ComplianceCheckResult[] } = {
  'SUB20250426-001': [
    {
      checkId: 'DOC-001',
      category: 'Document Completeness',
      status: 'compliant',
      findings: 'All required submission documents were received and properly indexed.',
      timestamp: '2025-04-20T14:45:12Z',
      dataPoints: {
        requiredDocuments: 3,
        receivedDocuments: 3
      }
    },
    {
      checkId: 'APP-001',
      category: 'Risk Appetite Alignment',
      status: 'compliant',
      findings: 'The manufacturing risk is within appetite for both Property and GL lines.',
      timestamp: '2025-04-20T14:46:30Z',
      dataPoints: {
        industryCode: '332999',
        riskAppetite: 'Standard'
      }
    },
    {
      checkId: 'FIN-001',
      category: 'Financial Strength Analysis',
      status: 'compliant',
      findings: 'Financial metrics exceed minimum requirements with positive net income, strong current ratio of 1.8, and solid D&B rating.',
      timestamp: '2025-04-20T14:47:15Z',
      dataPoints: {
        currentRatio: 1.8,
        debtToEquityRatio: 0.6,
        dbRating: '3A2'
      }
    },
    {
      checkId: 'LOSS-001',
      category: 'Loss History Analysis',
      status: 'compliant',
      findings: 'Loss history is within acceptable parameters with loss ratios below thresholds and claim frequency within guidelines.',
      timestamp: '2025-04-20T14:48:22Z',
      dataPoints: {
        lossRatio: 12.5,
        claimFrequency: 0.4,
        largestLoss: 85000
      }
    }
  ],
  'SUB20250426-002': [
    {
      checkId: 'DOC-001',
      category: 'Document Completeness',
      status: 'compliant',
      findings: 'All required submission documents were received and properly indexed.',
      timestamp: '2025-04-22T10:25:18Z',
      dataPoints: {
        requiredDocuments: 3,
        receivedDocuments: 3
      }
    },
    {
      checkId: 'APP-001',
      category: 'Risk Appetite Alignment',
      status: 'compliant',
      findings: 'Retail clothing store is within appetite for both Property and GL lines.',
      timestamp: '2025-04-22T10:26:45Z',
      dataPoints: {
        industryCode: '448120',
        riskAppetite: 'Preferred'
      }
    },
    {
      checkId: 'FIN-001',
      category: 'Financial Strength Analysis',
      status: 'compliant',
      findings: 'Financial metrics exceed minimum requirements with strong growth trends and solid D&B rating.',
      timestamp: '2025-04-22T10:27:30Z',
      dataPoints: {
        currentRatio: 2.1,
        debtToEquityRatio: 0.8,
        dbRating: '2A3'
      }
    },
    {
      checkId: 'LOSS-001',
      category: 'Loss History Analysis',
      status: 'attention',
      findings: 'Property loss trend shows increasing frequency with 4 claims in 5 years, which approaches the threshold. Recent GL claim of $150,000 still open.',
      timestamp: '2025-04-22T10:28:15Z',
      dataPoints: {
        lossRatio: 16.0,
        claimFrequency: 0.8,
        largestLoss: 175000
      }
    },
    {
      checkId: 'CAT-001',
      category: 'CAT Exposure Analysis',
      status: 'attention',
      findings: 'Multiple locations in Florida with potential hurricane exposure. Tampa location had significant hurricane loss in 2022.',
      timestamp: '2025-04-22T10:29:05Z',
      dataPoints: {
        catExposure: 'Hurricane',
        locationsAffected: 3,
        priorCatLoss: true
      }
    }
  ],
  'SUB20250426-003': [
    {
      checkId: 'DOC-001',
      category: 'Document Completeness',
      status: 'compliant',
      findings: 'All required submission documents were received and properly indexed.',
      timestamp: '2025-04-25T09:55:12Z',
      dataPoints: {
        requiredDocuments: 3,
        receivedDocuments: 3
      }
    },
    {
      checkId: 'APP-001',
      category: 'Risk Appetite Alignment',
      status: 'compliant',
      findings: 'Software development and IT consulting is within appetite for both Property and GL lines.',
      timestamp: '2025-04-25T09:56:30Z',
      dataPoints: {
        industryCode: '541511',
        riskAppetite: 'Preferred'
      }
    },
    {
      checkId: 'FIN-001',
      category: 'Financial Strength Analysis',
      status: 'compliant',
      findings: 'Excellent financial metrics with strong growth, high profitability, and solid D&B rating.',
      timestamp: '2025-04-25T09:57:45Z',
      dataPoints: {
        currentRatio: 3.2,
        debtToEquityRatio: 0.2,
        dbRating: '2A2'
      }
    },
    {
      checkId: 'LOSS-001',
      category: 'Loss History Analysis',
      status: 'compliant',
      findings: 'Excellent loss history with only one minor property claim and no GL claims in 5 years.',
      timestamp: '2025-04-25T09:58:22Z',
      dataPoints: {
        lossRatio: 2.4,
        claimFrequency: 0.2,
        largestLoss: 15000
      }
    },
    {
      checkId: 'LOC-001',
      category: 'Location Analysis',
      status: 'attention',
      findings: 'Boston location is within 2 miles of coast. While not in flood zone V, coastal proximity requires review for windstorm/flood exposure.',
      timestamp: '2025-04-25T09:59:10Z',
      dataPoints: {
        distanceToCoast: 2,
        floodZone: 'X',
        windExposure: 'Medium'
      }
    },
    {
      checkId: 'PROF-001',
      category: 'Professional Liability Exposure',
      status: 'attention',
      findings: 'As a software developer and IT consultant, professional liability exposure exists but is excluded under GL policy. Ensure GL-PROFES-2025 exclusion is attached.',
      timestamp: '2025-04-25T10:00:05Z',
      dataPoints: {
        professionalExposure: true,
        exclusionForm: 'GL-PROFES-2025',
        crossSellOpportunity: 'Professional Liability'
      }
    }
  ]
};

// Helper function to get full submission details
export const getMockSubmissionDetail = (id: string): SubmissionDetail | undefined => {
  const submission = mockSubmissions.find(s => s.submissionId === id);
  if (!submission) return undefined;
  
  return {
    ...submission,
    complianceChecks: mockComplianceChecks[id] || []
  };
};