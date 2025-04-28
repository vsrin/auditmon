// src/hooks/useModeSwitching.ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import apiService from '../services/api/apiService';
import ruleEngineProvider from '../services/rules/ruleEngineProvider';
import appStateService from '../services/appStateService';

/**
 * Custom hook to handle demo/live mode switching across components
 * @param componentName Name of the component using the hook (for logging)
 */
export const useModeSwitching = (componentName: string) => {
  const { isDemoMode, apiEndpoint, useRemoteRuleEngine, ruleEngineApiUrl } = useSelector(
    (state: RootState) => state.config
  );
  
  // Local state to track previous mode
  const [prevMode, setPrevMode] = useState<boolean>(isDemoMode);

  // Configure API and rule engine when mode changes
  useEffect(() => {
    // Only execute if the mode has actually changed
    if (prevMode !== isDemoMode) {
      console.log(`${componentName} - Mode changed from ${prevMode ? 'DEMO' : 'LIVE'} to ${isDemoMode ? 'DEMO' : 'LIVE'}`);
      
      // Update previous mode tracking
      setPrevMode(isDemoMode);
      
      // Configure API service
      apiService.setDemoMode(isDemoMode);
      
      // Only set API endpoint for live mode
      if (!isDemoMode) {
        apiService.setApiEndpoint(apiEndpoint);
      }
      
      // Configure rule engine
      if (ruleEngineProvider.setDemoMode) {
        ruleEngineProvider.setDemoMode(isDemoMode);
      }
      
      // Configure rule engine remote settings
      if (ruleEngineProvider.configure) {
        ruleEngineProvider.configure(useRemoteRuleEngine, ruleEngineApiUrl);
      }
      
      // Trigger app-wide state transition
      appStateService.switchMode(isDemoMode);
    } else {
      // Mode hasn't changed, but we might need to update API endpoint
      if (!isDemoMode) {
        apiService.setApiEndpoint(apiEndpoint);
      }
      
      // And rule engine settings
      if (ruleEngineProvider.configure) {
        ruleEngineProvider.configure(useRemoteRuleEngine, ruleEngineApiUrl);
      }
    }
  }, [componentName, isDemoMode, apiEndpoint, useRemoteRuleEngine, ruleEngineApiUrl, prevMode]);

  return {
    isDemoMode,
    isLiveMode: !isDemoMode,
    forceRefresh: () => appStateService.refreshState(isDemoMode)
  };
};

export default useModeSwitching;