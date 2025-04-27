// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import theme from './theme';
import Layout from './components/core/Layout';
import Dashboard from './components/dashboard/Dashboard';
import SubmissionList from './components/submissions/SubmissionList';
import SubmissionDetail from './components/submissions/SubmissionDetail';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import ConfigurationUtility from './components/config/ConfigurationUtility';
import Alerts from './components/alerts/Alerts';
import { store } from './store'; // Fixed: Using named import for store

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submissions" element={<SubmissionList />} />
              <Route path="/submissions/:id" element={<SubmissionDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/config" element={<ConfigurationUtility />} />
              <Route path="/alerts" element={<Alerts />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;