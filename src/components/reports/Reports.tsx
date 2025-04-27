// src/components/reports/Reports.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api/apiService';
import ComplianceStatusReport from './ComplianceStatusReport';
import DocumentCompleteness from './DocumentCompleteness';
import SubmissionTrends from './SubmissionTrends';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);
  
  // Configure API service based on current settings
  useEffect(() => {
    apiService.setDemoMode(isDemoMode);
    apiService.setApiEndpoint(apiEndpoint);
  }, [isDemoMode, apiEndpoint]);
  
  // Load submissions data
  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await apiService.getSubmissions();
        setSubmissions(data);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    loadSubmissions();
  }, [isDemoMode]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  return (
    <div>
      <Box display="flex" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Analytics & Reporting
        </Typography>
      </Box>
      
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {!loading && !error && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography>
                View detailed reports and analytics based on submission data. These reports provide 
                insights into compliance status, document completeness, and submission trends.
              </Typography>
            </CardContent>
          </Card>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="report tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Compliance Status" />
              <Tab label="Document Completeness" />
              <Tab label="Submission Trends" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <ComplianceStatusReport submissions={submissions} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <DocumentCompleteness submissions={submissions} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <SubmissionTrends submissions={submissions} />
          </TabPanel>
        </>
      )}
    </div>
  );
};

export default Reports;