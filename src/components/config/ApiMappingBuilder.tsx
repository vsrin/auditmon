// src/components/config/ApiMappingBuilder.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import FieldMapper from './FieldMapper';
import { RootState } from '../../store';
import { useSelector } from 'react-redux';

// Define our application's required field structure
const APP_FIELDS = {
  submissionId: { label: 'Submission ID', required: true, type: 'string' },
  timestamp: { label: 'Timestamp', required: true, type: 'string' },
  status: { label: 'Status', required: true, type: 'string' },
  broker: {
    label: 'Broker',
    required: true,
    fields: {
      name: { label: 'Broker Name', required: true, type: 'string' },
      email: { label: 'Broker Email', required: false, type: 'string' }
    }
  },
  insured: {
    label: 'Insured',
    required: true,
    fields: {
      name: { label: 'Insured Name', required: true, type: 'string' },
      industry: {
        label: 'Industry',
        required: true,
        fields: {
          code: { label: 'Industry Code', required: true, type: 'string' },
          description: { label: 'Industry Description', required: true, type: 'string' }
        }
      },
      address: {
        label: 'Address',
        required: true,
        fields: {
          street: { label: 'Street', required: true, type: 'string' },
          city: { label: 'City', required: true, type: 'string' },
          state: { label: 'State', required: true, type: 'string' },
          zip: { label: 'Zip', required: true, type: 'string' }
        }
      },
      yearsInBusiness: { label: 'Years in Business', required: false, type: 'number' },
      employeeCount: { label: 'Employee Count', required: false, type: 'number' }
    }
  },
  coverage: {
    label: 'Coverage',
    required: true,
    fields: {
      lines: { label: 'Lines of Business', required: true, type: 'array' },
      effectiveDate: { label: 'Effective Date', required: true, type: 'string' },
      expirationDate: { label: 'Expiration Date', required: true, type: 'string' }
    }
  },
  documents: { label: 'Documents', required: false, type: 'array' },
  complianceChecks: { label: 'Compliance Checks', required: false, type: 'array' }
};

interface ApiMappingBuilderProps {
  initialMapping: any;
  onSave: (mapping: any) => void;
}

const ApiMappingBuilder: React.FC<ApiMappingBuilderProps> = ({ initialMapping, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleResponse, setSampleResponse] = useState<any>(null);
  const [apiFields, setApiFields] = useState<string[]>([]);
  const [currentMapping, setCurrentMapping] = useState<any>(initialMapping || {});
  const [testEndpoint, setTestEndpoint] = useState('');
  
  const { apiEndpoint } = useSelector((state: RootState) => state.config);
  
  // Fetch sample data from API
  const fetchSampleData = async () => {
    const endpoint = testEndpoint || apiEndpoint;
    
    if (!endpoint) {
      setError('Please enter an API endpoint to test');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch a sample submission
      const response = await fetch(`${endpoint}/submissions`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Take the first item if it's an array
      const sampleData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      
      setSampleResponse(sampleData);
      
      // Extract all possible field paths from the API response
      const paths = extractPaths(sampleData);
      setApiFields(paths);
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  // Extract all possible field paths from a nested object
  const extractPaths = (obj: any, parentPath: string = '', result: string[] = []): string[] => {
    if (!obj || typeof obj !== 'object') {
      return result;
    }
    
    for (const key in obj) {
      const path = parentPath ? `${parentPath}.${key}` : key;
      result.push(path);
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        extractPaths(obj[key], path, result);
      }
    }
    
    return result;
  };
  
  // Handle field mapping change
  const handleMappingChange = (appField: string, apiField: string) => {
    setCurrentMapping((prev: any) => ({
      ...prev,
      [appField]: apiField
    }));
  };
  
  // Handle complex field mapping change (for nested objects)
  const handleComplexMappingChange = (appField: string, fieldMapping: any) => {
    setCurrentMapping((prev: any) => ({
      ...prev,
      [appField]: fieldMapping
    }));
  };
  
  // Save the mapping
  const handleSave = () => {
    onSave(currentMapping);
  };
  
  // Get value from sample response using a path
const getValueFromPath = (path: string): any => {
    if (!sampleResponse || !path || typeof path !== 'string') return null;
    
    const parts = path.split('.');
    let value = sampleResponse;
    
    for (const part of parts) {
      if (value === undefined || value === null) return null;
      value = value[part];
    }
    
    return value;
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        API Mapping Builder
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Test API Connection" />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Test API Endpoint"
              placeholder={apiEndpoint || "Enter API endpoint to test"}
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={fetchSampleData}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Fetch Sample Data'}
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {sampleResponse && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Successfully fetched sample data. {apiFields.length} fields discovered.
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {sampleResponse && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Field Mapping
            </Typography>
            <Typography variant="body2" gutterBottom>
              Map fields from your API to the audit application's required fields.
            </Typography>
            
            {/* Render field mappers for all required app fields */}
            <FieldMapper 
              appFields={APP_FIELDS}
              apiFields={apiFields}
              currentMapping={currentMapping}
              onChange={handleMappingChange}
              onComplexChange={handleComplexMappingChange}
              getValueFromPath={getValueFromPath}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Preview Generated Mapping</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(currentMapping, null, 2)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              startIcon={<SaveIcon />}
            >
              Save Mapping
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ApiMappingBuilder;