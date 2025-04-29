// src/services/api/apiService.ts
import axios from 'axios';
import { Submission, SubmissionDetail } from '../../types';
import { mockSubmissions, getMockSubmissionDetail } from '../mock/mockData';

class ApiService {
  private demoMode: boolean = true; // Default to demo mode
  private apiEndpoint: string = 'http://localhost:8000/api'; // Default API endpoint
  
  /**
   * Set the demo mode
   * @param isDemoMode Whether the app is in demo mode
   */
  setDemoMode(isDemoMode: boolean): void {
    // Only take action if the mode is actually changing
    if (this.demoMode !== isDemoMode) {
      console.log(`ApiService - Switching to ${isDemoMode ? 'DEMO' : 'LIVE'} mode`);
      this.demoMode = isDemoMode;
    }
  }
  
  /**
   * Set the API endpoint
   * @param endpoint The API endpoint URL
   */
  setApiEndpoint(endpoint: string): void {
    if (endpoint.endsWith('/')) {
      this.apiEndpoint = endpoint.slice(0, -1);
    } else {
      this.apiEndpoint = endpoint;
    }
    console.log(`ApiService - API Endpoint set to: ${this.apiEndpoint}`);
  }
  
  /**
   * Get the properly formatted endpoint URL with the path
   * @param path The API path to append
   * @returns Properly formatted URL
   */
  private getEndpointUrl(path: string): string {
    // If the endpoint already includes /api, append the path directly
    if (this.apiEndpoint.includes('/api')) {
      return `${this.apiEndpoint}/${path}`;
    }
    // Otherwise, include /api in the path
    return `${this.apiEndpoint}/api/${path}`;
  }
  
  /**
   * Get a nested value from an object using a path string (e.g. "a.b.c")
   * @param obj The object to search
   * @param path The dot-separated path to the property
   * @param defaultValue Default value if path doesn't exist
   * @returns The value at the path or the default value
   */
  private getNestedValue(obj: any, path: string, defaultValue: any = undefined): any {
    if (!obj || !path) return defaultValue;
    
    // Handle array notation like "array[0].property"
    const normalizePath = (p: string): string[] => {
      return p.replace(/\[(\d+)\]/g, '.$1').split('.');
    };
    
    const keys = normalizePath(path);
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  }
  
  /**
   * Get all submissions
   * @returns Promise with submissions data
   */
  async getSubmissions(): Promise<Submission[]> {
    try {
      if (this.demoMode) {
        console.log('ApiService.getSubmissions - Using mock data (DEMO MODE)');
        // Simulate network delay in demo mode
        await new Promise(resolve => setTimeout(resolve, 500)); 
        return mockSubmissions;
      }
      
      const endpoint = this.getEndpointUrl('submissions');
      console.log(`ApiService.getSubmissions - Fetching from: ${endpoint}`);
      const response = await axios.get(endpoint);
      console.log(`ApiService.getSubmissions - Received ${response.data.length} submissions from API`);
      
      // Log the first item to help with debugging
      if (response.data.length > 0) {
        console.log('First item structure:', JSON.stringify(response.data[0]).slice(0, 500) + '...');
      }
      
      // Ensure the response data matches our expected format by mapping each item
      return response.data.map((item: any) => this.mapSubmissionResponse(item));
    } catch (error) {
      console.error('ApiService.getSubmissions - Error:', error);
      
      if (this.demoMode) {
        // In demo mode, fallback to mock data even if there's an error
        console.log('ApiService.getSubmissions - Falling back to mock data after error');
        return mockSubmissions;
      }
      
      throw error;
    }
  }
  
  /**
   * Get submission detail
   * @param id Submission ID
   * @returns Promise with submission detail data
   */
  async getSubmissionDetail(id: string): Promise<SubmissionDetail> {
    try {
      if (this.demoMode) {
        console.log(`ApiService.getSubmissionDetail - Using mock data for ID: ${id} (DEMO MODE)`);
        // Simulate network delay in demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData = getMockSubmissionDetail(id);
        if (!mockData) {
          throw new Error(`Submission with ID ${id} not found in mock data`);
        }
        
        return mockData;
      }
      
      const endpoint = this.getEndpointUrl(`submissions/${id}`);
      console.log(`ApiService.getSubmissionDetail - Fetching from: ${endpoint}`);
      const response = await axios.get(endpoint);
      console.log(`ApiService.getSubmissionDetail - Received detail for ID: ${id}`);
      
      // Ensure the response data matches our expected format
      return this.mapSubmissionDetailResponse(response.data);
    } catch (error) {
      console.error(`ApiService.getSubmissionDetail - Error fetching ID ${id}:`, error);
      
      if (this.demoMode) {
        // In demo mode, check if we have mock data for this ID
        const mockData = getMockSubmissionDetail(id);
        if (mockData) {
          console.log(`ApiService.getSubmissionDetail - Falling back to mock data for ID: ${id}`);
          return mockData;
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Upload a document
   * @param submissionId Submission ID
   * @param file File to upload
   * @returns Promise with upload result
   */
  async uploadDocument(submissionId: string, file: File): Promise<any> {
    if (this.demoMode) {
      console.log(`ApiService.uploadDocument - Simulating upload for submission ${submissionId} (DEMO MODE)`);
      // Simulate network delay in demo mode
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        id: `DOC-${Date.now()}`,
        name: file.name,
        type: file.type,
        status: 'processed',
        size: file.size
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('submissionId', submissionId);
    
    const endpoint = this.getEndpointUrl('documents');
    console.log(`ApiService.uploadDocument - Uploading to: ${endpoint}`);
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }
  
  /**
   * Map API response to our Submission type
   * @param data API response data
   * @returns Mapped Submission object
   */
  private mapSubmissionResponse(data: any): Submission {
    // Check if the data is already in our expected format
    if (data.submissionId) {
      return data as Submission;
    }
    
    // Map using the nested path resolution for external API data
    const submissionId = this.getNestedValue(data, 'tx_id', '') || 
                         `SUB-${Math.floor(Math.random() * 90000) + 10000}`;
                         
    const timestamp = this.getNestedValue(data, 'created_on', new Date().toISOString());
    
    // Create the mapped submission object with proper nested structure
    return {
      submissionId,
      timestamp,
      status: this.getNestedValue(data, 'status', 'Unknown'),
      broker: {
        name: this.getNestedValue(data, 'bp_parsed_response.Common.Broker Details.broker_name.value', 'Unknown'),
        email: this.getNestedValue(data, 'bp_parsed_response.Common.Broker Details.broker_email.value', 'Unknown')
      },
      insured: {
        name: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.company_name.value', 'Unknown'),
        industry: {
          code: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.primary_naics_2017[0].code', 'Unknown'),
          description: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.primary_naics_2017[0].desc', 'Unknown')
        },
        address: {
          street: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.address_1.value', ''),
          city: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.city.value', ''),
          state: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.state.value', ''),
          zip: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.postal_code.value', '')
        },
        yearsInBusiness: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.years_in_business.value', ''),
        employeeCount: this.getNestedValue(data, 'bp_parsed_response.Common.Firmographics.total_full_time_employees.value', '')
      }
    };
  }
  
  /**
   * Map API response to our SubmissionDetail type
   * @param data API response data
   * @returns Mapped SubmissionDetail object
   */
  private mapSubmissionDetailResponse(data: any): SubmissionDetail {
    // Check if the data is already in our expected format
    if (data.submissionId && data.complianceChecks) {
      return data as SubmissionDetail;
    }
    
    // First map the base submission data
    const baseSubmission = this.mapSubmissionResponse(data);
    
    // Get lines of coverage as an array
    let coverageLines: string[] = [];
    const normalizedCoverage = this.getNestedValue(data, 'bp_parsed_response.Common.Limits and Coverages.normalized_coverage', null);
    
    if (normalizedCoverage) {
      if (Array.isArray(normalizedCoverage)) {
        coverageLines = normalizedCoverage;
      } else if (typeof normalizedCoverage === 'string') {
        coverageLines = [normalizedCoverage];
      }
    }
    
    // Add the additional detail fields
    return {
      ...baseSubmission,
      coverage: {
        lines: coverageLines,
        effectiveDate: this.getNestedValue(data, 'bp_parsed_response.Common.Product Details.policy_inception_date.value', ''),
        expirationDate: this.getNestedValue(data, 'bp_parsed_response.Common.Product Details.end_date.value', '')
      },
      documents: data.documents || [], // Use documents if available or empty array
      complianceChecks: data.complianceChecks || [] // Use compliance checks if available or empty array
    };
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;