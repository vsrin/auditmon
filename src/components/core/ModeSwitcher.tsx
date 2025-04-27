// src/components/core/ModeSwitcher.tsx
import React, { useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Switch, 
  FormControlLabel 
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setDemoMode } from '../../store/slices/configSlice';
import apiService from '../../services/api/apiService';

const ModeSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);

  // Sync component with localStorage on mount
  useEffect(() => {
    try {
      const savedDemoMode = localStorage.getItem('isDemoMode');
      if (savedDemoMode !== null && JSON.parse(savedDemoMode) !== isDemoMode) {
        dispatch(setDemoMode(JSON.parse(savedDemoMode)));
      }
    } catch (e) {
      console.error('Error loading demo mode from localStorage', e);
    }
  }, [dispatch, isDemoMode]);

  const handleDemoModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.checked;
    
    // Only allow switching to live mode if we have an API endpoint
    if (!newMode && !apiEndpoint) {
      alert('Please configure an API endpoint in the Configuration Utility before switching to live mode.');
      return;
    }
    
    dispatch(setDemoMode(newMode));
    apiService.setDemoMode(newMode);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h6">
              {isDemoMode ? 'Demo Mode: ON' : 'Live Mode: ON'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isDemoMode 
                ? 'Using synthetic data for demonstration purposes.' 
                : `Using live data from API: ${apiEndpoint}`}
            </Typography>
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={isDemoMode}
                onChange={handleDemoModeChange}
                color="primary"
              />
            }
            label={isDemoMode ? 'Switch to Live' : 'Switch to Demo'}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ModeSwitcher;