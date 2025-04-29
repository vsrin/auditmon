// src/components/settings/Settings.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Stack
} from '@mui/material';
import ModeSwitcher from '../core/ModeSwitcher';
import { RootState } from '../../store';
import { 
  setUseRemoteRuleEngine, 
  setRuleEngineApiUrl,
  setApiEndpoint,
  setDemoMode
} from '../../store/slices/configSlice';
import axios from 'axios';
import apiService from '../../services/api/apiService';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';

// Status type for API tests
type TestStatus = {
  tested: boolean;
  success: boolean;
  message: string;
};

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);
  
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('60');
  const [darkMode, setDarkMode] = useState(false);
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // State for API and Rule Engine testing
  const [apiEndpointInput, setApiEndpointInput] = useState(config.apiEndpoint || 'http://localhost:8000/api');
  const [ruleEngineUrlInput, setRuleEngineUrlInput] = useState(config.ruleEngineApiUrl || 'http://localhost:3001/api');
  const [testingApi, setTestingApi] = useState(false);
  const [testingRuleEngine, setTestingRuleEngine] = useState(false);
  
  // Separate test status for each API
  const [apiTestStatus, setApiTestStatus] = useState<TestStatus>({
    tested: false,
    success: false,
    message: ''
  });
  
  const [ruleEngineTestStatus, setRuleEngineTestStatus] = useState<TestStatus>({
    tested: false,
    success: false,
    message: ''
  });
  
  // Toggle for remote rule engine
  const [useRemoteRuleEngine, setUseRemoteRuleEngineState] = useState(config.useRemoteRuleEngine);
  
  // Check if settings can be saved
  const canSaveSettings = () => {
    // If using demo mode, we can always save
    if (config.isDemoMode) {
      return true;
    }
    
    // If in live mode, API must be tested and successful
    if (!apiTestStatus.tested || !apiTestStatus.success) {
      return false;
    }
    
    // If using remote rule engine, it must be tested and successful
    if (useRemoteRuleEngine && (!ruleEngineTestStatus.tested || !ruleEngineTestStatus.success)) {
      return false;
    }
    
    // All required tests passed
    return true;
  };
  
  const handleSaveSettings = () => {
    if (!canSaveSettings()) {
      setSnackbarMessage('Cannot save settings. Please ensure all required tests pass.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    
    // Save API endpoint
    dispatch(setApiEndpoint(apiEndpointInput));
    apiService.setApiEndpoint(apiEndpointInput);
    
    // Save Rule Engine settings
    dispatch(setUseRemoteRuleEngine(useRemoteRuleEngine));
    if (useRemoteRuleEngine) {
      dispatch(setRuleEngineApiUrl(ruleEngineUrlInput));
      if (ruleEngineProvider.configure) {
        ruleEngineProvider.configure(useRemoteRuleEngine, ruleEngineUrlInput);
      }
    }
    
    // If we're in live mode and the API test failed, force to demo mode
    if (!config.isDemoMode && !apiTestStatus.success) {
      dispatch(setDemoMode(true));
      apiService.setDemoMode(true);
      if (ruleEngineProvider.setDemoMode) {
        ruleEngineProvider.setDemoMode(true);
      }
      setSnackbarMessage('API test failed. Switched to Demo Mode.');
      setSnackbarSeverity('warning');
    } else {
      setSnackbarMessage('Settings saved successfully');
      setSnackbarSeverity('success');
    }
    
    setOpenSnackbar(true);
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  // Test API connection
  const testApiConnection = async () => {
    setTestingApi(true);
    
    try {
      // Get base endpoint without /api if it ends with it
      const baseEndpoint = apiEndpointInput.endsWith('/api') 
        ? apiEndpointInput 
        : `${apiEndpointInput}`;
      
      // Test against the correct endpoint with the /submissions path
      const testUrl = `${baseEndpoint}/submissions`;
      console.log(`Testing API connection to: ${testUrl}`);
      
      const response = await axios.get(testUrl, {
        timeout: 5000
      });
      
      if (response.status === 200 && Array.isArray(response.data)) {
        const submissionsCount = response.data.length;
        
        // Make sure the endpoint ends with /api
        const normalizedEndpoint = baseEndpoint.endsWith('/api') 
          ? baseEndpoint 
          : `${baseEndpoint}/api`;
          
        setApiEndpointInput(normalizedEndpoint);
        
        setApiTestStatus({
          tested: true,
          success: true,
          message: `Successfully connected to API server at ${normalizedEndpoint}. Retrieved ${submissionsCount} submissions from endpoint /submissions.`
        });
        setSnackbarMessage(`API connection successful: Retrieved ${submissionsCount} submissions from the server.`);
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setApiTestStatus({
          tested: true,
          success: false,
          message: `API server returned unexpected data format. Expected an array of submissions.`
        });
        setSnackbarMessage('API connection failed: Unexpected data format');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      // Handle connection errors
      setApiTestStatus({
        tested: true,
        success: false,
        message: `Could not connect to API server: ${error instanceof Error ? error.message : String(error)}`
      });
      setSnackbarMessage('API connection failed');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setTestingApi(false);
    }
  };
  
  // Test Rule Engine API connection
  const testRuleEngineConnection = async () => {
    setTestingRuleEngine(true);
    
    try {
      // For the rule engine, test the health endpoint
      // Note: Make sure your rule engine has this endpoint, or adapt to an endpoint it does have
      const healthUrl = `${ruleEngineUrlInput}/health`;
      console.log(`Testing Rule Engine connection to: ${healthUrl}`);
      
      const response = await axios.get(healthUrl, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        setRuleEngineTestStatus({
          tested: true,
          success: true,
          message: `Successfully connected to Rule Engine API at ${ruleEngineUrlInput}. The service is healthy and ready to process compliance checks.`
        });
        setSnackbarMessage('Rule Engine API connection successful: Service is healthy and responsive.');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setRuleEngineTestStatus({
          tested: true,
          success: false,
          message: `Rule Engine API returned unexpected status: ${response.status}`
        });
        setSnackbarMessage('Rule Engine API connection failed: Unexpected response');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      // Try a fallback if health endpoint doesn't exist - just test if the server is reachable
      try {
        // Fallback to just checking if the server exists
        const baseUrl = ruleEngineUrlInput.split('/api')[0]; // Get base URL without /api
        const response = await axios.get(`${baseUrl}`, {
          timeout: 5000
        });
        
        if (response.status >= 200 && response.status < 500) {
          setRuleEngineTestStatus({
            tested: true,
            success: true,
            message: `Successfully connected to Rule Engine server at ${baseUrl}. The service appears to be running.`
          });
          setSnackbarMessage('Rule Engine server connection successful.');
          setSnackbarSeverity('success');
          setOpenSnackbar(true);
          return;
        }
      } catch (fallbackError) {
        console.error('Fallback rule engine check failed:', fallbackError);
      }
      
      // If we get here, both attempts failed
      setRuleEngineTestStatus({
        tested: true,
        success: false,
        message: `Could not connect to Rule Engine API: ${error instanceof Error ? error.message : String(error)}`
      });
      setSnackbarMessage('Rule Engine API connection failed');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setTestingRuleEngine(false);
    }
  };
  
  // Reset test status when inputs change
  const handleApiEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiEndpointInput(e.target.value);
    setApiTestStatus({
      tested: false,
      success: false,
      message: ''
    });
  };
  
  const handleRuleEngineUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRuleEngineUrlInput(e.target.value);
    setRuleEngineTestStatus({
      tested: false,
      success: false,
      message: ''
    });
  };
  
  const handleUseRemoteRuleEngineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseRemoteRuleEngineState(e.target.checked);
    
    // If turning off remote rule engine, we don't need to test it
    if (!e.target.checked) {
      setRuleEngineTestStatus({
        tested: true,
        success: true,
        message: 'Using local rule engine, no remote testing needed.'
      });
    } else {
      // If turning on, reset the test status
      setRuleEngineTestStatus({
        tested: false,
        success: false,
        message: ''
      });
    }
  };
  
  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Application Mode Card */}
          <Box sx={{ width: '100%', p: 1.5 }}>
            <Card>
              <CardHeader title="Application Mode" />
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Toggle between Demo mode (using synthetic data) and Live mode (connecting to the API).
                </Typography>
                <ModeSwitcher />
              </CardContent>
            </Card>
          </Box>
          
          {/* API Configuration Card */}
          <Box sx={{ width: '100%', p: 1.5 }}>
            <Card>
              <CardHeader title="API Configuration" />
              <CardContent>
                <Typography variant="body2" paragraph>
                  Configure the API server endpoint for Live mode. This is the base URL for all API requests.
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <TextField
                    label="API Endpoint URL"
                    value={apiEndpointInput}
                    onChange={handleApiEndpointChange}
                    fullWidth
                    margin="normal"
                    placeholder="http://localhost:8000/api"
                    helperText="Example: http://localhost:8000/api"
                    sx={{ mr: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={testApiConnection}
                    disabled={testingApi || !apiEndpointInput}
                    sx={{ mt: 3, minWidth: '120px', height: '56px' }}
                  >
                    {testingApi ? <CircularProgress size={24} color="inherit" /> : 'Test API'}
                  </Button>
                </Box>
                
                {apiTestStatus.tested && (
                  <Alert 
                    severity={apiTestStatus.success ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                  >
                    {apiTestStatus.message}
                  </Alert>
                )}
                
                <Alert severity="info">
                  <Typography variant="body2">
                    The API server should be running and accessible from your browser.
                    API test must pass to use Live mode. Expecting endpoint <strong>/api/submissions</strong> to return an array of submissions.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Box>
          
          {/* Rule Engine Settings Card */}
          <Box sx={{ width: '100%', p: 1.5 }}>
            <Card>
              <CardHeader title="Rule Engine Settings" />
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  The rule engine is responsible for evaluating compliance checks on submissions.
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={useRemoteRuleEngine}
                      onChange={handleUseRemoteRuleEngineChange}
                      color="primary"
                    />
                  }
                  label="Use Remote Rule Engine"
                  sx={{ mb: 2, display: 'block' }}
                />
                
                {useRemoteRuleEngine && (
                  <Stack spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <TextField
                        label="Rule Engine API URL"
                        value={ruleEngineUrlInput}
                        onChange={handleRuleEngineUrlChange}
                        fullWidth
                        margin="normal"
                        placeholder="http://localhost:3001/api"
                        helperText="Example: http://localhost:3001/api"
                        sx={{ mr: 2 }}
                      />
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={testRuleEngineConnection}
                        disabled={testingRuleEngine || !ruleEngineUrlInput}
                        sx={{ mt: 3, minWidth: '120px', height: '56px' }}
                      >
                        {testingRuleEngine ? <CircularProgress size={24} color="inherit" /> : 'Test Engine'}
                      </Button>
                    </Box>
                    
                    {ruleEngineTestStatus.tested && (
                      <Alert 
                        severity={ruleEngineTestStatus.success ? 'success' : 'error'} 
                        sx={{ mb: 2 }}
                      >
                        {ruleEngineTestStatus.message}
                      </Alert>
                    )}
                    
                    {!config.isDemoMode && useRemoteRuleEngine && !ruleEngineTestStatus.tested && (
                      <Alert severity="warning">
                        <Typography variant="body2">
                          Remote Rule Engine must be tested before saving settings if in Live mode.
                        </Typography>
                      </Alert>
                    )}
                  </Stack>
                )}
                
                <Alert severity="info">
                  <Typography variant="body2">
                    When enabled, compliance checks will use the remote rule engine service.
                    When disabled, compliance checks will use the built-in rule engine.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Box>
          
          {/* Display Settings */}
          <Box sx={{ width: '50%', p: 1.5 }}>
            <Card>
              <CardHeader title="Display Settings" />
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Dark Mode"
                  sx={{ mb: 2, display: 'block' }}
                />
                
                <Divider sx={{ my: 2 }} />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={dateFormat}
                    label="Date Format"
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Box>
          
          {/* Data Refresh Settings */}
          <Box sx={{ width: '50%', p: 1.5 }}>
            <Card>
              <CardHeader title="Data Refresh Settings" />
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Auto-refresh Data"
                  sx={{ mb: 2, display: 'block' }}
                />
                
                <TextField
                  label="Refresh Interval (seconds)"
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  disabled={!autoRefresh}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </CardContent>
            </Card>
          </Box>
          
          {/* Save Button Area */}
          <Box sx={{ width: '100%', p: 1.5 }}>
            <Box display="flex" justifyContent="space-between" mt={2}>
              <Alert severity={canSaveSettings() ? 'success' : 'warning'} sx={{ flexGrow: 1, mr: 2 }}>
                <Typography variant="body2">
                  {canSaveSettings() 
                    ? 'All required tests have passed. You can save settings.' 
                    : 'Some required tests have not passed or have not been run. Settings cannot be saved.'}
                </Typography>
              </Alert>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveSettings}
                disabled={!canSaveSettings()}
              >
                Save Settings
              </Button>
            </Box>
          </Box>
        </Grid>
      </Box>
      
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

export default Settings;