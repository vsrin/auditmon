// src/services/data/dataProvider.ts
import axios from 'axios';
import { Submission, SubmissionDetail } from '../../types';
import { mockSubmissions, getMockSubmissionDetail } from '../mock/mockData';

/**
 * Interface for data providers to ensure consistent implementation
 */
interface DataProviderInterface {
  getSubmissions(): Promise<Submission[]>;
  getSubmissionDetail(id: string): Promise<SubmissionDetail>;
}

/**
 * Live data provider that fetches data from real APIs
 */
class LiveDataProvider implements DataProviderInterface {
  private apiEndpoint: string;
  
  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
  }
  
  /**
   * Set the API endpoint
   * @param endpoint API endpoint URL
   */
  setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
    console.log(`LiveDataProvider - API Endpoint set to: ${endpoint}`);
  }
  
  /**
   * Get the current API endpoint
   * @returns The API endpoint URL
   */
  getApiEndpoint(): string {
    return this.apiEndpoint;
  }
  
  /**
   * Get all submissions from the live API
   */
  async getSubmissions(): Promise<Submission[]> {
    try {
      console.log(`LiveDataProvider - Fetching submissions from: ${this.apiEndpoint}/submissions`);
      const response = await axios.get(`${this.apiEndpoint}/submissions`);
      console.log(`LiveDataProvider - Received ${response.data.length} submissions`);
      return response.data;
    } catch (error) {
      console.error('LiveDataProvider - Error fetching submissions:', error);
      throw error;
    }
  }
  
  /**
   * Get submission detail from the live API
   * @param id Submission ID
   */
  async getSubmissionDetail(id: string): Promise<SubmissionDetail> {
    try {
      console.log(`LiveDataProvider - Fetching submission detail for ID ${id} from: ${this.apiEndpoint}/submissions/${id}`);
      const response = await axios.get(`${this.apiEndpoint}/submissions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`LiveDataProvider - Error fetching submission detail for ID ${id}:`, error);
      throw error;
    }
  }
}

/**
 * Mock data provider that returns predefined data for demo mode
 */
class MockDataProvider implements DataProviderInterface {
  /**
   * Get all submissions from mock data
   */
  async getSubmissions(): Promise<Submission[]> {
    console.log('MockDataProvider - Returning mock submissions data');
    // Simulate network delay in demo mode
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockSubmissions];
  }
  
  /**
   * Get submission detail from mock data
   * @param id Submission ID
   */
  async getSubmissionDetail(id: string): Promise<SubmissionDetail> {
    console.log(`MockDataProvider - Returning mock submission detail for ID: ${id}`);
    // Simulate network delay in demo mode
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = getMockSubmissionDetail(id);
    if (!mockData) {
      throw new Error(`Submission with ID ${id} not found in mock data`);
    }
    
    return mockData;
  }
}

// Properly export the types and classes
export { LiveDataProvider, MockDataProvider };
export type { DataProviderInterface };