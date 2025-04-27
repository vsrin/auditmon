// src/components/core/ModeSwitcher.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { RootState } from '../../store';
import { setDemoMode } from '../../store/slices/configSlice';
import apiService from '../../services/api/apiService';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearSelectedSubmission } from '../../store/slices/submissionSlice';

const ModeSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.checked;
    
    // Set the demo mode in the config
    dispatch(setDemoMode(newMode));
    
    // Update API service with new mode
    apiService.setDemoMode(newMode);
    
    // Clear selected submission to force reload on detail pages
    dispatch(clearSelectedSubmission());
    
    // If we're on a detail page, navigate back to the same page to force a reload
    if (location.pathname.includes('/submissions/') && location.pathname.split('/').length > 2) {
      const currentPath = location.pathname;
      navigate('/submissions'); // Navigate away
      setTimeout(() => {
        navigate(currentPath); // Navigate back to force reload
      }, 100);
    }
    
    console.log(`Mode changed to ${newMode ? 'Demo' : 'Live'}`);
  };

  return (
    <Box mb={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
      <FormControlLabel
        control={
          <Switch
            checked={isDemoMode}
            onChange={handleModeChange}
            color="primary"
          />
        }
        label={
          <Box>
            <Typography variant="subtitle1" component="span">
              {isDemoMode ? 'Demo Mode' : 'Live Mode'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isDemoMode 
                ? 'Using mock data for demonstration' 
                : `Connected to API at ${apiEndpoint}`}
            </Typography>
          </Box>
        }
      />
    </Box>
  );
};

export default ModeSwitcher;