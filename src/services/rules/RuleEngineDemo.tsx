// src/components/rules/RuleEngineDemo.tsx
import React, { useState, useEffect } from 'react';
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
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api/apiService';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';
import { fetchSubmissionsSuccess } from '../../store/slices/submissionSlice';

// Demo rules for NAICS code restrictions
const initialRestrictedCodes = [
  { code: '6531', description: 'Real Estate' },
  { code: '7371', description: 'Technology Services' },
  { code: '3579', description: 'Office Equipment' }
];

const RuleEngineDemo: React.FC = () => {
  const dispatch = useDispatch();
  const { submissions } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  
  // Initialize with codes from the rule engine provider
  const providerCodes = ruleEngineProvider.getRestrictedNaicsCodes?.() || 
                       initialRestrictedCodes.map(c => c.code);
  
  const initialCodes = providerCodes.map(code => {
    const found = initialRestrictedCodes.find(c => c.code === code);
    return found || { 
      code, 
      description: `Industry with code ${code}` 
    };
  });
  
  const [restrictedCodes, setRestrictedCodes] = useState(initialCodes);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isRuleActive, setIsRuleActive] = useState(
    ruleEngineProvider.isNaicsRuleEnabled?.() !== false
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [affectedSubmissions, setAffectedSubmissions] = useState<any[]>([]);

  // Function to add a new restricted NAICS code
  const handleAddCode = () => {
    if (!newCode.trim()) {
      setMessage({ type: 'error', text: 'NAICS code is required' });
      return;
    }
    
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
    setMessage({ type: 'success', text: `Added NAICS code ${newCode.trim()} to restricted list` });
    
    // Apply the rule changes
    applyRuleChanges(newRestrictedCodes);
  };

  // Function to remove a restricted NAICS code
  const handleRemoveCode = (codeToRemove: string) => {
    const newRestrictedCodes = restrictedCodes.filter(item => item.code !== codeToRemove);
    setRestrictedCodes(newRestrictedCodes);
    setMessage({ type: 'info', text: `Removed NAICS code ${codeToRemove} from restricted list` });
    
    // Apply the rule changes
    applyRuleChanges(newRestrictedCodes);
  };

  // Function to toggle the rule active state
  const handleToggleRule = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsRuleActive(event.target.checked);
    
    // Update the rule engine provider
    if (ruleEngineProvider.setNaicsRuleEnabled) {
      ruleEngineProvider.setNaicsRuleEnabled(event.target.checked);
    }
    
    if (event.target.checked) {
      setMessage({ type: 'info', text: 'NAICS code restriction rule activated' });
      applyRuleChanges(restrictedCodes);
    } else {
      setMessage({ type: 'info', text: 'NAICS code restriction rule deactivated' });
      
      // Reset submissions to compliant status if rule is deactivated
      if (isDemoMode) {
        const updatedSubmissions = submissions.map(sub => ({
          ...sub,
          status: restrictedCodes.some(code => 
            code.code === (sub.insured?.industry?.code || '')
          ) ? 'Compliant' : sub.status
        }));
        
        dispatch(fetchSubmissionsSuccess(updatedSubmissions));
        findAffectedSubmissions(updatedSubmissions, []);
      }
    }
  };

  // Function to reset to initial rules
  const handleReset = () => {
    setRestrictedCodes(initialRestrictedCodes);
    setIsRuleActive(true);
    setMessage({ type: 'info', text: 'Reset to initial restricted NAICS codes' });
    
    // Update the rule engine provider
    if (ruleEngineProvider.setNaicsRuleEnabled) {
      ruleEngineProvider.setNaicsRuleEnabled(true);
    }
    
    // Apply the initial rules
    applyRuleChanges(initialRestrictedCodes);
  };

  // Apply rule changes to submissions
  const applyRuleChanges = (currentRestrictedCodes: typeof restrictedCodes) => {
    setLoading(true);
    
    try {
      // Update the rule engine provider
      const restrictedCodeValues = currentRestrictedCodes.map(code => code.code);
      if (ruleEngineProvider.updateRestrictedNaicsCodes) {
        ruleEngineProvider.updateRestrictedNaicsCodes(restrictedCodeValues);
      }
      
      if (isDemoMode && isRuleActive) {
        // In demo mode, we'll apply the rules directly to the submission data
        const updatedSubmissions = submissions.map(sub => {
          const industryCode = sub.insured?.industry?.code || '';
          const isRestricted = currentRestrictedCodes.some(code => code.code === industryCode);
          
          return {
            ...sub,
            status: isRestricted ? 'Non-Compliant' : sub.status
          };
        });
        
        dispatch(fetchSubmissionsSuccess(updatedSubmissions));
        findAffectedSubmissions(updatedSubmissions, currentRestrictedCodes);
      } else {
        // In live mode, the rule engine will handle evaluation
        findAffectedSubmissions(submissions, isRuleActive ? currentRestrictedCodes : []);
      }
    } catch (error) {
      console.error('Error applying rule changes:', error);
      setMessage({ type: 'error', text: 'Failed to apply rule changes' });
    } finally {
      setLoading(false);
    }
  };

  // Find and display affected submissions after rule changes
  const findAffectedSubmissions = (subs: any[], codes: typeof restrictedCodes) => {
    if (!isRuleActive || codes.length === 0) {
      setAffectedSubmissions([]);
      return;
    }
    
    const affected = subs.filter(sub => {
      const industryCode = sub.insured?.industry?.code || '';
      return codes.some(code => code.code === industryCode);
    });
    
    setAffectedSubmissions(affected);
  };

  // Initial setup
  useEffect(() => {
    findAffectedSubmissions(submissions, isRuleActive ? restrictedCodes : []);
  }, [submissions]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Rule Engine Demonstration - NAICS Code Restrictions
      </Typography>
      
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
                  />
                }
                label={isRuleActive ? "Rule Active" : "Rule Inactive"}
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ mb: 3 }}>
              {restrictedCodes.map((item) => (
                <ListItem
                  key={item.code}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleRemoveCode(item.code)}
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
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="NAICS Code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                size="small"
                sx={{ width: '150px' }}
              />
              <TextField
                label="Description (Optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddCode}
                disabled={loading}
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
              This demo shows how the rule engine can dynamically apply compliance rules.
              Adding or removing NAICS codes will immediately affect the compliance status
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
            
            {isRuleActive ? (
              <>
                {affectedSubmissions.length > 0 ? (
                  <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {affectedSubmissions.map((sub) => (
                      <Card key={sub.submissionId} sx={{ mb: 2 }}>
                        <CardContent sx={{ pb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1">{sub.insured.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                ID: {sub.submissionId}
                              </Typography>
                              <Typography variant="body2">
                                Industry: {sub.insured.industry.description} 
                                <Chip 
                                  label={sub.insured.industry.code} 
                                  size="small" 
                                  color="primary" 
                                  sx={{ ml: 1 }} 
                                />
                              </Typography>
                            </Box>
                            <Chip 
                              label={sub.status} 
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