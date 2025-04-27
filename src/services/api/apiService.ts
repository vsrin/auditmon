// src/services/api/apiService.ts
import axios from 'axios';
import { mockSubmissions, getMockSubmissionDetail } from '../mock/mockData';
import { SubmissionData, SubmissionDetail } from '../../types';

class ApiService {
  private isDemoMode: boolean = false;
  private apiEndpoint: string = '';

  setDemoMode(mode: boolean): void {
    this.isDemoMode = mode;
  }

  setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
  }

  private applyMapping(data: any, mapping: Record<string, any>): any {
    if (!mapping || !data) return data;
    
    const result: any = {};
    
    for (const [key, path] of Object.entries(mapping)) {
      // Skip compliance checks as we handle them separately
      if (key === 'complianceChecks') continue;
      
      if (typeof path === 'string') {
        // Handle nested paths like "insured.name"
        const parts = path.split('.');
        let value = data;
        
        for (const part of parts) {
          value = value && value[part];
          if (value === undefined) break;
        }
        
        result[key] = value;
      } else if (typeof path === 'object') {
        // Handle nested objects in mapping
        result[key] = this.applyMapping(data, path);
      }
    }
    
    return result;
  }

  async getSubmissions(): Promise<SubmissionData[]> {
    if (this.isDemoMode) {
      return mockSubmissions;
    }

    try {
      const response = await axios.get(`${this.apiEndpoint}/api/submissions`);
      return response.data.map((item: any) => this.mapFlaskApiResponseToSubmission(item));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  }

  async getSubmissionDetail(id: string): Promise<SubmissionDetail> {
    if (this.isDemoMode) {
      // In demo mode, we want to use the mock data directly with compliance checks
      const submissionDetail = getMockSubmissionDetail(id);
      if (!submissionDetail) {
        throw new Error(`Submission with ID ${id} not found`);
      }
      return submissionDetail; // Return the mock data with compliance checks included
    }

    try {
      // Live mode - get data from API
      const response = await axios.get(`${this.apiEndpoint}/api/submissions/${id}`);
      return this.mapFlaskApiResponseToSubmission(response.data);
    } catch (error) {
      console.error(`Error fetching submission detail for ID ${id}:`, error);
      throw error;
    }
  }

  async getReports(): Promise<Record<string, any>> {
    if (this.isDemoMode) {
      // Create report data from mock submissions
      return {
        complianceStatus: {
          compliant: mockSubmissions.filter(s => s.status === 'Compliant').length,
          attention: mockSubmissions.filter(s => s.status === 'Requires Attention' || s.status === 'At Risk').length,
          nonCompliant: mockSubmissions.filter(s => s.status === 'Non-Compliant').length
        },
        submissionTrends: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          data: [12, 19, 15, 21]
        }
      };
    }

    try {
      const submissions = await this.getSubmissions();
      
      // Generate report from live data
      return {
        complianceStatus: {
          compliant: submissions.filter(s => s.status === 'Compliant').length,
          attention: submissions.filter(s => s.status === 'At Risk').length,
          nonCompliant: submissions.filter(s => s.status === 'Non-Compliant').length
        },
        submissionTrends: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          data: [submissions.length, submissions.length - 2, submissions.length - 4, submissions.length - 1]
        }
      };
    } catch (error) {
      console.error('Error generating reports:', error);
      throw error;
    }
  }

  // Helper method to map Flask API responses to our data model
  private mapFlaskApiResponseToSubmission(apiData: any): SubmissionDetail {
    // For submission list endpoint
    if (apiData.submission) {
      return {
        submissionId: apiData.submission.id || 'Unknown',
        timestamp: apiData.submission.created_at || new Date().toISOString(),
        status: apiData.status || 'Unknown',
        broker: {
          name: apiData.broker.company_name || 'Unknown Broker',
          email: apiData.broker.email_address || '',
        },
        insured: {
          name: apiData.insured.legal_name || 'Unknown Insured',
          industry: {
            code: apiData.insured.sic_code || 'Unknown',
            description: apiData.insured.industry_description || 'Unknown Industry',
          },
          address: {
            street: apiData.insured.address.line1 || '',
            city: apiData.insured.address.city || '',
            state: apiData.insured.address.state || '',
            zip: apiData.insured.address.postal_code || '',
          },
          yearsInBusiness: apiData.insured.years_in_business || 0,
          employeeCount: apiData.insured.employee_count || 0,
        },
        coverage: {
          lines: apiData.submission.coverage_lines || [],
          effectiveDate: apiData.submission.effective_date || '',
          expirationDate: apiData.submission.expiration_date || '',
        },
        documents: (apiData.documents || []).map((doc: any) => ({
          id: doc.doc_id || Math.random().toString(),
          name: doc.name || 'Unknown Document',
          type: doc.type || 'Unknown Type',
          status: doc.status?.toLowerCase() || 'unknown',
          size: doc.size_kb || 0,
        })),
        complianceChecks: [] // Initialize empty, will be populated by rule engine
      };
    }
    
    // For submission list items
    return {
      submissionId: apiData.submission?.id || 'Unknown',
      timestamp: apiData.submission?.created_at || new Date().toISOString(),
      status: apiData.status || 'Unknown',
      broker: {
        name: apiData.broker?.company_name || 'Unknown Broker',
        email: apiData.broker?.email_address || '',
      },
      insured: {
        name: apiData.insured?.legal_name || 'Unknown Insured',
        industry: {
          code: apiData.insured?.sic_code || 'Unknown',
          description: apiData.insured?.industry_description || 'Unknown Industry',
        },
        address: {
          street: apiData.insured?.address?.line1 || '',
          city: apiData.insured?.address?.city || '',
          state: apiData.insured?.address?.state || '',
          zip: apiData.insured?.address?.postal_code || '',
        },
        yearsInBusiness: apiData.insured?.years_in_business || 0,
        employeeCount: apiData.insured?.employee_count || 0,
      },
      coverage: {
        lines: apiData.submission?.coverage_lines || [],
        effectiveDate: apiData.submission?.effective_date || '',
        expirationDate: apiData.submission?.expiration_date || '',
      },
      documents: [],
      complianceChecks: [] 
    };
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService;