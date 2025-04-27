// src/services/api/apiService.ts
import axios from 'axios';
import { SubmissionData, SubmissionDetail } from '../../types';
import { mockSubmissions, getMockSubmissionDetail } from '../mock/mockData';

class ApiService {
  private baseUrl: string;
  private isDemoMode: boolean;
  private apiMapping: Record<string, any> | null;

  constructor(baseUrl: string, isDemoMode: boolean = true, apiMapping: Record<string, any> | null = null) {
    this.baseUrl = baseUrl;
    this.isDemoMode = isDemoMode;
    this.apiMapping = apiMapping;
  }

  setDemoMode(isDemoMode: boolean): void {
    this.isDemoMode = isDemoMode;
  }

  setApiEndpoint(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  setApiMapping(mapping: Record<string, any> | null): void {
    this.apiMapping = mapping;
  }

  async getSubmissions(filters?: Record<string, any>): Promise<SubmissionData[]> {
    if (this.isDemoMode) {
      // Return mock data with a small delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!filters) {
        return [...mockSubmissions];
      }
      
      // Apply simple filtering if provided
      return mockSubmissions.filter(submission => {
        let match = true;
        
        // Very simple filtering logic for demo purposes
        if (filters.status && submission.status !== filters.status) {
          match = false;
        }
        
        if (filters.broker && !submission.broker.name.toLowerCase().includes(filters.broker.toLowerCase())) {
          match = false;
        }
        
        if (filters.insured && !submission.insured.name.toLowerCase().includes(filters.insured.toLowerCase())) {
          match = false;
        }
        
        return match;
      });
    }
    
    // Live mode - call the actual API
    try {
      const response = await axios.get(`${this.baseUrl}/submissions`, { params: filters });
      
      // Apply data mapping if configured
      if (this.apiMapping) {
        return this.mapApiResponse(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  }

  async getSubmissionDetail(submissionId: string): Promise<SubmissionDetail> {
    if (this.isDemoMode) {
      // Return mock data with a small delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const detail = getMockSubmissionDetail(submissionId);
      if (!detail) {
        throw new Error(`Submission not found: ${submissionId}`);
      }
      
      return detail;
    }
    
    // Live mode - call the actual API
    try {
      const response = await axios.get(`${this.baseUrl}/submissions/${submissionId}`);
      
      // Apply data mapping if configured
      if (this.apiMapping) {
        return this.mapApiResponse(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching submission detail for ${submissionId}:`, error);
      throw error;
    }
  }

  // Helper method to map API response data according to configuration
  private mapApiResponse(data: any): any {
    if (!this.apiMapping) {
      return data;
    }
    
    // Very simple implementation - would be replaced with the actual mapping logic
    // from the configuration utility in a real implementation
    const result: any = {};
    
    for (const [targetKey, sourceKey] of Object.entries(this.apiMapping)) {
      if (typeof sourceKey === 'string') {
        // Simple direct mapping
        const value = this.getValueByPath(data, sourceKey);
        this.setValueByPath(result, targetKey, value);
      } else if (typeof sourceKey === 'object' && sourceKey.transform) {
        // Apply transformation
        const value = this.getValueByPath(data, sourceKey.path);
        const transformedValue = this.applyTransformation(value, sourceKey.transform);
        this.setValueByPath(result, targetKey, transformedValue);
      }
    }
    
    return result;
  }

  // Helper method to get a value from an object by a dot-notation path
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((o, key) => (o || {})[key], obj);
  }

  // Helper method to set a value in an object by a dot-notation path
  private setValueByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) return;
    
    const target = keys.reduce((o, key) => {
      o[key] = o[key] || {};
      return o[key];
    }, obj);
    
    target[lastKey] = value;
  }

  // Helper method to apply a transformation to a value
  private applyTransformation(value: any, transform: string): any {
    // Simple implementation - would be replaced with more robust logic
    switch (transform) {
      case 'toUpperCase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'toLowerCase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'toNumber':
        return Number(value);
      case 'toBoolean':
        return Boolean(value);
      case 'toDate':
        return new Date(value).toISOString();
      default:
        return value;
    }
  }
}

// Create a singleton instance
const apiService = new ApiService('https://api.example.com', true);

export default apiService;