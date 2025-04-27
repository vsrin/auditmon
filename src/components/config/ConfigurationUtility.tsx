// src/components/config/ConfigurationUtility.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab
} from '@mui/material';
import { setApiEndpoint, setApiMapping } from '../../store/slices/configSlice';
import { RootState } from '../../store';
import ModeSwitcher from '../core/ModeSwitcher';

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
      id={`mapping-tabpanel-${index}`}
      aria-labelledby={`mapping-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ConfigurationUtility: React.FC = () => {
  const dispatch = useDispatch();
  const { apiEndpoint, apiMapping } = useSelector((state: RootState) => state.config);
  
  const [endpoint, setEndpoint] = useState(apiEndpoint);
  const [mappingJson, setMappingJson] = useState(apiMapping ? JSON.stringify(apiMapping, null, 2) : '');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [endpointError, setEndpointError] = useState('');
  const [mappingError, setMappingError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndpoint(e.target.value);
  };
  
  const handleMappingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMappingJson(e.target.value);
  };
  
  const handleSaveEndpoint = () => {
    if (!endpoint) {
      setEndpointError('API endpoint cannot be empty');
      return;
    }
    
    try {
      // Validate that the endpoint is a valid URL
      new URL(endpoint);
      
      dispatch(setApiEndpoint(endpoint));
      setEndpointError('');
      showSnackbar('API endpoint saved successfully', 'success');
    } catch (error) {
      setEndpointError('Please enter a valid URL');
    }
  };
  
  const handleSaveMapping = () => {
    if (!mappingJson.trim()) {
      setMappingError('Mapping configuration cannot be empty');
      return;
    }
    
    try {
      const mapping = JSON.parse(mappingJson);
      dispatch(setApiMapping(mapping));
      setMappingError('');
      showSnackbar('API mapping saved successfully', 'success');
    } catch (error) {
      setMappingError('Please enter valid JSON');
    }
  };
  
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  const handleResetMapping = () => {
    setMappingJson('');
    dispatch(setApiMapping({}));
    showSnackbar('API mapping reset', 'success');
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Default mapping without compliance_checks field
  const defaultMapping = {
    "submissionId": "submission.id",
    "timestamp": "submission.created_at",
    "status": "status",
    "broker": {
      "name": "broker.company_name",
      "email": "broker.email_address"
    },
    "insured": {
      "name": "insured.legal_name",
      "industry": {
        "code": "insured.sic_code",
        "description": "insured.industry_description"
      },
      "address": {
        "street": "insured.address.line1",
        "city": "insured.address.city",
        "state": "insured.address.state",
        "zip": "insured.address.postal_code"
      },
      "yearsInBusiness": "insured.years_in_business",
      "employeeCount": "insured.employee_count"
    },
    "coverage": {
      "lines": "submission.coverage_lines",
      "effectiveDate": "submission.effective_date",
      "expirationDate": "submission.expiration_date"
    },
    "documents": "documents"
    // Removed complianceChecks field since it's now handled by the rule engine
  };

  const handleLoadDefaultMapping = () => {
    setMappingJson(JSON.stringify(defaultMapping, null, 2));
  };
  
  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Configuration Utility
        </Typography>
      </Box>
      
      <ModeSwitcher />
      
      <Typography variant="body1" paragraph>
        Use this utility to configure the connection between your API and the monitoring dashboard.
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardHeader title="API Connection Settings" />
        <CardContent>
          <TextField
            fullWidth
            label="API Endpoint URL"
            variant="outlined"
            value={endpoint}
            onChange={handleEndpointChange}
            error={!!endpointError}
            helperText={endpointError}
            sx={{ mb: 2 }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveEndpoint}
          >
            Save Endpoint
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader 
          title="API Mapping Configuration" 
          action={
            <Box>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleLoadDefaultMapping}
                size="small"
                sx={{ mr: 1 }}
              >
                Load Default
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleResetMapping}
                size="small"
              >
                Reset
              </Button>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="mapping configuration tabs">
              <Tab label="JSON Editor" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Typography variant="body2" paragraph>
              Define how your API response fields map to the dashboard's data model using JSON format.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Note: Compliance checks are now generated by the rule engine and should not be mapped from the API.
              </Typography>
            </Alert>
            
            <TextField
              fullWidth
              label="API Mapping JSON"
              variant="outlined"
              multiline
              rows={10}
              value={mappingJson}
              onChange={handleMappingChange}
              error={!!mappingError}
              helperText={mappingError}
              sx={{ mb: 2, fontFamily: '"Roboto Mono", monospace' }}
            />
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveMapping}
            >
              Save Mapping
            </Button>
          </TabPanel>
        </CardContent>
      </Card>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ConfigurationUtility;