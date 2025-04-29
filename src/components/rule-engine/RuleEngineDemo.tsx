// src/components/rule-engine/RuleEngineDemo.tsx
// This component is moved from services/rules/RuleEngineDemo.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CloudSync as CloudSyncIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api/apiService';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';
import { fetchSubmissionsSuccess, fetchSubmissionsStart } from '../../store/slices/submissionSlice';
import { useLocation } from 'react-router-dom';
import { Submission, Industry } from '../../types'; // Import the Submission and Industry types

// Demo rules for NAICS code restrictions
const initialRestrictedCodes = [
  { code: '6531', description: 'Real Estate' },
  { code: '7371', description: 'Technology Services' },
  { code: '3579', description: 'Office Equipment' }
];

const RuleEngineDemo: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { submissions, loading: submissionsLoading } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  
  const [restrictedCodes, setRestrictedCodes] = useState<Array<{code: string, description: string}>>([]);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isRuleActive, setIsRuleActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncingWithBackend, setSyncingWithBackend] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [affectedSubmissions, setAffectedSubmissions] = useState<Submission[]>([]);

  // Find and display affected submissions after rule changes - moved to useCallback
  const findAffectedSubmissions = useCallback((subs: Submission[], codes: typeof restrictedCodes) => {
    if (!isRuleActive || codes.length === 0) {
      setAffectedSubmissions([]);
      return;
    }
    
    const affected = subs.filter(sub => {
      // Fixed: Use optional chaining and default value
      const industryCode = sub.insured?.industry?.code || '';
      return codes.some(code => code.code === industryCode);
    });
    
    setAffectedSubmissions(affected);
  }, [isRuleActive]);

  // Log current mode on mount
  useEffect(() => {
    console.log("RuleEngineDemo mounted - Current mode:", isDemoMode ? "DEMO" : "LIVE");
    console.log("Current location:", location.pathname);
    
    const previousMode = localStorage.getItem('previousMode');
    if (previousMode) {
      console.log("Found previous mode in localStorage:", previousMode);
      // Clear the stored mode after using it
      localStorage.removeItem('previousMode');
    }
    
    // Ensure rule engine provider is synced with current mode
    if (ruleEngineProvider.setDemoMode) {
      console.log("RuleEngineDemo - syncing rule engine demo mode:", isDemoMode);
      ruleEngineProvider.setDemoMode(isDemoMode);
    }
  }, [isDemoMode, location]);

  // Initial fetch of restricted codes from backend
  useEffect(() => {
    const fetchRestrictedCodes = async () => {
      setSyncingWithBackend(true);
      try {
        // Fetch restricted codes from the provider (which will fetch from backend)
        await ruleEngineProvider.fetchRestrictedCodesFromBackend();
        const codes = ruleEngineProvider.getRestrictedNaicsCodes();
        const enabled = ruleEngineProvider.isNaicsRuleEnabled();
        
        // Convert to the format used by the UI
        const formattedCodes = codes.map(code => {
          const found = initialRestrictedCodes.find(c => c.code === code);
          return found || { code, description: `Industry with code ${code}` };
        });
        
        setRestrictedCodes(formattedCodes);
        setIsRuleActive(enabled);
        setMessage({ type: 'success', text: 'Synchronized with backend rules' });
      } catch (error) {
        console.error('Error fetching restricted codes:', error);
        setMessage({ type: 'error', text: 'Failed to synchronize with backend' });
        
        // Fall back to default values
        setRestrictedCodes(initialRestrictedCodes);
      } finally {
        setSyncingWithBackend(false);
      }
    };
    
    fetchRestrictedCodes();
  }, []);

  // Function to add a new restricted NAICS code
  const handleAddCode = async () => {
    if (!newCode.trim()) {
      setMessage({ type: 'error', text: 'NAICS code is required' });
      return;
    }
    
    setLoading(true);
    
    try {
      const newRestrictedCodes = [
        ...restrictedCodes,
        { 
          code: newCode.trim(), 
          description: newDescription.trim() || `Industry with code ${newCode.trim()}` 
        }
      ];
      
      setRestrictedCodes(newRestrictedCodes);
      setNewCode('');
      setNewDescription('');
      
      // Update the backend
      await ruleEngineProvider.updateRestrictedNaicsCodes(newRestrictedCodes.map(c => c.code));
      
      setMessage({ type: 'success', text: `Added NAICS code ${newCode.trim()} to restricted list` });
      
      // Apply the rule changes
      await applyRuleChanges(newRestrictedCodes);
    } catch (error) {
      console.error('Error adding code:', error);
      setMessage({ type: 'error', text: `Failed to add NAICS code: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  // Function to remove a restricted NAICS code
  const handleRemoveCode = async (codeToRemove: string) => {
    setLoading(true);
    
    try {
      const newRestrictedCodes = restrictedCodes.filter(item => item.code !== codeToRemove);
      setRestrictedCodes(newRestrictedCodes);
      
      // Update the backend
      await ruleEngineProvider.updateRestrictedNaicsCodes(newRestrictedCodes.map(c => c.code));
      
      setMessage({ type: 'info', text: `Removed NAICS code ${codeToRemove} from restricted list` });
      
      // Apply the rule changes
      await applyRuleChanges(newRestrictedCodes);
    } catch (error) {
      console.error('Error removing code:', error);
      setMessage({ type: 'error', text: `Failed to remove NAICS code: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle the rule active state
  const handleToggleRule = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newActiveState = event.target.checked;
    setLoading(true);
    
    try {
      setIsRuleActive(newActiveState);
      
      // Update the backend
      await ruleEngineProvider.setNaicsRuleEnabled(newActiveState);
      
      if (newActiveState) {
        setMessage({ type: 'info', text: 'NAICS code restriction rule activated' });
        await applyRuleChanges(restrictedCodes);
      } else {
        setMessage({ type: 'info', text: 'NAICS code restriction rule deactivated' });
        await resetSubmissionsCompliance();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      setMessage({ type: 'error', text: `Failed to toggle rule: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  // Function to reset to initial rules
  const handleReset = async () => {
    setLoading(true);
    
    try {
      setRestrictedCodes(initialRestrictedCodes);
      setIsRuleActive(true);
      
      // Update the backend
      await ruleEngineProvider.setNaicsRuleEnabled(true);
      await ruleEngineProvider.updateRestrictedNaicsCodes(initialRestrictedCodes.map(c => c.code));
      
      setMessage({ type: 'info', text: 'Reset to initial restricted NAICS codes' });
      
      // Apply the initial rules
      await applyRuleChanges(initialRestrictedCodes);
    } catch (error) {
      console.error('Error resetting rules:', error);
      setMessage({ type: 'error', text: `Failed to reset rules: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  // Function to manually sync with backend
  const handleSyncWithBackend = async () => {
    setSyncingWithBackend(true);
    
    try {
      // Fetch restricted codes from the provider (which will fetch from backend)
      await ruleEngineProvider.fetchRestrictedCodesFromBackend();
      const codes = ruleEngineProvider.getRestrictedNaicsCodes();
      const enabled = ruleEngineProvider.isNaicsRuleEnabled();
      
      // Convert to the format used by the UI
      const formattedCodes = codes.map(code => {
        const found = initialRestrictedCodes.find(c => c.code === code);
        return found || { code, description: `Industry with code ${code}` };
      });
      
      setRestrictedCodes(formattedCodes);
      setIsRuleActive(enabled);
      
      // Apply the rule changes
      await applyRuleChanges(formattedCodes);
      
      setMessage({ type: 'success', text: 'Synchronized with backend rules' });
    } catch (error) {
      console.error('Error syncing with backend:', error);
      setMessage({ type: 'error', text: `Failed to synchronize with backend: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setSyncingWithBackend(false);
    }
  };

  // Reset submission compliance statuses when rule is disabled
  const resetSubmissionsCompliance = async () => {
    if (!isDemoMode) {
      // For live mode, fetch from API
      try {
        dispatch(fetchSubmissionsStart());
        const data = await apiService.getSubmissions();
        dispatch(fetchSubmissionsSuccess(data));
        findAffectedSubmissions(data, []);
      } catch (error) {
        console.error('Error refreshing submissions:', error);
      }
    } else {
      // For demo mode, we can manually update statuses
      const updatedSubmissions = submissions.map(sub => {
        // Use the properly imported type to ensure code property is available
        const industryCode = (sub.insured?.industry as Industry)?.code || '';
        const wasRestricted = restrictedCodes.some(code => code.code === industryCode);
        
        // Only reset the status if it was previously marked as non-compliant due to NAICS
        return wasRestricted 
          ? { ...sub, status: 'Compliant' } 
          : sub;
      });
      
      dispatch(fetchSubmissionsSuccess(updatedSubmissions));
      findAffectedSubmissions(updatedSubmissions, []);
    }
  };

  // Apply rule changes to submissions
  const applyRuleChanges = async (currentRestrictedCodes: typeof restrictedCodes) => {
    try {
      // Refresh submissions to see the effects of the rule changes
      if (!isDemoMode) {
        // For live mode, fetch from API
        dispatch(fetchSubmissionsStart());
        const data = await apiService.getSubmissions();
        dispatch(fetchSubmissionsSuccess(data));
        findAffectedSubmissions(data, isRuleActive ? currentRestrictedCodes : []);
      } else {
        // For demo mode, manually refresh submissions
        dispatch(fetchSubmissionsStart());
        const data = await apiService.getSubmissions();
        dispatch(fetchSubmissionsSuccess(data));
        findAffectedSubmissions(data, isRuleActive ? currentRestrictedCodes : []);
      }
    } catch (error) {
      console.error('Error refreshing submissions:', error);
      setMessage({ type: 'error', text: 'Failed to refresh submissions' });
      
      // Still update the affected submissions display based on current data
      findAffectedSubmissions(submissions, isRuleActive ? currentRestrictedCodes : []);
    }
  };

  // Update affected submissions when submissions data changes
  useEffect(() => {
    findAffectedSubmissions(submissions, isRuleActive ? restrictedCodes : []);
  }, [submissions, isRuleActive, restrictedCodes, findAffectedSubmissions]); // Added findAffectedSubmissions to deps

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">
          Rule Engine Demonstration - NAICS Code Restrictions
          {isDemoMode && <Chip label="Demo Mode" size="small" color="default" sx={{ ml: 2 }} />}
          {!isDemoMode && <Chip label="Live Mode" size="small" color="primary" sx={{ ml: 2 }} />}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CloudSyncIcon />}
          onClick={handleSyncWithBackend}
          disabled={syncingWithBackend}
        >
          {syncingWithBackend ? <CircularProgress size={24} /> : 'Sync with Backend'}
        </Button>
      </Box>
      
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Restricted NAICS Codes</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRuleActive}
                    onChange={handleToggleRule}
                    color="primary"
                    disabled={loading}
                  />
                }
                label={isRuleActive ? "Rule Active" : "Rule Inactive"}
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ mb: 3 }}>
                {restrictedCodes.map((item) => (
                  <ListItem
                    key={item.code}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleRemoveCode(item.code)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip label={item.code} color="primary" size="small" sx={{ mr: 1 }} />
                          <Typography variant="body1">{item.description}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                
                {restrictedCodes.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No restricted NAICS codes"
                      secondary="Add codes to restrict certain industries"
                    />
                  </ListItem>
                )}
              </List>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="NAICS Code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                size="small"
                sx={{ width: '150px' }}
                disabled={loading}
              />
              <TextField
                label="Description (Optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
                disabled={loading}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddCode}
                disabled={loading || !newCode.trim()}
              >
                Add Restricted Code
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                disabled={loading}
              >
                Reset to Defaults
              </Button>
            </Box>
          </Paper>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This demo shows how the rule engine can dynamically apply compliance rules from the backend.
              Adding or removing NAICS codes in the backend will immediately affect the compliance status
              of submissions in those industries.
            </Typography>
          </Alert>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Affected Submissions
              {affectedSubmissions.length > 0 && 
                <Chip 
                  label={affectedSubmissions.length} 
                  color="error" 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              }
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {submissionsLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : isRuleActive ? (
              <>
                {affectedSubmissions.length > 0 ? (
                  <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {affectedSubmissions.map((sub) => (
                      <Card key={sub.submissionId} sx={{ mb: 2 }}>
                        <CardContent sx={{ pb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1">{sub.insured?.name || 'Unknown'}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                ID: {sub.submissionId}
                              </Typography>
                              <Typography variant="body2">
                                Industry: {sub.insured?.industry?.description || 'Unknown'} 
                                <Chip 
                                  label={sub.insured?.industry?.code || 'Unknown'} 
                                  size="small" 
                                  color="primary" 
                                  sx={{ ml: 1 }} 
                                />
                              </Typography>
                            </Box>
                            <Chip 
                              label={sub.status || 'Unknown'} 
                              color={sub.status === 'Non-Compliant' ? 'error' : 'default'} 
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1">
                      No submissions are affected by current NAICS code restrictions
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">
                  Rule is currently inactive. Activate the rule to see affected submissions.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RuleEngineDemo;