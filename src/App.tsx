// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store'; // Fixed: Import store as named export
import theme from './theme';

// Layout
import Layout from './components/core/Layout';

// Pages
import Dashboard from './components/dashboard/Dashboard';
import SubmissionList from './components/submissions/SubmissionList';
import SubmissionDetail from './components/submissions/SubmissionDetail';
import Settings from './components/settings/Settings';
import ConfigurationUtility from './components/config/ConfigurationUtility';
import Alerts from './components/alerts/Alerts';
import RuleEngineDemo from './services/rules/RuleEngineDemo'; // Import RuleEngineDemo component
import ApiDebugPage from './components/debug/ApiDebugPage'; // Import the new API Debug Page
import AuditComplianceDashboard from './components/audit/AuditComplianceDashboard';


// Configure API service on startup
import apiService from './services/api/apiService';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import ruleEngineProvider from './services/rules/ruleEngineProvider';

// AppContent component to access redux state
const AppContent: React.FC = () => {
  const { isDemoMode, apiEndpoint, useRemoteRuleEngine, ruleEngineApiUrl } = useSelector((state: RootState) => state.config);
  
  // Configure API service based on redux state
  React.useEffect(() => {
    console.log(`Configuring API service - Demo Mode: ${isDemoMode ? 'ON' : 'OFF'}, API Endpoint: ${apiEndpoint}`);
    apiService.setDemoMode(isDemoMode);
    apiService.setApiEndpoint(apiEndpoint);
    
    // Configure rule engine provider
    if (ruleEngineProvider.setDemoMode) {
      console.log(`Configuring rule engine provider - Demo Mode: ${isDemoMode ? 'ON' : 'OFF'}`);
      ruleEngineProvider.setDemoMode(isDemoMode);
    }
    
    // Configure rule engine provider with remote settings
    if (ruleEngineProvider.configure) {
      console.log(`Configuring rule engine provider with remote settings - Remote: ${useRemoteRuleEngine ? 'ON' : 'OFF'}, API URL: ${ruleEngineApiUrl}`);
      ruleEngineProvider.configure(useRemoteRuleEngine, ruleEngineApiUrl);
    }
  }, [isDemoMode, apiEndpoint, useRemoteRuleEngine, ruleEngineApiUrl]);
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/submissions" element={<SubmissionList />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/config" element={<ConfigurationUtility />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/rule-engine" element={<RuleEngineDemo />} />
        <Route path="/api-debug" element={<ApiDebugPage />} /> {/* Add the API Debug Page route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/audit-compliance" element={<AuditComplianceDashboard />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

export default App;