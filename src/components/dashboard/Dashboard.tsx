// src/components/dashboard/Dashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  styled,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { RootState } from '../../store';
import apiService from '../../services/api/apiService';
import { fetchSubmissionsStart, fetchSubmissionsSuccess, fetchSubmissionsFailure } from '../../store/slices/submissionSlice';
import { SubmissionData } from '../../types';
import { mockSubmissions } from '../../services/mock/mockData'; // Import mock data

// Styled components for metrics cards
const MetricCard = styled(Card)(({ theme, bgcolor }: { theme?: any, bgcolor: string }) => ({
  height: '100%',
  backgroundColor: bgcolor,
  color: '#fff',
  transition: 'transform 0.3s',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)'
  }
}));

// Colors for pie chart
const COLORS = ['#4dabf5', '#66bb6a', '#ff9800', '#f44336'];

// Label styling for pie chart
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name
}: any) => {
  // Calculate positioning for label - move it further from the pie
  const radius = outerRadius * 1.4; // Increase this value to move labels further
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only render if the segment has a value (percent > 0)
  if (percent === 0) return null;

  return (
    <text
      x={x}
      y={y}
      fill={COLORS[index % COLORS.length]}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontWeight="bold"
      fontSize="14"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

// Define this outside the component to prevent recreation on each render
const defaultDashboardData = {
  submissionTrends: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    data: [12, 19, 13, 25, 22, 42]
  }
};

// Audit alerts data
const auditAlerts = [
  {
    title: "Missing Financial Documents",
    description: "5 submissions need financial statements",
    color: "#fff3e0" // Light orange background
  },
  {
    title: "Outside Risk Appetite",
    description: "3 submissions in prohibited classes",
    color: "#ffebee" // Light red background
  }
];

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  const { submissions, loading: submissionsLoading } = useSelector((state: RootState) => state.submissions);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(defaultDashboardData);
  const [initialized, setInitialized] = useState(false);

  // Calculate metrics based on the mockSubmissions data for demo mode
  // For live mode, use the actual submissions data
  const totalSubmissions = isDemoMode ? mockSubmissions.length : submissions.length;
  const compliantSubmissions = isDemoMode 
    ? mockSubmissions.filter(sub => sub.status === 'Compliant').length 
    : submissions.filter(sub => sub.status === 'Compliant').length;
  const atRiskSubmissions = isDemoMode
    ? mockSubmissions.filter(sub => sub.status === 'At Risk').length
    : submissions.filter(sub => sub.status === 'At Risk').length;
  const nonCompliantSubmissions = isDemoMode
    ? mockSubmissions.filter(sub => sub.status === 'Non-Compliant').length
    : submissions.filter(sub => sub.status === 'Non-Compliant').length;

  // Sample audit control data - could also be calculated from mock data
  const auditControlData = [
    { name: 'Documents Complete', value: 75 },
    { name: 'In Risk Appetite', value: 25 },
    { name: 'Loss History Issues', value: 0 },
    { name: 'Needs Financial Review', value: 0 }
  ];

  // Generate synthetic submissions - use mockSubmissions directly
  const generateSyntheticSubmissions = useCallback((): SubmissionData[] => {
    console.log("Using mock submissions data");
    return mockSubmissions;
  }, []);

  // Load dashboard data only once on mount or when mode changes
  useEffect(() => {
    const loadDashboardData = async () => {
      // If we're already loading, skip
      if (loading || submissionsLoading) {
        return;
      }

      // If we already have data and mode hasn't changed, skip
      if (initialized && submissions.length > 0) {
        return;
      }

      console.log("Loading dashboard data, isDemoMode:", isDemoMode);
      setLoading(true);
      setError(null);
      
      try {
        if (isDemoMode) {
          // For demo mode, use our default dashboard data
          setDashboardData(defaultDashboardData);
          
          // Generate synthetic submissions only if we don't already have them
          if (submissions.length === 0) {
            const syntheticData = generateSyntheticSubmissions();
            dispatch(fetchSubmissionsSuccess(syntheticData));
          }
        } else {
          // For live mode, attempt to fetch real data
          try {
            dispatch(fetchSubmissionsStart());
            
            // Try to get real reports data
            const reports = await apiService.getReports();
            if (reports) {
              // Ensure reports has the required submissionTrends structure
              const sanitizedReports = {
                ...defaultDashboardData,
                ...reports
              };
              setDashboardData(sanitizedReports);
            }
            
            // Try to get real submissions data
            const submissionsData = await apiService.getSubmissions();
            if (submissionsData && submissionsData.length > 0) {
              dispatch(fetchSubmissionsSuccess(submissionsData));
            } else {
              throw new Error('No submissions data returned');
            }
          } catch (apiError) {
            console.error('API Error:', apiError);
            // Fall back to demo data if API fails
            setDashboardData(defaultDashboardData);
            const syntheticData = generateSyntheticSubmissions();
            dispatch(fetchSubmissionsSuccess(syntheticData));
          }
        }
        
        setInitialized(true);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        dispatch(fetchSubmissionsFailure(errorMessage));
        
        // Even in error case, try to show demo data
        setDashboardData(defaultDashboardData);
        if (submissions.length === 0) {
          const syntheticData = generateSyntheticSubmissions();
          dispatch(fetchSubmissionsSuccess(syntheticData));
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [
    dispatch, 
    isDemoMode, 
    loading, 
    submissionsLoading, 
    initialized, 
    submissions.length, 
    generateSyntheticSubmissions
  ]);

  // Handler for metric card clicks to navigate to filtered submissions
  const handleMetricClick = (status: string) => {
    if (status === 'all') {
      navigate('/submissions');
    } else {
      navigate(`/submissions?status=${status}`);
    }
  };

  // Handler for "View all alerts" click
  const handleViewAllAlertsClick = () => {
    navigate('/alerts');
  };

  // Handler for Rule Engine Demo button
  const handleRuleEngineDemoClick = () => {
    navigate('/alerts?tab=rule-engine');
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
  const getStatusChip = (status: string) => {
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          Insurance Monitoring Dashboard
        </Typography>
        <Button 
          variant="contained"
          color="primary"
          startIcon={<SettingsIcon />}
          onClick={handleRuleEngineDemoClick}
        >
          Rule Engine Demo
        </Button>
      </Box>
      
      {(loading || submissionsLoading) && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {!loading && !submissionsLoading && (
        <>
          {/* Metrics Overview */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={3}>
              <MetricCard bgcolor="#4dabf5" onClick={() => handleMetricClick('all')}>
                <CardContent>
                  <Typography variant="overline">Submissions</Typography>
                  <Typography variant="h3">{totalSubmissions}</Typography>
                  <Typography variant="body2">Active submissions</Typography>
                </CardContent>
              </MetricCard>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <MetricCard bgcolor="#66bb6a" onClick={() => handleMetricClick('Compliant')}>
                <CardContent>
                  <Typography variant="overline">Compliant</Typography>
                  <Typography variant="h3">{compliantSubmissions}</Typography>
                  <Typography variant="body2">Ready for underwriting</Typography>
                </CardContent>
              </MetricCard>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <MetricCard bgcolor="#ff9800" onClick={() => handleMetricClick('At Risk')}>
                <CardContent>
                  <Typography variant="overline">At Risk</Typography>
                  <Typography variant="h3">{atRiskSubmissions}</Typography>
                  <Typography variant="body2">Need attention</Typography>
                </CardContent>
              </MetricCard>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <MetricCard bgcolor="#f44336" onClick={() => handleMetricClick('Non-Compliant')}>
                <CardContent>
                  <Typography variant="overline">Non-Compliant</Typography>
                  <Typography variant="h3">{nonCompliantSubmissions}</Typography>
                  <Typography variant="body2">Blocked from proceeding</Typography>
                </CardContent>
              </MetricCard>
            </Grid>
          </Grid>
          
          {/* Charts Row */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  Audit Control Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={auditControlData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {auditControlData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {/* Audit Alerts section */}
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  Audit Alerts
                </Typography>
                
                <Box sx={{ my: 2 }}>
                  {auditAlerts.map((alert, index) => (
                    <Card 
                      key={index} 
                      sx={{ 
                        mb: 2, 
                        bgcolor: alert.color,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {alert.title}
                        </Typography>
                        <Typography variant="body1">
                          {alert.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#e3f2fd', 
                    borderRadius: 1, 
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={handleViewAllAlertsClick}
                >
                  <Typography variant="body1" color="primary">
                    View all 8 alerts...
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Recent Submissions Table */}
          <Paper sx={{ p: 2, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Recent Submissions
            </Typography>
            
            {submissions.length > 0 ? (
              <TableContainer>
                <Table>
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
                    {submissions.slice(0, 5).map((submission) => (
                      <TableRow 
                        key={submission.submissionId}
                        hover
                        onClick={() => navigate(`/submissions/${submission.submissionId}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{submission.submissionId}</TableCell>
                        <TableCell>{submission.insured.name}</TableCell>
                        <TableCell>{submission.insured.industry.description}</TableCell>
                        <TableCell>{formatDate(submission.timestamp)}</TableCell>
                        <TableCell>{getStatusChip(submission.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box p={2} textAlign="center">
                <Typography variant="body1">No submissions available</Typography>
              </Box>
            )}
            
            {submissions.length > 5 && (
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Typography 
                  color="primary" 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate('/submissions')}
                >
                  View all submissions
                </Typography>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Dashboard;