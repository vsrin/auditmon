// src/components/dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControlLabel,
  Switch,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  WarningOutlined as WarningIcon,
  ErrorOutline as ErrorIcon,
  DescriptionOutlined as DocumentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';
import apiService from '../../services/api/apiService';
import { fetchSubmissionsStart, fetchSubmissionsSuccess, fetchSubmissionsFailure } from '../../store/slices/submissionSlice';
import { Submission } from '../../types';
import useModeSwitching from '../../hooks/useModeSwitching';
import { mockSubmissions } from '../../services/mock/mockData';

// Import interface for AuditAlerts props
interface AuditAlertsProps {
  submissions: Submission[];
}

// AuditAlerts component
const AuditAlerts: React.FC<AuditAlertsProps> = ({ submissions }) => {
  const navigate = useNavigate();
  
  // Count for different alert types
  const missingFinancialCount = 5; // Hardcoded for demo purposes
  const outsideRiskCount = 3;      // Hardcoded for demo purposes
  const totalAlerts = 8;           // Hardcoded for demo purposes
  
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Audit Alerts</Typography>
        <Button 
          variant="text" 
          color="primary"
          onClick={() => navigate('/alerts')}
        >
          View All
        </Button>
      </Box>
      
      {/* Missing Financial Documents Alert */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: '#FFF8E1',
          borderRadius: 1,
          border: '1px solid #FFE082'
        }}
      >
        <Typography variant="h6" sx={{ color: '#5D4037', mb: 1 }}>
          Missing Financial Documents
        </Typography>
        <Typography variant="body1" sx={{ color: '#5D4037' }}>
          {missingFinancialCount} submissions need financial statements
        </Typography>
      </Paper>
      
      {/* Outside Risk Appetite Alert */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: '#FFEBEE',
          borderRadius: 1,
          border: '1px solid #FFCDD2'
        }}
      >
        <Typography variant="h6" sx={{ color: '#C62828', mb: 1 }}>
          Outside Risk Appetite
        </Typography>
        <Typography variant="body1" sx={{ color: '#C62828' }}>
          {outsideRiskCount} submissions in prohibited classes
        </Typography>
      </Paper>
      
      {/* View All Alerts Link */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2,
          bgcolor: '#E3F2FD',
          borderRadius: 1,
          border: '1px solid #BBDEFB',
          textAlign: 'center'
        }}
      >
        <Button 
          color="primary"
          onClick={() => navigate('/alerts')}
        >
          View all {totalAlerts} alerts...
        </Button>
      </Paper>
    </Paper>
  );
};

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submissions, loading, error } = useSelector((state: RootState) => state.submissions);
  const config = useSelector((state: RootState) => state.config);
  const { isDemoMode, forceRefresh } = useModeSwitching('Dashboard');
  
  const [showDemoNotice, setShowDemoNotice] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [apiServerDown, setApiServerDown] = useState<boolean>(false);
  
  // Count statuses for metrics display
  const compliantCount = submissions.filter(s => s.status === 'Compliant').length;
  const atRiskCount = submissions.filter(s => s.status === 'At Risk' || s.status === 'Requires Attention').length;
  const nonCompliantCount = submissions.filter(s => s.status === 'Non-Compliant').length;
  
  // Calculate completion percentage
  const submissionsCount = submissions.length || 0;
  const compliantPercentage = submissionsCount > 0 ? Math.round((compliantCount / submissionsCount) * 100) : 0;

  // Load submissions on component mount
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        // Set loading state
        dispatch(fetchSubmissionsStart());
        
        console.log("Dashboard - fetching submissions, demo mode:", isDemoMode);
        
        // If in Live mode but API server is known to be down, use demo data as fallback
        if (!isDemoMode && apiServerDown) {
          console.log("Dashboard - API server known to be unavailable, using demo data as fallback");
          dispatch(fetchSubmissionsSuccess(mockSubmissions));
          return;
        }
        
        // Get submissions
        apiService.setDemoMode(isDemoMode);
        if (!isDemoMode) {
          apiService.setApiEndpoint(config.apiEndpoint);
        }
        
        const data = await apiService.getSubmissions();
        
        if (data.length === 0) {
          throw new Error('No submissions returned');
        }
        
        // Update the store with the fetched data
        dispatch(fetchSubmissionsSuccess(data));
        
        // Reset retry counter and API server status on success
        setRetryCount(0);
        setApiServerDown(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        
        // If in Live mode and we've exhausted retries, fall back to demo data
        if (!isDemoMode && retryCount >= 2) {
          console.log("Dashboard - API server unavailable after retries, using demo data as fallback");
          setApiServerDown(true);
          dispatch(fetchSubmissionsSuccess(mockSubmissions));
          dispatch(fetchSubmissionsFailure(`Could not connect to ${config.apiEndpoint}. Using demo data as a fallback.`));
          return;
        }
        
        // Update the store with the error
        dispatch(fetchSubmissionsFailure(errorMessage));
        
        // Try again a few times (only in live mode)
        if (!isDemoMode && retryCount < 3) {
          console.log(`Dashboard - Retry attempt ${retryCount + 1}/3`);
          setRetryCount(prevRetryCount => prevRetryCount + 1);
          
          // Wait a moment before retrying
          setTimeout(() => {
            loadSubmissions();
          }, 1000);
        }
      }
    };
    
    // Only fetch if we don't already have submissions or if we're explicitly loading
    // Avoid loading if we know the API server is down in Live mode
    if ((submissions.length === 0 || loading) && !(apiServerDown && !isDemoMode)) {
      loadSubmissions();
    }
  }, [dispatch, isDemoMode, submissions.length, loading, apiServerDown, retryCount, config.apiEndpoint]);

  // Reset API server status when switching modes
  useEffect(() => {
    // When switching to demo mode, reset API server status
    if (isDemoMode) {
      setApiServerDown(false);
      setRetryCount(0);
    }
  }, [isDemoMode]);

  // Handle card click to navigate
  const handleCardClick = (path: string) => {
    navigate(path);
  };

  // Handle row click to navigate to submission detail
  const handleRowClick = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
  };

  // Navigate to settings
  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status chip based on status text
  const getStatusChip = (status: string | undefined) => {
    if (!status) return <Chip label="Unknown" color="default" size="small" />;
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'compliant') {
      return <Chip label={status} color="success" size="small" />;
    } else if (statusLower === 'at risk' || statusLower.includes('attention')) {
      return <Chip label={status} color="warning" size="small" />;
    } else if (statusLower === 'non-compliant') {
      return <Chip label={status} color="error" size="small" />;
    }
    return <Chip label={status} color="default" size="small" />;
  };
  
  // Get the 5 most recent submissions for the dashboard
  const recentSubmissions = submissions.length > 0
    ? [...submissions]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
    : [];
    
  // Handle refresh button click  
  const handleRefresh = () => {
    // Reset API server status and retry count when manually refreshing
    setApiServerDown(false);
    setRetryCount(0);
    
    // Use the forceRefresh function from the useModeSwitching hook
    forceRefresh();
  };

  return (
    <Box my={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
          {isDemoMode && <Chip label="Demo Mode" size="small" color="default" sx={{ ml: 2 }} />}
          {!isDemoMode && !apiServerDown && <Chip label="Live Mode" size="small" color="primary" sx={{ ml: 2 }} />}
          {!isDemoMode && apiServerDown && <Chip label="Live Mode (Using Demo Data)" size="small" color="warning" sx={{ ml: 2 }} />}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleNavigateToSettings}
            startIcon={<SettingsIcon />}
            sx={{ mr: 2 }}
          >
            Settings
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{ mr: 2 }}
          >
            Refresh Data
          </Button>
          <FormControlLabel
            control={
              <Switch 
                checked={showDemoNotice} 
                onChange={(e) => setShowDemoNotice(e.target.checked)}
                color="primary"
              />
            }
            label="Show Alerts"
          />
        </Box>
      </Box>
      
      {showDemoNotice && isDemoMode && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setShowDemoNotice(false)}>
          <Typography variant="body2">
            This dashboard is running in <strong>Demo Mode</strong> with synthetic data. Toggle to Live Mode in Settings to connect to real APIs.
          </Typography>
        </Alert>
      )}
      
      {showDemoNotice && !isDemoMode && !apiServerDown && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setShowDemoNotice(false)}>
          <Typography variant="body2">
            This dashboard is running in <strong>Live Mode</strong> and connecting to API at {config.apiEndpoint}. Make sure the API server is running.
          </Typography>
        </Alert>
      )}
      
      {showDemoNotice && !isDemoMode && apiServerDown && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setShowDemoNotice(false)} 
          action={
            <Button color="inherit" size="small" onClick={handleNavigateToSettings}>
              Configure API
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>API Server Unavailable</strong> - Could not connect to {config.apiEndpoint}. Using demo data as a fallback. 
            Please check if the API server is running or configure a different API endpoint in Settings.
          </Typography>
        </Alert>
      )}
      
      {error && !loading && !apiServerDown && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}
      
      {/* First row - Key metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleCardClick('/submissions')}>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Submissions</Typography>
                  <Typography variant="h4">{submissionsCount}</Typography>
                </Box>
                <Box sx={{ backgroundColor: 'primary.light', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <DocumentIcon sx={{ color: 'primary.contrastText' }} />
                </Box>
              </Box>
              <Box mt={2} display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 0.5 }} fontSize="small" />
                <Typography variant="body2">
                  3 new in the last 24 hours
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleCardClick('/submissions?status=Compliant')}>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Compliant</Typography>
                  <Typography variant="h4">{compliantCount}</Typography>
                </Box>
                <Box sx={{ backgroundColor: 'success.light', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <CheckIcon sx={{ color: 'success.contrastText' }} />
                </Box>
              </Box>
              <Box mt={2} display="flex" alignItems="center">
                <Typography variant="body2">
                  {compliantPercentage}% of total submissions
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={compliantPercentage} 
                color="success"
                sx={{ mt: 1, height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleCardClick('/submissions?status=At Risk')}>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Requires Attention</Typography>
                  <Typography variant="h4">{atRiskCount}</Typography>
                </Box>
                <Box sx={{ backgroundColor: 'warning.light', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <WarningIcon sx={{ color: 'warning.contrastText' }} />
                </Box>
              </Box>
              <Box mt={2} display="flex" alignItems="center">
                <Typography variant="body2">
                  Need review for compliance issues
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={submissionsCount > 0 ? (atRiskCount / submissionsCount) * 100 : 0} 
                color="warning"
                sx={{ mt: 1, height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleCardClick('/submissions?status=Non-Compliant')}>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Non-Compliant</Typography>
                  <Typography variant="h4">{nonCompliantCount}</Typography>
                </Box>
                <Box sx={{ backgroundColor: 'error.light', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <ErrorIcon sx={{ color: 'error.contrastText' }} />
                </Box>
              </Box>
              <Box mt={2} display="flex" alignItems="center">
                <Typography variant="body2">
                  Critical compliance violations
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={submissionsCount > 0 ? (nonCompliantCount / submissionsCount) * 100 : 0} 
                color="error"
                sx={{ mt: 1, height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Second row - Recent submissions and alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Submissions</Typography>
              <Button 
                variant="text" 
                color="primary"
                onClick={() => handleCardClick('/submissions')}
              >
                View All
              </Button>
            </Box>
            
            {loading && !apiServerDown ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : recentSubmissions.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Submission ID</TableCell>
                      <TableCell>Insured Name</TableCell>
                      <TableCell>Industry</TableCell>
                      <TableCell>Date Received</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSubmissions.map((submission) => (
                      <TableRow 
                        key={submission.submissionId}
                        hover
                        onClick={() => handleRowClick(submission.submissionId)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{submission.submissionId}</TableCell>
                        <TableCell>{submission.insured?.name || 'Unknown'}</TableCell>
                        <TableCell>{submission.insured?.industry?.description || 'Unknown'}</TableCell>
                        <TableCell>{formatDate(submission.timestamp)}</TableCell>
                        <TableCell>{getStatusChip(submission.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box p={2} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No submissions available
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleRefresh}
                  startIcon={<RefreshIcon />}
                  sx={{ mt: 2 }}
                >
                  Refresh Data
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Audit Alerts Panel */}
          <AuditAlerts submissions={submissions} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;