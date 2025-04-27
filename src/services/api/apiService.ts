// src/services/api/apiService.ts
import { mockSubmissions, getMockSubmissionDetail } from '../mock/mockData';

class ApiService {
  private isDemoMode: boolean = true;
  private apiEndpoint: string = '';
  private apiMapping: any = null;

  constructor() {
    // Initialize from localStorage if available
    try {
      const savedDemoMode = localStorage.getItem('isDemoMode');
      const savedApiEndpoint = localStorage.getItem('apiEndpoint');
      const savedApiMapping = localStorage.getItem('apiMapping');
      
      if (savedDemoMode) {
        this.isDemoMode = JSON.parse(savedDemoMode);
      }
      
      if (savedApiEndpoint) {
        this.apiEndpoint = savedApiEndpoint;
      }
      
      if (savedApiMapping) {
        this.apiMapping = JSON.parse(savedApiMapping);
      }
    } catch (e) {
      console.error('Error initializing API service from localStorage', e);
    }
  }

  setDemoMode(mode: boolean): void {
    this.isDemoMode = mode;
    localStorage.setItem('isDemoMode', JSON.stringify(mode));
  }

  setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
    localStorage.setItem('apiEndpoint', endpoint);
  }

  setApiMapping(mapping: any): void {
    this.apiMapping = mapping;
    localStorage.setItem('apiMapping', JSON.stringify(mapping));
  }

  // Apply mapping to transform API response to our data model
  private applyMapping(data: any, mapping: any): any {
    if (!mapping || !data) return data;
    
    // Simple field mapping for now
    const result: any = {};
    
    for (const [key, path] of Object.entries(mapping)) {
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

  async getSubmissions(): Promise<any[]> {
    if (this.isDemoMode) {
      return Promise.resolve(mockSubmissions);
    }
    
    try {
      // Log the URL being used for debugging
      console.log(`Fetching submissions from: ${this.apiEndpoint}/submissions`);
      
      const response = await fetch(`${this.apiEndpoint}/submissions`, {
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`API error: ${response.status} - ${response.statusText}`);
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      // If we have mapping, apply it to each submission
      if (this.apiMapping) {
        return data.map((item: any) => this.applyMapping(item, this.apiMapping));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // Add more detailed error info
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('This may be a CORS or network connectivity issue.');
        console.error('Check that your Flask server is running and accessible.');
        console.error('Verify API endpoint URL is correct:', this.apiEndpoint);
      }
      throw error;
    }
  }

  async getSubmissionDetail(id: string): Promise<any> {
    if (this.isDemoMode) {
      // Use the getMockSubmissionDetail function if it exists, or fall back to finding in mockSubmissions
      if (typeof getMockSubmissionDetail === 'function') {
        return Promise.resolve(getMockSubmissionDetail(id));
      }
      
      return Promise.resolve(
        mockSubmissions.find((sub: any) => sub.submissionId === id) || mockSubmissions[0]
      );
    }
    
    try {
      // Log the URL being used for debugging
      console.log(`Fetching submission details from: ${this.apiEndpoint}/submissions/${id}`);
      
      const response = await fetch(`${this.apiEndpoint}/submissions/${id}`, {
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`API error: ${response.status} - ${response.statusText}`);
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response for submission detail:', data);
      
      // Apply mapping if available
      if (this.apiMapping) {
        return this.applyMapping(data, this.apiMapping);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching submission ${id}:`, error);
      // Add more detailed error info
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('This may be a CORS or network connectivity issue.');
        console.error('Check that your Flask server is running and accessible.');
        console.error('Verify API endpoint URL is correct:', this.apiEndpoint);
      }
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService;