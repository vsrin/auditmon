// src/components/config/ConfigurationUtility.tsx
import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Paper,
  Divider,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs
} from '@mui/material';
import { setApiMapping } from '../../store/slices/configSlice';
import { RootState } from '../../store';
import axios from 'axios';
import ViewListIcon from '@mui/icons-material/ViewList';
import CodeIcon from '@mui/icons-material/Code';

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
      id={`sample-tabpanel-${index}`}
      aria-labelledby={`sample-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ConfigurationUtility: React.FC = () => {
  const dispatch = useDispatch();
  const { apiEndpoint, apiMapping } = useSelector((state: RootState) => state.config);
  
  const [mappingJson, setMappingJson] = useState(apiMapping ? JSON.stringify(apiMapping, null, 2) : '');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [mappingError, setMappingError] = useState('');
  const [parsedMapping, setParsedMapping] = useState<Record<string, any>>(apiMapping || {});
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [fetchingSample, setFetchingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [transformedSamples, setTransformedSamples] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'json' | 'table'>('json');
  const [tabValue, setTabValue] = useState(0);
  
  // Update the parsed mapping when mappingJson changes
  useEffect(() => {
    try {
      if (mappingJson) {
        const parsed = JSON.parse(mappingJson);
        setParsedMapping(parsed);
      }
    } catch (e) {
      // Don't update parsedMapping if JSON is invalid
    }
  }, [mappingJson]);
  
  const handleMappingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMappingJson(e.target.value);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSaveMapping = () => {
    if (!mappingJson.trim()) {
      setMappingError('Mapping configuration cannot be empty');
      return;
    }
    
    try {
      const mapping = JSON.parse(mappingJson);
      dispatch(setApiMapping(mapping));
      setParsedMapping(mapping);
      setMappingError('');
      showSnackbar('API mapping saved successfully', 'success');
      
      // If we have sample data, update transformed samples with new mapping
      if (sampleData.length > 0) {
        const transformed = sampleData.map(item => transformData(item, mapping));
        setTransformedSamples(transformed);
      }
    } catch (error) {
      setMappingError('Please enter valid JSON');
    }
  };
  
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  const handleResetMapping = () => {
    setMappingJson('');
    setParsedMapping({});
    dispatch(setApiMapping({}));
    showSnackbar('API mapping reset', 'success');
    
    // Clear any previous sample data
    setSampleData([]);
    setTransformedSamples([]);
  };
  
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'json' | 'table',
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Default mapping without compliance_checks field
  const defaultMapping = {
    "submissionId": "id",
    "timestamp": "created_at",
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
    setParsedMapping(defaultMapping);
    
    // Update transformed samples if we have sample data
    if (sampleData.length > 0) {
      const transformed = sampleData.map(item => transformData(item, defaultMapping));
      setTransformedSamples(transformed);
    }
  };
  
  // Fetch sample data from API
  const fetchSample = async () => {
    if (!apiEndpoint) {
      showSnackbar('Please configure an API endpoint in Settings first', 'error');
      return;
    }
    
    // Validate current mapping
    let currentMapping: Record<string, any>;
    try {
      currentMapping = JSON.parse(mappingJson);
    } catch (error) {
      setMappingError('Please fix the JSON errors before fetching a sample');
      return;
    }
    
    setFetchingSample(true);
    setSampleError(null);
    setSampleData([]);
    setTransformedSamples([]);
    
    try {
      // Ensure endpoint ends with /api
      const baseEndpoint = apiEndpoint.endsWith('/api') 
        ? apiEndpoint 
        : `${apiEndpoint}/api`;
      
      // Fetch submissions data (up to 15 results)
      const url = `${baseEndpoint}/submissions`;
      console.log(`Fetching sample data from: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && Array.isArray(response.data)) {
        // Limit to 15 most recent items
        const recentData = response.data.slice(0, 15);
        setSampleData(recentData);
        
        // Transform all items with current mapping
        const transformed = recentData.map(item => transformData(item, currentMapping));
        setTransformedSamples(transformed);
        
        showSnackbar(`Successfully fetched ${recentData.length} sample items`, 'success');
      } else {
        setSampleError('API response is not an array');
        showSnackbar('Failed to fetch valid sample data', 'error');
      }
    } catch (error) {
      console.error('Error fetching sample data:', error);
      setSampleError(`Failed to fetch sample data: ${error instanceof Error ? error.message : String(error)}`);
      showSnackbar('Error fetching sample data', 'error');
      
      // Use mock data in development mode
      if (process.env.NODE_ENV === 'development') {
        const mockData = generateMockData(15);
        setSampleData(mockData);
        
        // Transform all mock data items
        const transformed = mockData.map(item => transformData(item, currentMapping));
        setTransformedSamples(transformed);
        
        setSampleError('Using mock data for demonstration. Connect to a real API for production use.');
        showSnackbar('Using mock data for demonstration', 'info');
      }
    } finally {
      setFetchingSample(false);
    }
  };
  
  // Transform data using the mapping
  const transformData = (data: any, mapping: Record<string, any>): any => {
    if (!data || !mapping) return {};
    
    const result: Record<string, any> = {};
    
    const applyMapping = (targetObj: any, mappingObj: any) => {
      Object.entries(mappingObj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          targetObj[key] = {};
          applyMapping(targetObj[key], value);
        } else if (typeof value === 'string' && value) {
          try {
            // Get nested value using dot notation
            const path = value.split('.');
            let current = data;
            for (const segment of path) {
              if (current === undefined || current === null) {
                current = undefined;
                break;
              }
              current = current[segment];
            }
            targetObj[key] = current;
          } catch (error) {
            targetObj[key] = undefined;
          }
        }
      });
    };
    
    applyMapping(result, mapping);
    return result;
  };
  
  // Generate mock data for development
  const generateMockData = (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `SUB-${100000 + index}`,
      created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      status: ['In Review', 'Pending', 'Approved', 'Declined'][index % 4],
      broker: {
        company_name: `Broker Company ${index + 1}`,
        email_address: `broker${index + 1}@example.com`
      },
      insured: {
        legal_name: `Insured Corp ${index + 1}`,
        sic_code: `${1000 + index}`,
        industry_description: ['Manufacturing', 'Technology', 'Healthcare', 'Retail'][index % 4],
        address: {
          line1: `${100 + index} Main Street`,
          city: ['New York', 'Chicago', 'San Francisco', 'Boston'][index % 4],
          state: ['NY', 'IL', 'CA', 'MA'][index % 4],
          postal_code: `${10000 + index}`
        },
        years_in_business: 5 + (index % 20),
        employee_count: 50 + (index * 10)
      },
      submission: {
        coverage_lines: [
          ['General Liability'],
          ['Property', 'General Liability'],
          ['Property', 'General Liability', 'Workers Comp']
        ][index % 3],
        effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiration_date: new Date(Date.now() + 395 * 24 * 60 * 60 * 1000).toISOString()
      },
      documents: [
        { id: `DOC-${index}-1`, name: 'Application', type: 'Application Form', status: 'Complete' },
        { id: `DOC-${index}-2`, name: 'Loss Runs', type: 'Loss History', status: 'Pending' }
      ]
    }));
  };
  
  // Render JSON view of sample data
  const renderJsonView = () => {
    return (
      <>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="sample data tabs">
          <Tab label="API Response" />
          <Tab label="Transformed Data" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Raw API Response Data:
            </Typography>
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                borderRadius: 1, 
                maxHeight: '400px', 
                overflow: 'auto',
                fontSize: '0.75rem'
              }}
            >
              {JSON.stringify(sampleData, null, 2)}
            </Box>
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Transformed Data (All {transformedSamples.length} Records):
            </Typography>
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                borderRadius: 1, 
                maxHeight: '400px', 
                overflow: 'auto',
                fontSize: '0.75rem'
              }}
            >
              {JSON.stringify(transformedSamples, null, 2)}
            </Box>
          </Paper>
        </TabPanel>
      </>
    );
  };
  
  // Render table view of sample data
  const renderTableView = () => {
    // Get all the top-level keys from the mapping
    const topLevelKeys = Object.keys(parsedMapping);
    
    // Get nested keys for broker and insured (if they exist)
    let allColumns: string[] = [...topLevelKeys];
    
    // Add broker fields
    if (parsedMapping.broker && typeof parsedMapping.broker === 'object') {
      Object.keys(parsedMapping.broker).forEach(key => {
        allColumns.push(`broker.${key}`);
      });
    }
    
    // Add insured fields
    if (parsedMapping.insured && typeof parsedMapping.insured === 'object') {
      Object.keys(parsedMapping.insured).forEach(key => {
        if (key === 'industry' && typeof parsedMapping.insured.industry === 'object') {
          Object.keys(parsedMapping.insured.industry).forEach(industryKey => {
            allColumns.push(`insured.industry.${industryKey}`);
          });
        } else if (key === 'address' && typeof parsedMapping.insured.address === 'object') {
          Object.keys(parsedMapping.insured.address).forEach(addressKey => {
            allColumns.push(`insured.address.${addressKey}`);
          });
        } else {
          allColumns.push(`insured.${key}`);
        }
      });
    }
    
    // Add coverage fields
    if (parsedMapping.coverage && typeof parsedMapping.coverage === 'object') {
      Object.keys(parsedMapping.coverage).forEach(key => {
        allColumns.push(`coverage.${key}`);
      });
    }
    
    // Filter out columns that are objects/arrays themselves (like documents)
    const filteredColumns = allColumns.filter(column => {
      if (transformedSamples.length === 0) return true;
      
      // Get the value for this column in the first transformed sample
      const value = getNestedValue(transformedSamples[0], column);
      
      // Include only primitive values or null/undefined
      return (
        value === null || 
        value === undefined || 
        typeof value !== 'object'
      );
    });
    
    return (
      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              {filteredColumns.map((column) => (
                <TableCell key={column}>{formatColumnHeader(column)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {transformedSamples.map((row, index) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {index + 1}
                </TableCell>
                {filteredColumns.map((column) => (
                  <TableCell key={column}>
                    {formatCellValue(getNestedValue(row, column))}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Helper function to get nested values from an object
  const getNestedValue = (obj: any, path: string): any => {
    if (!obj) return undefined;
    
    const parts = path.split('.');
    let result = obj;
    
    for (const part of parts) {
      if (result === null || result === undefined) return undefined;
      result = result[part];
    }
    
    return result;
  };
  
  // Format column header to be more readable
  const formatColumnHeader = (column: string): string => {
    return column
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/([A-Z])/g, ' $1'))
      .join(' - ');
  };
  
  // Format cell value for table display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };
  
  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Configuration Utility
        </Typography>
      </Box>
      
      <Typography variant="body1" paragraph>
        Use this utility to configure the mapping between your API data and the monitoring dashboard.
      </Typography>
      
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
          
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveMapping}
            >
              Save Mapping
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={fetchSample}
              disabled={fetchingSample}
              startIcon={fetchingSample ? <CircularProgress size={20} /> : null}
            >
              {fetchingSample ? 'Fetching...' : 'Fetch Sample Data'}
            </Button>
          </Stack>
          
          {sampleError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {sampleError}
            </Alert>
          )}
          
          {/* Display sample data */}
          {sampleData.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Sample Data Results ({sampleData.length} items)
                </Typography>
                
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  aria-label="view mode"
                  size="small"
                >
                  <ToggleButton value="json" aria-label="json view">
                    <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    JSON
                  </ToggleButton>
                  <ToggleButton value="table" aria-label="table view">
                    <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Table
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              {viewMode === 'json' ? renderJsonView() : renderTableView()}
            </Box>
          )}
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