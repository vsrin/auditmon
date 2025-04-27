// src/components/core/ModeSwitcher.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormControlLabel, Switch, Paper, Typography, Box } from '@mui/material';
import { RootState } from '../../store';
import { setDemoMode } from '../../store/slices/configSlice';

const ModeSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const isDemoMode = useSelector((state: RootState) => state.config.isDemoMode);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDemoMode(event.target.checked));
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        mb: 3, 
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: theme => theme.palette.divider
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="body1">
          {isDemoMode 
            ? 'Demo Mode: Using synthetic data' 
            : 'Live Mode: Connected to API'}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isDemoMode}
              onChange={handleChange}
              color="primary"
            />
          }
          label="Demo Mode"
        />
      </Box>
    </Paper>
  );
};

export default ModeSwitcher;