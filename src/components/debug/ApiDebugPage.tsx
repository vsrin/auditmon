// src/components/debug/ApiDebugPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Alert, 
  TextField,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api/apiService';
import { setDemoMode, setApiEndpoint } from '../../store/slices/configSlice';

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
      id={`debug-tabpanel-${index}`}
      aria-labelledby={`debug-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Combined implementation - ApiDebugUtility directly included in ApiDebugPage
const ApiDebugPage: React.FC = () => {
  const dispatch = useDispatch();
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);
  const [localEndpoint, setLocalEndpoint] = useState(apiEndpoint);
  const [tabValue, setTabValue] = useState(0);
  
  // ApiDebugUtility state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [transformedData, setTransformedData] = useState<any>(null);
  const [debugApiEndpoint, setDebugApiEndpoint] = useState(apiEndpoint);
  
  // MongoDB specific fields
  const [mongoUri, setMongoUri] = useState('mongodb+srv://artifi:root@artifi.2vi2m.mongodb.net/?retryWrites=true&w=majority&appName=Artifi');
  const [mongoDb, setMongoDb] = useState('Submission_Intake');
  const [mongoCollection, setMongoCollection] = useState('BP_service');
  
  // Sample data for testing
  const [sampleData, setSampleData] = useState<any>(null);
  const [testingFieldMapping, setTestingFieldMapping] = useState(false);
  
  useEffect(() => {
    // Update local endpoint when redux state changes
    setLocalEndpoint(apiEndpoint);
    setDebugApiEndpoint(apiEndpoint);
  }, [apiEndpoint]);
  
  const handleToggleDemoMode = () => {
    dispatch(setDemoMode(!isDemoMode));
  };
  
  const handleApiEndpointChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalEndpoint(event.target.value);
  };
  
  const handleDebugApiEndpointChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDebugApiEndpoint(event.target.value);
  };
  
  const handleSaveApiEndpoint = () => {
    dispatch(setApiEndpoint(localEndpoint));
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const fetchRawData = async () => {
    setLoading(true);
    setError(null);
    setRawResponse(null);
    setTransformedData(null);
    
    try {
      // Try to get the API endpoint if it's not already set
      const endpoint = debugApiEndpoint || apiEndpoint || 'http://localhost:8000/api';
      
      // Make a direct axios call to see the raw response
      const axios = await import('axios');
      const response = await axios.default.get(`${endpoint}/submissions`);
      setRawResponse(response.data);
      
      // Then use the apiService to see how it transforms the data
      // Temporarily set apiService endpoint if different from global
      const originalEndpoint = (apiService as any).apiEndpoint;
      if (endpoint !== originalEndpoint) {
        apiService.setApiEndpoint(endpoint);
      }
      
      const processedData = await apiService.getSubmissions();
      setTransformedData(processedData);
      
      // Restore original endpoint if changed
      if (endpoint !== originalEndpoint) {
        apiService.setApiEndpoint(originalEndpoint);
      }
    } catch (err) {
      console.error('Debug fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const generateSampleData = () => {
    // Create a sample data structure matching the expected MongoDB structure
    const sampleData = {
      tx_id: `TEST-${Date.now()}`,
      created_on: new Date().toISOString(),
      status: "New",
      bp_parsed_response: {
        Common: {
          "Broker Details": {
            broker_name: { value: "Sample Broker LLC" },
            broker_email: { value: "broker@example.com" }
          },
          Firmographics: {
            company_name: { value: "Sample Company Inc." },
            primary_naics_2017: [
              { code: "5242", desc: "Insurance Agencies and Brokerages" }
            ],
            address_1: { value: "123 Main Street" },
            city: { value: "Boston" },
            state: { value: "MA" },
            postal_code: { value: "02108" },
            years_in_business: { value: "15" },
            total_full_time_employees: { value: "250" }
          },
          "Limits and Coverages": {
            normalized_coverage: ["General Liability", "Property", "Workers Comp"]
          },
          "Product Details": {
            policy_inception_date: { value: "2025-06-01" },
            end_date: { value: "2026-06-01" }
          }
        }
      }
    };
    
    setSampleData(sampleData);
  };
  
  const testFieldMapping = () => {
    if (!sampleData) {
      generateSampleData();
    }
    
    setTestingFieldMapping(true);
    
    try {
      // Use apiService to map the sample data
      const mappedData = (apiService as any).mapSubmissionResponse(sampleData);
      setTransformedData([mappedData]);
      setTestingFieldMapping(false);
    } catch (err) {
      console.error('Mapping test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error mapping fields');
      setTestingFieldMapping(false);
    }
  };
  
  // Helper function to safely get nested value
  const getNestedValue = (obj: any, path: string, defaultValue: any = undefined): any => {
    if (!obj || !path) return defaultValue;
    
    const normalizePath = (p: string): string[] => {
      return p.replace(/\[(\d+)\]/g, '.$1').split('.');
    };
    
    const keys = normalizePath(path);
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  };
  
  return (
    <Box my={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          API Integration Debug
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application Configuration
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={!isDemoMode}
              onChange={handleToggleDemoMode}
              name="demoMode"
              color="primary"
            />
          }
          label={`Mode: ${isDemoMode ? 'Demo (using mock data)' : 'Live (using API data)'}`}
        />
        
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            Current API Endpoint: {apiEndpoint}
          </Typography>
          <input
            type="text"
            value={localEndpoint}
            onChange={handleApiEndpointChange}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              marginBottom: '16px'
            }}
            placeholder="Enter API endpoint URL"
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveApiEndpoint}
          >
            Save API Endpoint
          </Button>
        </Box>
      </Paper>
      
      {/* Tabs for different debug approaches */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="API Testing" />
          <Tab label="Field Mapping Test" />
          <Tab label="MongoDB Connection" />
        </Tabs>
        
        {/* API Testing Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>
            API Debug Utility
          </Typography>
          
          <Box sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Test API Endpoint Configuration
            </Typography>
            <TextField
              fullWidth
              label="Debug API Endpoint"
              variant="outlined"
              value={debugApiEndpoint}
              onChange={handleDebugApiEndpointChange}
              placeholder="http://localhost:8000/api"
              sx={{ mb: 2 }}
              helperText="You can test a different endpoint here without changing your application settings"
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={fetchRawData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Fetching...' : 'Fetch API Data'}
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {rawResponse && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Raw API Response
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0, 0, 0, 0.04)', 
                  borderRadius: 1, 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  fontSize: '0.75rem'
                }}
              >
                {JSON.stringify(rawResponse, null, 2)}
              </Box>
            </Paper>
          )}
          
          {transformedData && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Transformed Data (After apiService Processing)
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0, 0, 0, 0.04)', 
                  borderRadius: 1, 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  fontSize: '0.75rem'
                }}
              >
                {JSON.stringify(transformedData, null, 2)}
              </Box>
            </Paper>
          )}
          
          {rawResponse && transformedData && (
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Data Mapping Issues
              </Typography>
              <Box mt={2}>
                {transformedData.map((item: any, index: number) => (
                  <Box key={index} mb={2}>
                    <Typography variant="subtitle2">
                      Submission ID: {item.submissionId || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="error">
                      {!item.insured?.name ? '• Missing insured name' : ''}
                    </Typography>
                    <Typography variant="body2" color="error">
                      {!item.insured?.industry?.description ? '• Missing industry description' : ''}
                    </Typography>
                    <Typography variant="body2" color="error">
                      {!item.status ? '• Missing status' : ''}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </TabPanel>
        
        {/* Field Mapping Test Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Field Mapping Test
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            This tool lets you test the field mapping without needing to connect to an API. 
            It will generate sample data and run it through the apiService mapping functions.
          </Alert>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={testFieldMapping}
            disabled={testingFieldMapping}
            startIcon={testingFieldMapping ? <CircularProgress size={20} /> : null}
            sx={{ mb: 3 }}
          >
            {testingFieldMapping ? 'Testing...' : 'Test Field Mapping'}
          </Button>
          
          {sampleData && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sample MongoDB Data
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0, 0, 0, 0.04)', 
                  borderRadius: 1, 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  fontSize: '0.75rem'
                }}
              >
                {JSON.stringify(sampleData, null, 2)}
              </Box>
            </Paper>
          )}
          
          {transformedData && tabValue === 1 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Transformed Data (After apiService Processing)
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0, 0, 0, 0.04)', 
                  borderRadius: 1, 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  fontSize: '0.75rem'
                }}
              >
                {JSON.stringify(transformedData, null, 2)}
              </Box>
            </Paper>
          )}
          
          {/* Field Mapping Reference */}
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Field Mapping Reference
            </Typography>
            <Typography variant="body2" paragraph>
              Below is the current field mapping configuration:
            </Typography>
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                borderRadius: 1, 
                maxHeight: '300px', 
                overflow: 'auto',
                fontSize: '0.75rem'
              }}
            >
{`{
  "submissionId": "tx_id",
  "timestamp": "created_on",
  "status": "status",
  "broker": {
    "name": "bp_parsed_response.Common.Broker Details.broker_name.value",
    "email": "bp_parsed_response.Common.Broker Details.broker_email.value"
  },
  "insured": {
    "name": "bp_parsed_response.Common.Firmographics.company_name.value",
    "industry": {
      "code": "bp_parsed_response.Common.Firmographics.primary_naics_2017[0].code",
      "description": "bp_parsed_response.Common.Firmographics.primary_naics_2017[0].desc"
    },
    "address": {
      "street": "bp_parsed_response.Common.Firmographics.address_1.value",
      "city": "bp_parsed_response.Common.Firmographics.city.value",
      "state": "bp_parsed_response.Common.Firmographics.state.value",
      "zip": "bp_parsed_response.Common.Firmographics.postal_code.value"
    },
    "yearsInBusiness": "bp_parsed_response.Common.Firmographics.years_in_business.value",
    "employeeCount": "bp_parsed_response.Common.Firmographics.total_full_time_employees.value"
  },
  "coverage": {
    "lines": "bp_parsed_response.Common.Limits and Coverages.normalized_coverage",
    "effectiveDate": "bp_parsed_response.Common.Product Details.policy_inception_date.value",
    "expirationDate": "bp_parsed_response.Common.Product Details.end_date.value"
  },
  "documents": ""
}`}
            </Box>
          </Paper>
        </TabPanel>
        
        {/* MongoDB Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>
            MongoDB Connection Info
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            The MongoDB connection is currently handled by your Flask API server. 
            You'll need to make sure your server is running to access the MongoDB data.
          </Alert>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              MongoDB Connection Settings
            </Typography>
            <TextField
              fullWidth
              label="MongoDB URI"
              variant="outlined"
              value={mongoUri}
              onChange={(e) => setMongoUri(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Database Name"
              variant="outlined"
              value={mongoDb}
              onChange={(e) => setMongoDb(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Collection Name"
              variant="outlined"
              value={mongoCollection}
              onChange={(e) => setMongoCollection(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom>
            MongoDB Query in app.py
          </Typography>
          <Box 
            component="pre" 
            sx={{ 
              p: 2, 
              bgcolor: 'rgba(0, 0, 0, 0.04)', 
              borderRadius: 1, 
              maxHeight: '300px', 
              overflow: 'auto',
              fontSize: '0.75rem'
            }}
          >
{`@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    # MongoDB connection setup
    client = MongoClient('${mongoUri}')
    db = client['${mongoDb}']  # Replace with your database name
    submissions_collection = db['${mongoCollection}']  # Replace with your collection name
    submissions = []
 
    # Find documents that have the 'bp_parsed_response' key
    query = {'bp_parsed_response': {'$exists': True}}
    submissions = list(submissions_collection.find(query, {'_id': 0}))  # Exclude MongoDB's default _id field
 
    client.close()  # Close the MongoDB connection
    return jsonify(submissions)`}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ApiDebugPage;