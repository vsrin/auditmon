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
} from '@mui/icons-material';
import { RootState } from '../../store';
import apiService from '../../services/api/apiService';
import { fetchSubmissionsStart, fetchSubmissionsSuccess, fetchSubmissionsFailure } from '../../store/slices/submissionSlice';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';

// Import interface for AuditAlerts props
interface AuditAlertsProps {
  submissions: any[];
}

// Updated AuditAlerts component to match the image
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
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [showDemoNotice, setShowDemoNotice] = useState<boolean>(true); 
  
  // Count statuses for metrics display
  const compliantCount = submissions.filter(s => s.status === 'Compliant').length;
  const atRiskCount = submissions.filter(s => s.status === 'At Risk' || s.status === 'Requires Attention').length;
  const nonCompliantCount = submissions.filter(s => s.status === 'Non-Compliant').length;
  
  // Calculate completion percentage
  const submissionsCount = submissions.length;
  const compliantPercentage = Math.round((compliantCount / submissionsCount) * 100) || 0;
  
  // Sync rule engine to current mode
  useEffect(() => {
    if (ruleEngineProvider && typeof ruleEngineProvider.setDemoMode === 'function') {
      ruleEngineProvider.setDemoMode(isDemoMode);
    }
  }, [isDemoMode]);

  // Load submissions and reports on component mount
  useEffect(() => {
    // Initial load
    const loadDataAndReports = async () => {
      if (submissions.length === 0 || loading) {
        // Load submissions
        dispatch(fetchSubmissionsStart());
        try {
          const data = await apiService.getSubmissions();
          dispatch(fetchSubmissionsSuccess(data));
        } catch (err) {
          console.error('Error loading submissions:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to load submissions';
          dispatch(fetchSubmissionsFailure(errorMessage));
        }
      }
    };
    
    loadDataAndReports();
  }, [dispatch, isDemoMode, submissions.length, loading]);

  // Handle card click to navigate
  const handleCardClick = (path: string) => {
    navigate(path);
  };

  // Handle row click to navigate to submission detail
  const handleRowClick = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
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
  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <Box my={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
          {isDemoMode && <Chip label="Demo Mode" size="small" color="default" sx={{ ml: 2 }} />}
        </Typography>
        <Box>
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
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
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
                value={(atRiskCount / submissionsCount) * 100 || 0} 
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
                value={(nonCompliantCount / submissionsCount) * 100 || 0} 
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
            
            {loading ? (
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
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Audit Alerts Panel - Updated to match the image */}
          <AuditAlerts submissions={submissions} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;