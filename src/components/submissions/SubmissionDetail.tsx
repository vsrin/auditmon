// src/components/submissions/SubmissionDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Description as DescriptionIcon,
  BusinessCenter as BusinessCenterIcon,
  AttachMoney as AttachMoneyIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedUserIcon,
  History as HistoryIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import {
  fetchSubmissionDetailStart,
  fetchSubmissionDetailSuccess,
  fetchSubmissionDetailFailure,
  clearSelectedSubmission
} from '../../store/slices/submissionSlice';
import apiService from '../../services/api/apiService';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';
import { SubmissionDetail as SubmissionDetailType } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`submission-tabpanel-${index}`}
      aria-labelledby={`submission-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedSubmission, loading, error } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode, apiEndpoint, useRemoteRuleEngine, ruleEngineApiUrl } = useSelector((state: RootState) => state.config);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Configure API service and rule engine based on current settings
  useEffect(() => {
    console.log("Config changed - isDemoMode:", isDemoMode, "apiEndpoint:", apiEndpoint);
    console.log("Rule Engine Config - useRemote:", useRemoteRuleEngine, "apiUrl:", ruleEngineApiUrl);
    
    // Configure API service
    apiService.setDemoMode(isDemoMode);
    apiService.setApiEndpoint(apiEndpoint);
    
    // Configure rule engine provider
    ruleEngineProvider.configure(useRemoteRuleEngine, ruleEngineApiUrl);
  }, [isDemoMode, apiEndpoint, useRemoteRuleEngine, ruleEngineApiUrl]);

  // Load submission detail
  useEffect(() => {
    if (!id) return;
    console.log("Loading submission detail for ID:", id);
    console.log("Using Demo Mode:", isDemoMode);
    console.log("Using Remote Rule Engine:", useRemoteRuleEngine);

    const loadSubmissionDetail = async () => {
      dispatch(fetchSubmissionDetailStart());
      try {
        console.log("Fetching submission data from API service...");
        let data = await apiService.getSubmissionDetail(id);
        console.log("Submission data received:", data);
        
        // In demo mode, we already have the compliance checks from mock data
        if (isDemoMode) {
          console.log("Using demo mode data with mock compliance checks");
          console.log("Mock data compliance checks:", data.complianceChecks);
          dispatch(fetchSubmissionDetailSuccess(data));
        } else {
          // In live mode, we need to process the data and use the rule engine
          console.log("Processing live mode data");
          
          // For live mode, ensure we have proper compliance checks
          // Initialize empty array if not present
          if (!data.complianceChecks) {
            data.complianceChecks = [];
          }
          
          // Type assertion to ensure it's in our format
          const typedData = data as SubmissionDetailType;
            
          // Call rule engine to evaluate submission
          try {
            console.log("Evaluating submission with rule engine");
            const evaluationResult = await ruleEngineProvider.evaluateSubmission(typedData);
            
            console.log("Rule engine evaluation result:", evaluationResult);
            
            // Add compliance checks to the submission data
            typedData.complianceChecks = evaluationResult.checks || [];
            typedData.status = evaluationResult.overallStatus || typedData.status;
            
            console.log("Updated submission with checks:", 
              `Count: ${typedData.complianceChecks.length}`, 
              `Status: ${typedData.status}`);
          } catch (ruleError) {
            console.error("Error evaluating submission with rule engine:", ruleError);
            console.error("Error stack:", ruleError instanceof Error ? ruleError.stack : "No stack trace");
            // If rule evaluation fails, keep empty compliance checks
          }
          
          dispatch(fetchSubmissionDetailSuccess(typedData));
        }

        // Set first document as selected if available
        if (data.documents && data.documents.length > 0) {
          setSelectedDocument(data.documents[0].id);
        }
      } catch (err) {
        console.error("Error loading submission detail:", err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        dispatch(fetchSubmissionDetailFailure(errorMessage));
      }
    };

    loadSubmissionDetail();

    // Clean up when component unmounts
    return () => {
      console.log("Cleaning up - clearing selected submission");
      dispatch(clearSelectedSubmission());
    };
  }, [dispatch, id, isDemoMode, useRemoteRuleEngine]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusIcon = (status: string | undefined) => {
    // Handle undefined status case
    if (!status) {
      return <CheckCircleIcon color="disabled" />; // Default icon for undefined status
    }

    switch (status.toLowerCase()) {
      case 'compliant':
        return <CheckCircleIcon color="success" />;
      case 'attention':
      case 'at risk':
        return <WarningIcon color="warning" />;
      case 'non-compliant':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon color="disabled" />; 
    }
  };

  const getStatusColor = (status: string | undefined) => {
    // Handle undefined status case
    if (!status) {
      return 'default';
    }

    switch (status.toLowerCase()) {
      case 'compliant':
        return 'success';
      case 'attention':
      case 'at risk':
        return 'warning';
      case 'non-compliant':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'Invalid date';
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocument(documentId);
  };

  // Safely access submission properties with default values
  const getSubmissionStatus = () => selectedSubmission?.status || 'Unknown';
  const getSubmissionBrokerName = () => selectedSubmission?.broker?.name || 'Unknown Broker';
  const getSubmissionTimestamp = () => selectedSubmission?.timestamp || new Date().toISOString();

  // Debug current state
  console.log("Current submission state:", selectedSubmission);
  console.log("Compliance checks:", selectedSubmission?.complianceChecks);

  return (
    <div>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton edge="start" onClick={() => navigate('/submissions')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Submission Details
        </Typography>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && selectedSubmission && (
        <>
          {/* Header with submission metadata */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(to right, #f5f7fa, #e8f0fe)',
              borderLeft: `4px solid ${
                getSubmissionStatus().toLowerCase() === 'compliant' 
                  ? '#2E7D32' 
                  : getSubmissionStatus().toLowerCase() === 'at risk' 
                    ? '#ED6C02' 
                    : '#1565C0'
              }`
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <Box sx={{ width: { xs: '100%', md: '70%' }, pr: 2 }}>
                <Typography variant="h4" gutterBottom>
                  {selectedSubmission.insured?.name || 'Unknown Insured'}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {selectedSubmission.insured?.industry?.description || 'Unknown Industry'} | Submission ID: {selectedSubmission.submissionId || id}
                </Typography>
                <Typography variant="body2">
                  {selectedSubmission.insured?.address?.street || ''}, {selectedSubmission.insured?.address?.city || ''},
                  {selectedSubmission.insured?.address?.state ? ` ${selectedSubmission.insured.address.state}` : ''} 
                  {selectedSubmission.insured?.address?.zip ? ` ${selectedSubmission.insured.address.zip}` : ''}
                </Typography>
              </Box>
              <Box sx={{ 
                width: { xs: '100%', md: '30%' }, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: { xs: 'flex-start', md: 'flex-end' },
                mt: { xs: 2, md: 0 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getStatusIcon(getSubmissionStatus())}
                  <Typography variant="h6" ml={1} color={
                    getSubmissionStatus().toLowerCase() === 'compliant' 
                      ? 'success.main' 
                      : getSubmissionStatus().toLowerCase() === 'at risk' 
                        ? 'warning.main' 
                        : 'primary.main'
                  }>
                    {getSubmissionStatus()}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  <strong>Broker:</strong> {getSubmissionBrokerName()}
                </Typography>
                <Typography variant="body2">
                  <strong>Submitted:</strong> {formatDate(getSubmissionTimestamp())}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Assign Underwriter
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="submission tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                icon={<DescriptionIcon />} 
                iconPosition="start" 
                label="Overview" 
              />
              <Tab 
                icon={<AssignmentIcon />} 
                iconPosition="start" 
                label={
                  <Badge badgeContent={selectedSubmission.documents?.length || 0} color="primary">
                    Documents
                  </Badge>
                } 
              />
              <Tab 
                icon={<VerifiedUserIcon />} 
                iconPosition="start" 
                label={
                  <Badge badgeContent={selectedSubmission.complianceChecks?.length || 0} color="warning">
                    Compliance
                  </Badge>
                } 
              />
              <Tab 
                icon={<HistoryIcon />} 
                iconPosition="start" 
                label="Audit Trail" 
              />
              <Tab 
                icon={<PlaylistAddCheckIcon />} 
                iconPosition="start" 
                label="Actions" 
              />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Insured Information" />
                  <CardContent>
                    <List disablePadding>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessCenterIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Industry" 
                          secondary={
                            selectedSubmission.insured?.industry 
                              ? `${selectedSubmission.insured.industry.code || 'N/A'} - ${selectedSubmission.insured.industry.description || 'N/A'}`
                              : 'N/A'
                          } 
                        />
                      </ListItem>
                      {selectedSubmission.insured?.yearsInBusiness && (
                        <ListItem>
                          <ListItemIcon>
                            <TimelineIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Years in Business" 
                            secondary={selectedSubmission.insured.yearsInBusiness} 
                          />
                        </ListItem>
                      )}
                      {selectedSubmission.insured?.employeeCount && (
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Employee Count" 
                            secondary={selectedSubmission.insured.employeeCount} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Coverage Information" />
                  <CardContent>
                    <List disablePadding>
                      <ListItem>
                        <ListItemIcon>
                          <AttachMoneyIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Lines of Business" 
                          secondary={selectedSubmission.coverage?.lines?.join(', ') || 'N/A'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TimelineIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Policy Period" 
                          secondary={
                            selectedSubmission.coverage 
                              ? `${formatDate(selectedSubmission.coverage.effectiveDate || '')} - ${formatDate(selectedSubmission.coverage.expirationDate || '')}`
                              : 'N/A'
                          } 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Compliance Summary" />
                  <CardContent>
                    {selectedSubmission.complianceChecks && selectedSubmission.complianceChecks.length > 0 ? (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Check</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedSubmission.complianceChecks.map((check) => (
                              <TableRow key={check.checkId || Math.random().toString()}>
                                <TableCell>{check.category || 'Unknown'}</TableCell>
                                <TableCell>
                                  <Chip 
                                    icon={getStatusIcon(check.status)} 
                                    label={check.status || 'Unknown'} 
                                    color={getStatusColor(check.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'} 
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    size="small" 
                                    onClick={() => {
                                      setTabValue(2); // Switch to Compliance tab
                                    }}
                                  >
                                    View Details
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No compliance checks available.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Document Summary" />
                  <CardContent>
                    {selectedSubmission.documents && selectedSubmission.documents.length > 0 ? (
                      <List>
                        {selectedSubmission.documents.map((document) => (
                          <ListItem key={document.id || Math.random().toString()}>
                            <ListItemIcon>
                              <DescriptionIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary={document.name || 'Untitled Document'} 
                              secondary={document.type || 'Unknown Type'}
                            />
                            <Chip 
                              label={document.status || 'Unknown'} 
                              color={
                                document.status === 'processed' 
                                  ? 'success' 
                                  : document.status === 'pending' 
                                    ? 'warning' 
                                    : 'error'
                              } 
                              size="small"
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No documents available.
                      </Typography>
                    )}
                    
                    {selectedSubmission.documents && selectedSubmission.documents.length > 0 && (
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => setTabValue(1)} // Switch to Documents tab
                      >
                        View All Documents
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>

          {/* Documents Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              {/* Document Grid */}
              <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                <Card>
                  <CardHeader title="Submission Documents" />
                  <CardContent sx={{ p: 1 }}>
                    {selectedSubmission.documents && selectedSubmission.documents.length > 0 ? (
                      <List>
                        {selectedSubmission.documents.map((document) => (
                          <ListItem 
                            key={document.id || Math.random().toString()}
                            onClick={() => handleDocumentSelect(document.id)}
                            sx={{ 
                              cursor: 'pointer',
                              borderRadius: 1,
                              mb: 0.5,
                              bgcolor: selectedDocument === document.id ? 'action.selected' : 'transparent'
                            }}
                          >
                            <ListItemIcon>
                              <DescriptionIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary={document.name || 'Untitled Document'} 
                              secondary={`${document.type || 'Unknown'} • ${((document.size || 0) / 1024).toFixed(0)} KB`}
                            />
                            <Chip 
                              label={document.status || 'Unknown'} 
                              color={
                                document.status === 'processed' 
                                  ? 'success' 
                                  : document.status === 'pending' 
                                    ? 'warning' 
                                    : 'error'
                              } 
                              size="small"
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                        No documents available.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Document Viewer */}
              <Box sx={{ width: { xs: '100%', md: '70%' } }}>
                <Card>
                  <CardHeader 
                    title={
                      selectedSubmission.documents?.find(d => d.id === selectedDocument)?.name || 'Document Viewer'
                    } 
                    action={
                      <Button variant="outlined" size="small">Download</Button>
                    }
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', height: '70vh' }}>
                      {/* Document preview placeholder */}
                      <Box sx={{ 
                        flex: 1, 
                        bgcolor: '#f5f5f5', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <DescriptionIcon sx={{ fontSize: 60, color: '#9e9e9e', mb: 2 }} />
                          <Typography variant="body1">Document Preview</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedDocument && selectedSubmission.documents
                              ? selectedSubmission.documents.find(d => d.id === selectedDocument)?.name || 'No document selected'
                              : 'No document selected'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Extracted data panel */}
                      <Box sx={{ width: '300px', ml: 2, borderLeft: '1px solid #e0e0e0', pl: 2 }}>
                        <Typography variant="h6" gutterBottom>Extracted Data</Typography>
                        {selectedDocument && selectedSubmission.documents ? (
                          <>
                            <Typography variant="subtitle2" gutterBottom>Metadata</Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                <strong>Type:</strong> {
                                  selectedSubmission.documents.find(d => d.id === selectedDocument)?.type || 'Unknown'
                                }
                              </Typography>
                              <Typography variant="body2">
                                <strong>Status:</strong> {
                                  selectedSubmission.documents.find(d => d.id === selectedDocument)?.status || 'Unknown'
                                }
                              </Typography>
                              <Typography variant="body2">
                                <strong>Size:</strong> {
                                  ((selectedSubmission.documents.find(d => d.id === selectedDocument)?.size || 0) / 1024).toFixed(0)
                                } KB
                              </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>Document Contents</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Select items from the document to view extracted data.
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No document selected.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>

          {/* Compliance Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {selectedSubmission.complianceChecks && selectedSubmission.complianceChecks.length > 0 ? (
                selectedSubmission.complianceChecks.map((check) => (
                  <Card key={check.checkId || Math.random().toString()}>
                    <CardHeader 
                      title={check.category || 'Unknown Check'}
                      subheader={`Check ID: ${check.checkId || 'Unknown'} | ${formatDate(check.timestamp || '')}`}
                      avatar={getStatusIcon(check.status)}
                      action={
                        <Chip 
                          label={check.status || 'Unknown'} 
                          color={getStatusColor(check.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'} 
                        />
                      }
                    />
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Findings</Typography>
                      <Typography variant="body1" paragraph>
                        {check.findings || 'No findings available.'}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1" gutterBottom>Data Points Used</Typography>
                      {check.dataPoints && Object.keys(check.dataPoints).length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {Object.entries(check.dataPoints).map(([key, value]) => (
                            <Box 
                              key={key}
                              sx={{ 
                                width: { xs: '100%', sm: '48%', md: '23%' },
                                p: 1, 
                                bgcolor: '#f5f5f5', 
                                borderRadius: 1 
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Typography>
                              <Typography variant="body2">{value?.toString() || 'N/A'}</Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No data points available.
                        </Typography>
                      )}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {check.status && check.status.toLowerCase() !== 'compliant' && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>Override</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                              <TextField
                                select
                                fullWidth
                                label="Override Status"
                                defaultValue=""
                                size="small"
                              >
                                <MenuItem value="approved">Approve Exception</MenuItem>
                                <MenuItem value="declined">Decline Exception</MenuItem>
                                <MenuItem value="needsInfo">Need More Information</MenuItem>
                              </TextField>
                            </Box>
                            <Box sx={{ width: '100%' }}>
                              <TextField
                                fullWidth
                                label="Justification"
                                multiline
                                rows={3}
                                placeholder="Enter reason for override..."
                              />
                            </Box>
                            <Box>
                              <Button variant="contained" color="primary">
                                Submit Override
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1">No compliance checks available.</Typography>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Audit Trail Tab */}
          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardHeader title="Audit Trail" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <HistoryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Submission Created" 
                      secondary={`${formatDate(selectedSubmission.timestamp || '')} by ${selectedSubmission.broker?.name || 'Unknown'}`}
                    />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <AssignmentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Documents Processed" 
                      secondary={`${formatDate(selectedSubmission.timestamp || '')} - ${selectedSubmission.documents?.length || 0} documents received`}
                    />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <VerifiedUserIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Compliance Checks Completed" 
                      secondary={`${formatDate(selectedSubmission.timestamp || '')} - ${selectedSubmission.complianceChecks?.length || 0} checks performed`}
                    />
                  </ListItem>
                  <Divider component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color={getStatusColor(selectedSubmission.status) as 'success' | 'warning' | 'error'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Submission Marked as ${selectedSubmission.status || 'Unknown'}`} 
                      secondary={formatDate(selectedSubmission.timestamp || '')}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Actions Tab */}
          <TabPanel value={tabValue} index={4}>
            <Card>
              <CardHeader title="Available Actions" />
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ width: { xs: '100%', sm: '48%', md: '32%' } }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <AssignmentIcon color="primary" sx={{ fontSize: 48 }} />
                        </Box>
                        <Typography variant="h6" align="center" gutterBottom>
                          Request Additional Documents
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Ask the broker to provide additional documentation for this submission
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button variant="outlined" color="primary">
                            Request Documents
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', sm: '48%', md: '32%' } }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <PersonIcon color="primary" sx={{ fontSize: 48 }} />
                        </Box>
                        <Typography variant="h6" align="center" gutterBottom>
                          Assign Underwriter
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Assign this submission to an underwriter for review
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button variant="contained" color="primary">
                            Assign Now
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', sm: '48%', md: '32%' } }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                        </Box>
                        <Typography variant="h6" align="center" gutterBottom>
                          Mark Review Complete
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Mark this submission as reviewed and ready for quoting
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button variant="outlined" color="success">
                            Complete Review
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </>
      )}
    </div>
  );
};

export default SubmissionDetail;