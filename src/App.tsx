// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { store } from './store';
import Layout from './components/core/Layout';
import Dashboard from './components/dashboard/Dashboard';
import SubmissionList from './components/submissions/SubmissionList';
import SubmissionDetail from './components/submissions/SubmissionDetail';
import ConfigurationUtility from './components/config/ConfigurationUtility';
import Settings from './components/settings/Settings';

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
              <Route path="/config" element={<ConfigurationUtility />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;