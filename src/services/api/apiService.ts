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
      
      // Ensure the response data matches our expected format
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
    
    // Otherwise map from the API format
    return {
      submissionId: data.id || `SUB-${Math.floor(Math.random() * 90000) + 10000}`,
      insured: data.insured,
      broker: data.broker,
      timestamp: data.timestamp || data.created_at || new Date().toISOString(),
      status: data.status
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
    
    // Otherwise map from the API format
    return {
      submissionId: data.submissionId || data.id || `SUB-${Math.floor(Math.random() * 90000) + 10000}`,
      insured: data.insured,
      broker: data.broker,
      timestamp: data.timestamp || data.created_at || new Date().toISOString(),
      status: data.status,
      coverage: data.coverage,
      documents: data.documents,
      complianceChecks: data.complianceChecks || []
    };
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;