// src/components/dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  styled
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RootState } from '../../store';
import {
  fetchSubmissionsStart,
  fetchSubmissionsSuccess,
  fetchSubmissionsFailure
} from '../../store/slices/submissionSlice';
import apiService from '../../services/api/apiService';

// Styled components for metrics cards
const MetricCard = styled(Card)(({ theme, bgcolor }: { theme?: any, bgcolor: string }) => ({
  backgroundColor: bgcolor,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }
}));

// Define types for our submission data
interface SubmissionData {
  submissionId: string;
  status: string;
  documents?: Array<{
    id: string;
    status: string;
  }>;
  complianceChecks?: Array<{
    category: string;
    status: string;
  }>;
  insured?: {
    name: string;
    industry?: {
      description: string;
    }
  };
  [key: string]: any;
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submissions, loading, error } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);
  
  // State for metrics
  const [metrics, setMetrics] = useState({
    todayCount: 0,
    todayChange: 0,
    isIncrease: true,
    compliantCount: 0,
    compliantPercentage: 0,
    atRiskCount: 0,
    atRiskPercentage: 0
  });

  // State for audit control data
  const [auditControlData, setAuditControlData] = useState([
    { name: 'Documents Complete', value: 30, color: '#4285F4' },
    { name: 'In Risk Appetite', value: 40, color: '#17af55' },
    { name: 'Needs Financial Review', value: 20, color: '#FBBC05' },
    { name: 'Loss History Issues', value: 10, color: '#EA4335' },
  ]);

  // Configure API service based on current settings
  useEffect(() => {
    apiService.setDemoMode(isDemoMode);
    apiService.setApiEndpoint(apiEndpoint);
  }, [isDemoMode, apiEndpoint]);

  // Load submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      dispatch(fetchSubmissionsStart());
      try {
        const data = await apiService.getSubmissions();
        dispatch(fetchSubmissionsSuccess(data));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        dispatch(fetchSubmissionsFailure(errorMessage));
      }
    };

    loadSubmissions();
  }, [dispatch, isDemoMode]);

  // Calculate and update metrics when submissions change
  useEffect(() => {
    if (!submissions || submissions.length === 0) return;

    // Type safety - cast submissions to our SubmissionData type
    const typedSubmissions = submissions as SubmissionData[];
    
    // Count submissions by status
    const compliantCount = typedSubmissions.filter(sub => 
      sub.status.toLowerCase() === 'compliant').length;
    
    const atRiskCount = typedSubmissions.filter(sub => 
      sub.status.toLowerCase() === 'at risk').length;
    
    // Calculate today's submissions (for demo, we'll just use all submissions)
    const todayCount = typedSubmissions.length;
    
    // Calculate compliance percentages
    const compliantPercentage = Math.round((compliantCount / todayCount) * 100);
    const atRiskPercentage = Math.round((atRiskCount / todayCount) * 100);
    
    // Set fake change percentage (would come from API in real app)
    const isIncrease = Math.random() > 0.5;
    const todayChange = Math.round(Math.random() * 20);
    
    setMetrics({
      todayCount,
      todayChange,
      isIncrease,
      compliantCount,
      compliantPercentage,
      atRiskCount,
      atRiskPercentage
    });

    // Update audit control data based on submissions
    const docComplete = Math.round(typedSubmissions.filter(s => 
      s.documents && s.documents.every(d => d.status === 'processed')).length / typedSubmissions.length * 100);
    
    const inRiskAppetite = Math.round(typedSubmissions.filter(s => 
      s.status.toLowerCase() === 'compliant').length / typedSubmissions.length * 100);
    
    // Check for financial reviews with proper type safety
    const needsFinancialReview = Math.round(typedSubmissions.filter(s => 
      s.complianceChecks && s.complianceChecks.some((c: {category: string; status: string;}) => 
        c.category.toLowerCase().includes('financial') && c.status.toLowerCase() !== 'compliant'
      )).length / typedSubmissions.length * 100);
    
    const lossHistoryIssues = 100 - docComplete - inRiskAppetite - needsFinancialReview;
    
    setAuditControlData([
      { name: 'Documents Complete', value: docComplete, color: '#4285F4' },
      { name: 'In Risk Appetite', value: inRiskAppetite, color: '#17af55' },
      { name: 'Needs Financial Review', value: needsFinancialReview, color: '#FBBC05' },
      { name: 'Loss History Issues', value: Math.max(0, lossHistoryIssues), color: '#EA4335' },
    ]);

  }, [submissions]);

  // Recent submissions with today's date
  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Get recent submissions from the full submissions list
  const recentSubmissions = (submissions as SubmissionData[]).slice(0, 4).map(sub => ({
    id: sub.submissionId,
    insuredName: sub.insured?.name || 'Unknown',
    industry: sub.insured?.industry?.description || 'Unknown',
    dateReceived: todayDate,
    status: sub.status
  }));

  // Status to color mapping
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
        return 'success';
      case 'at risk':
        return 'warning';
      case 'non-compliant':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
        return '#E8F5E9'; // Light green background
      case 'at risk':
        return '#FFF3E0'; // Light orange background
      default:
        return 'transparent';
    }
  };

  return (
    <div>
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

      {!loading && !error && (
        <Box sx={{ width: '100%' }}>
          {/* Metrics Cards */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <MetricCard bgcolor="#E3F2FD" sx={{ flex: 1, minWidth: 240 }}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Submissions Today
                </Typography>
                <Box display="flex" alignItems="baseline" mt={1}>
                  <Typography variant="h3" component="div" fontWeight="bold" color="#1565C0">
                    {metrics.todayCount}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={metrics.isIncrease ? "success.main" : "error.main"} 
                    ml={1} 
                    display="flex" 
                    alignItems="center"
                  >
                    {metrics.isIncrease ? (
                      <ArrowUpwardIcon fontSize="small" />
                    ) : (
                      <ArrowDownwardIcon fontSize="small" />
                    )}
                    {metrics.todayChange}% vs yesterday
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
            
            <MetricCard bgcolor="#E8F5E9" sx={{ flex: 1, minWidth: 240 }}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Compliant Submissions
                </Typography>
                <Box display="flex" alignItems="baseline" mt={1}>
                  <Typography variant="h3" component="div" fontWeight="bold" color="#17af55">
                    {metrics.compliantCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    {metrics.compliantPercentage}% of total
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
            
            <MetricCard bgcolor="#FFF3E0" sx={{ flex: 1, minWidth: 240 }}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  At-Risk Submissions
                </Typography>
                <Box display="flex" alignItems="baseline" mt={1}>
                  <Typography variant="h3" component="div" fontWeight="bold" color="#ED6C02">
                    {metrics.atRiskCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    {metrics.atRiskPercentage}% of total
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Box>

          {/* Charts and Alerts Section */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {/* Audit Control Status */}
            <Card sx={{ flex: 1, minWidth: 300, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardHeader title="Audit Control Status" />
              <CardContent>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={auditControlData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {auditControlData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
            
            {/* Audit Alerts */}
            <Card sx={{ flex: 1, minWidth: 300, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardHeader title="Audit Alerts" />
              <CardContent>
                <Box sx={{ mb: 2, p: 2, bgcolor: '#FFF3E0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Missing Financial Documents
                  </Typography>
                  <Typography variant="body2">
                    {metrics.atRiskCount} submissions need financial statements
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2, p: 2, bgcolor: '#FFEBEE', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Outside Risk Appetite
                  </Typography>
                  <Typography variant="body2">
                    {Math.max(1, Math.floor(metrics.atRiskCount / 3))} submissions in prohibited classes
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: '#E3F2FD', 
                    borderRadius: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#BBDEFB'
                    }
                  }}
                >
                  <Typography variant="body2" color="primary">
                    View all {metrics.atRiskCount} alerts...
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          {/* Recent Submissions Table */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardHeader 
              title="Recent Submissions" 
              sx={{ 
                '& .MuiCardHeader-title': { 
                  fontSize: '1.1rem', 
                  fontWeight: 600,
                  color: '#333'
                } 
              }}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Submission ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Insured Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Industry</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date Received</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSubmissions.map((submission) => (
                      <TableRow 
                        key={submission.id}
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: '#f5f5f5'
                          }
                        }}
                        onClick={() => navigate(`/submissions/${submission.id}`)}
                      >
                        <TableCell><Typography variant="body2" fontWeight="medium">{submission.id}</Typography></TableCell>
                        <TableCell>{submission.insuredName}</TableCell>
                        <TableCell>{submission.industry}</TableCell>
                        <TableCell>{submission.dateReceived}</TableCell>
                        <TableCell>
                          <Chip
                            label={submission.status}
                            color={getStatusColor(submission.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                            size="small"
                            sx={{ 
                              bgcolor: getStatusBgColor(submission.status),
                              color: submission.status.toLowerCase() === 'at risk' ? '#ED6C02' : '#17af55',
                              fontWeight: 'medium'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/submissions/${submission.id}`);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </div>
  );
};

export default Dashboard;