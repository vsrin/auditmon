// src/components/config/ConfigurationUtility.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Paper,
  Typography,
  TextField,
  Button,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  Grid,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Switch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { setApiEndpoint, setApiMapping } from '../../store/slices/configSlice';
import { RootState } from '../../store';
import ModeSwitcher from '../core/ModeSwitcher';

// Rest of the component remains the same...

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
    // Fix: Use empty object instead of null
    dispatch(setApiMapping({}));
    showSnackbar('API mapping reset', 'success');
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
      
      <Grid container spacing={3}>
        {/* Fix Grid item issue - use Box components instead */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Card>
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
        </Box>
        
        <Box sx={{ width: '100%', mb: 2 }}>
          <Card>
            <CardHeader 
              title="API Mapping Configuration" 
              action={
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={handleResetMapping}
                  size="small"
                >
                  Reset
                </Button>
              }
            />
            <CardContent>
              <Typography variant="body2" paragraph>
                Define how your API response fields map to the dashboard's data model. Use JSON format.
              </Typography>
              
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
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ width: '100%', mb: 2 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Sample Mapping Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ fontFamily: '"Roboto Mono", monospace', whiteSpace: 'pre-wrap' }}>
{`{
  "submissionId": "submission.id",
  "timestamp": "submission.created_at",
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
    }
  },
  "coverage": {
    "lines": "submission.coverage_lines",
    "effectiveDate": "submission.effective_date",
    "expirationDate": "submission.expiration_date"
  }
}`}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Grid>
      
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