// src/components/settings/Settings.tsx
import React, { useState } from 'react';
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
  Snackbar
} from '@mui/material';
import ModeSwitcher from '../core/ModeSwitcher';

const Settings: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('60');
  const [darkMode, setDarkMode] = useState(false);
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const handleSaveSettings = () => {
    // In a real app, this would save to local storage or backend
    setOpenSnackbar(true);
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
      </Box>
      
      <ModeSwitcher />
      
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
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
          
          <Box sx={{ width: '100%', p: 1.5 }}>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button variant="contained" color="primary" onClick={handleSaveSettings}>
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
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Settings;