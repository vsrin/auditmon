// src/components/core/ModeSwitcher.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  FormControlLabel, 
  Switch, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  Alert, 
  Grid, 
  Snackbar 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../../store';
import { setDemoMode, setApiEndpoint } from '../../store/slices/configSlice';
import apiService from '../../services/api/apiService';
import { clearSelectedSubmission } from '../../store/slices/submissionSlice';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';

interface ModeSwitcherProps {
  compact?: boolean;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ compact = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);
  const [savedApiEndpoint, setSavedApiEndpoint] = useState(apiEndpoint);
  const [apiEndpointField, setApiEndpointField] = useState(apiEndpoint);
  const [showAlert, setShowAlert] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Synchronize the form field with redux state when it changes externally
  useEffect(() => {
    setApiEndpointField(apiEndpoint);
    setSavedApiEndpoint(apiEndpoint);
  }, [apiEndpoint]);

  // Log current mode on component mount
  useEffect(() => {
    console.log("ModeSwitcher initialized - Current mode:", isDemoMode ? "DEMO" : "LIVE");
  }, [isDemoMode]); // Fixed: Added missing dependency

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDemoMode = event.target.checked;
    setChangingMode(true);
    console.log(`Switching to ${newDemoMode ? 'DEMO' : 'LIVE'} mode`);
    
    try {
      // Update Redux store
      dispatch(setDemoMode(newDemoMode));
      
      // Update API service with new mode
      apiService.setDemoMode(newDemoMode);
      
      // FIXED: Sync with rule engine provider
      if (ruleEngineProvider.setDemoMode) {
        ruleEngineProvider.setDemoMode(newDemoMode);
      }
      
      // Clear selected submission to force reload on detail pages
      dispatch(clearSelectedSubmission());
      
      // Show alert for a moment to indicate the mode change
      setAlertMessage(`Switched to ${newDemoMode ? 'Demo' : 'Live'} mode successfully`);
      setShowAlert(true);
      
      // If we're on a detail page, navigate back to the same page to force a reload
      if (location.pathname.includes('/submissions/') && location.pathname.split('/').length > 2) {
        const currentPath = location.pathname;
        navigate('/submissions'); // Navigate away
        setTimeout(() => {
          navigate(currentPath); // Navigate back to force reload
        }, 100);
      }
    } catch (error) {
      console.error('Error changing mode:', error);
      setAlertMessage(`Error changing mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowAlert(true);
    } finally {
      // Clear the changing mode flag
      setTimeout(() => {
        setChangingMode(false);
      }, 500);
    }
  };

  const handleApiEndpointChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiEndpointField(event.target.value);
  };

  const handleApiEndpointSave = () => {
    setSavedApiEndpoint(apiEndpointField);
    dispatch(setApiEndpoint(apiEndpointField));
    apiService.setApiEndpoint(apiEndpointField);
    setAlertMessage('API endpoint updated successfully');
    setShowAlert(true);
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  if (compact) {
    return (
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={isDemoMode}
              onChange={handleModeChange}
              color="primary"
              size="small"
              disabled={changingMode}
            />
          }
          label={isDemoMode ? "Demo" : "Live"}
          sx={{ mr: 1, '& .MuiTypography-root': { fontSize: '0.75rem' } }}
        />
        <Snackbar
          open={showAlert}
          autoHideDuration={3000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isDemoMode}
              onChange={handleModeChange}
              disabled={changingMode}
            />
          }
          label={isDemoMode ? 'Demo Mode' : 'Live Mode'}
        />
        {changingMode && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Switching mode...
          </Typography>
        )}
      </Box>

      {!isDemoMode && (
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs>
            <FormControl fullWidth>
              <TextField
                label="API Endpoint URL"
                variant="outlined"
                size="small"
                value={apiEndpointField}
                onChange={handleApiEndpointChange}
                placeholder="http://localhost:8000/api"
              />
            </FormControl>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleApiEndpointSave}
              disabled={apiEndpointField === savedApiEndpoint}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {alertMessage || (isDemoMode
            ? 'Switched to Demo Mode - Using synthetic data'
            : 'Switched to Live Mode - Connected to API')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModeSwitcher;