// src/components/alerts/Alerts.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';
import { fetchSubmissionsSuccess, fetchSubmissionsStart } from '../../store/slices/submissionSlice';
import apiService from '../../services/api/apiService';

// Define interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alert-tabpanel-${index}`}
      aria-labelledby={`alert-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

// Demo rules for NAICS code restrictions
const initialRestrictedCodes = [
  { code: '6531', description: 'Real Estate' },
  { code: '7371', description: 'Technology Services' },
  { code: '3579', description: 'Office Equipment' }
];

const Alerts: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  const { submissions } = useSelector((state: RootState) => state.submissions);
  
  const [tabValue, setTabValue] = useState(0);
  const [restrictedCodes, setRestrictedCodes] = useState<Array<{code: string, description: string}>>([]);
  const [isRuleActive, setIsRuleActive] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [affectedSubmissions, setAffectedSubmissions] = useState<any[]>([]);

  // Ensure rule engine provider is synced with current mode
  useEffect(() => {
    if (ruleEngineProvider.setDemoMode) {
      console.log("Alerts - syncing rule engine demo mode:", isDemoMode);
      ruleEngineProvider.setDemoMode(isDemoMode);
    }
    
    // Initialize restricted codes
    const codes = ruleEngineProvider.getRestrictedNaicsCodes();
    const formattedCodes = codes.map(code => {
      const found = initialRestrictedCodes.find(c => c.code === code);
      return found || { code, description: `Industry with code ${code}` };
    });
    
    setRestrictedCodes(formattedCodes);
    setIsRuleActive(ruleEngineProvider.isNaicsRuleEnabled());
    
    // Find affected submissions
    findAffectedSubmissions(submissions, formattedCodes);
  }, [isDemoMode, submissions]);

  // Parse tab from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    if (tab === 'rule-engine') {
      setTabValue(1); // Set to rule engine tab
    } else {
      setTabValue(0); // Default to alerts tab
    }
  }, [location.search]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Function to add a new restricted NAICS code
  const handleAddCode = async () => {
    if (!newCode.trim()) return;
    
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
    
    // Update the rule engine provider
    ruleEngineProvider.updateRestrictedNaicsCodes(newRestrictedCodes.map(c => c.code));
    
    // Apply rule changes
    await applyRuleChanges(newRestrictedCodes);
  };

  // Function to remove a restricted NAICS code
  const handleRemoveCode = async (codeToRemove: string) => {
    const newRestrictedCodes = restrictedCodes.filter(item => item.code !== codeToRemove);
    setRestrictedCodes(newRestrictedCodes);
    
    // Update the rule engine provider
    ruleEngineProvider.updateRestrictedNaicsCodes(newRestrictedCodes.map(c => c.code));
    
    // Apply rule changes
    await applyRuleChanges(newRestrictedCodes);
  };

  // Function to toggle the rule active state
  const handleToggleRule = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newActiveState = event.target.checked;
    setIsRuleActive(newActiveState);
    
    // Update the rule engine provider
    ruleEngineProvider.setNaicsRuleEnabled(newActiveState);
    
    if (newActiveState) {
      await applyRuleChanges(restrictedCodes);
    } else {
      await resetSubmissionsCompliance();
    }
  };

  // Reset submission compliance statuses when rule is disabled
  const resetSubmissionsCompliance = async () => {
    if (!isDemoMode) {
      // For live mode, fetch from API
      dispatch(fetchSubmissionsStart());
      const data = await apiService.getSubmissions();
      dispatch(fetchSubmissionsSuccess(data));
      findAffectedSubmissions(data, []);
    } else {
      // For demo mode, we can manually update statuses
      const updatedSubmissions = submissions.map(sub => {
        const industryCode = sub.insured?.industry?.code || '';
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
        // For demo mode, fetch from API with demo mode enabled
        dispatch(fetchSubmissionsStart());
        const data = await apiService.getSubmissions();
        dispatch(fetchSubmissionsSuccess(data));
        findAffectedSubmissions(data, isRuleActive ? currentRestrictedCodes : []);
      }
    } catch (error) {
      console.error('Error refreshing submissions:', error);
      // Still update the affected submissions display based on current data
      findAffectedSubmissions(submissions, isRuleActive ? currentRestrictedCodes : []);
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

  return (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="alert tabs"
        sx={{ mb: 2 }}
      >
        <Tab label="All Alerts" />
        <Tab label="Rule Engine Demo" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>All Alerts</Typography>
            <Typography variant="body1">
              This panel would show all system alerts.
            </Typography>
          </Paper>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Rule Engine Demo
                {isDemoMode && <Chip label="Demo Mode" size="small" color="default" sx={{ ml: 2 }} />}
                {!isDemoMode && <Chip label="Live Mode" size="small" color="primary" sx={{ ml: 2 }} />}
              </Typography>
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
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Restricted NAICS Codes</Typography>
                
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
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddCode}
                  disabled={!newCode.trim()}
                >
                  Add Restricted Code
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
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
                
                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  {isRuleActive ? (
                    <>
                      {affectedSubmissions.length > 0 ? (
                        affectedSubmissions.map((sub) => (
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
                        ))
                      ) : (
                        <Typography>
                          No submissions are affected by current NAICS code restrictions
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography>
                      Rule is currently inactive. Activate the rule to see affected submissions.
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>How It Works</Typography>
            <Typography variant="body2">
              This demo shows how the rule engine can dynamically apply compliance rules.
              Adding or removing NAICS codes will immediately affect the compliance status
              of submissions in those industries.
            </Typography>
          </Paper>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default Alerts;