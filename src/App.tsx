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
import Alerts from './components/alerts/Alerts'; // Use Alerts component instead of non-existent components

// Configure API service on startup
import apiService from './services/api/apiService';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import ruleEngineProvider from './services/rules/ruleEngineProvider';

// AppContent component to access redux state
const AppContent: React.FC = () => {
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);
  
  // Configure API service based on redux state
  React.useEffect(() => {
    console.log(`Configuring API service - Demo Mode: ${isDemoMode ? 'ON' : 'OFF'}, API Endpoint: ${apiEndpoint}`);
    apiService.setDemoMode(isDemoMode);
    apiService.setApiEndpoint(apiEndpoint);
    
    // FIXED: Ensure rule engine provider is also configured
    if (ruleEngineProvider.setDemoMode) {
      console.log(`Configuring rule engine provider - Demo Mode: ${isDemoMode ? 'ON' : 'OFF'}`);
      ruleEngineProvider.setDemoMode(isDemoMode);
    }
  }, [isDemoMode, apiEndpoint]);
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/submissions" element={<SubmissionList />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/config" element={<ConfigurationUtility />} />
        {/* Use Alerts component for both alerts and rule engine demo */}
        <Route path="/alerts" element={<Alerts />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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