// src/services/appStateService.ts
import { store } from '../store'; 
import { mockSubmissions } from './mock/mockData';
import { 
  fetchSubmissionsSuccess, 
  fetchSubmissionsStart, 
  fetchSubmissionsFailure,
  clearSelectedSubmission 
} from '../store/slices/submissionSlice';
import apiService from './api/apiService';

/**
 * Central service to manage application state transitions, particularly
 * for handling mode switches between demo and live.
 */
class AppStateService {
  private currentMode: boolean = true; // Default to demo mode
  
  /**
   * Performs necessary state cleanup and initialization when switching modes
   * @param isDemoMode Whether the app is switching to demo mode
   */
  switchMode(isDemoMode: boolean): void {
    console.log(`AppStateService - Switching to ${isDemoMode ? 'DEMO' : 'LIVE'} mode`);
    
    // If switching from demo to live or vice versa, we need to reset state
    if (this.currentMode !== isDemoMode) {
      this.currentMode = isDemoMode;
      this.resetState();
      
      // Preload any necessary data for the new mode
      if (isDemoMode) {
        this.preloadDemoData();
      } else {
        this.preloadLiveData();
      }
    }
  }

  /**
   * Reset application state to prevent issues when switching modes
   */
  private resetState(): void {
    // Clear the Redux state to avoid stale data between mode switches
    console.log('AppStateService - Resetting application state');
    
    // Clear any selected submission
    store.dispatch(clearSelectedSubmission());
    
    // Reset submissions list to empty to force a reload
    store.dispatch(fetchSubmissionsSuccess([]));
  }

  /**
   * Preload demo data into the Redux store to ensure it's immediately available
   */
  private preloadDemoData(): void {
    console.log('AppStateService - Preloading demo data');
    
    // Preload submissions data to avoid delays
    store.dispatch(fetchSubmissionsStart());
    store.dispatch(fetchSubmissionsSuccess(mockSubmissions));
  }
  
  /**
   * Preload live data by triggering API calls
   */
  private preloadLiveData(): void {
    console.log('AppStateService - Preloading live data');
    
    // Start loading submissions
    store.dispatch(fetchSubmissionsStart());
    
    // Fetch from API
    apiService.getSubmissions()
      .then(data => {
        store.dispatch(fetchSubmissionsSuccess(data));
      })
      .catch(error => {
        console.error('Error preloading live data:', error);
        store.dispatch(fetchSubmissionsFailure('Failed to load submissions from API'));
      });
  }

  /**
   * Force refresh state from the appropriate source (mock or API)
   * @param isDemoMode Current mode of the application
   */
  refreshState(isDemoMode: boolean): void {
    console.log(`AppStateService - Forcing state refresh in ${isDemoMode ? 'DEMO' : 'LIVE'} mode`);
    
    // Clear any selected submission
    store.dispatch(clearSelectedSubmission());
    
    // Start loading
    store.dispatch(fetchSubmissionsStart());
    
    if (isDemoMode) {
      // In demo mode, reload from mock data
      setTimeout(() => {
        store.dispatch(fetchSubmissionsSuccess(mockSubmissions));
      }, 300); // Add a small delay for UI feedback
    } else {
      // In live mode, fetch from API
      apiService.getSubmissions()
        .then(data => {
          store.dispatch(fetchSubmissionsSuccess(data));
        })
        .catch(error => {
          console.error('Error refreshing live data:', error);
          store.dispatch(fetchSubmissionsFailure('Failed to refresh submissions from API'));
        });
    }
  }
}

// Export singleton instance
const appStateService = new AppStateService();
export default appStateService;