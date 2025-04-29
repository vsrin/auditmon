// src/components/audit/AuditComplianceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Grid, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  LifecycleStage, 
  ComplianceStatus
} from '../../types/auditCompliance';
import { lifecycleStages } from '../../services/rules/auditQuestions';
import LifecycleStagePanel from './LifecycleStagePanel';
import ComplianceStatusPieChart from './ComplianceStatusPieChart';
import { calculateComplianceMetrics } from '../../services/rules/ruleEvaluationService';
import apiService from '../../services/api/apiService';

const AuditComplianceDashboard: React.FC = () => {
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  const [activeStage, setActiveStage] = useState<LifecycleStage>(LifecycleStage.SubmissionRiskAssessment);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stageMetrics, setStageMetrics] = useState<Record<LifecycleStage, Record<ComplianceStatus, number>>>({} as any);
  const [questionMetrics, setQuestionMetrics] = useState<Record<string, Record<ComplianceStatus, number>>>({});

  // Fetch data and calculate metrics
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // For demo mode, we can use mock metrics directly
        if (isDemoMode) {
          // Use calculateComplianceMetrics with isDemoMode=true to get mock metrics
          const metrics = await calculateComplianceMetrics([], true);
          setStageMetrics(metrics.stageMetrics);
          setQuestionMetrics(metrics.questionMetrics);
        } else {
          // For live mode, we need to get the actual submission details
          const submissions = await apiService.getSubmissions();
          
          // For each submission, get the full details
          const detailedSubmissions = await Promise.all(
            submissions.slice(0, 50).map(async (sub) => { // Limit to 50 for performance
              try {
                return await apiService.getSubmissionDetail(sub.submissionId);
              } catch (err) {
                console.error(`Error fetching details for submission ${sub.submissionId}:`, err);
                return null;
              }
            })
          );
          
          // Filter out null values and ensure type safety
          const validSubmissions = detailedSubmissions.filter((sub): sub is NonNullable<typeof sub> => sub !== null);
          
          // Calculate metrics
          const metrics = await calculateComplianceMetrics(validSubmissions, false);
          
          setStageMetrics(metrics.stageMetrics);
          setQuestionMetrics(metrics.questionMetrics);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load compliance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isDemoMode]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: LifecycleStage) => {
    setActiveStage(newValue);
  };

  // Find the active stage definition
  const activeStageDefinition = lifecycleStages.find(stage => stage.id === activeStage);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Insurance Lifecycle Audit Compliance
      </Typography>
      
      {isDemoMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are viewing demo data. Switch to Live mode to see actual compliance data.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeStage}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          {lifecycleStages.map((stage) => (
            <Tab 
              key={stage.id} 
              label={stage.name} 
              value={stage.id} 
            />
          ))}
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {activeStageDefinition?.name} - Compliance Overview
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {activeStageDefinition?.description}
                </Typography>
                
                <Box sx={{ height: 250, mt: 2 }}>
                  {stageMetrics[activeStage] && (
                    <ComplianceStatusPieChart 
                      data={stageMetrics[activeStage]} 
                      title="Overall Stage Compliance"
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Key Audit Metrics
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {Object.entries(stageMetrics[activeStage] || {}).map(([status, count]) => (
                    <Grid item xs={6} sm={3} key={status}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          bgcolor: 
                            status === 'compliant' ? 'success.light' :
                            status === 'at-risk' ? 'warning.light' :
                            status === 'non-compliant' ? 'error.light' :
                            'grey.300'
                        }}
                      >
                        <Typography variant="h4">{count}</Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {status.replace(/-/g, ' ')}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    This dashboard shows compliance status across all audit questions in the 
                    {' '}{activeStageDefinition?.name} stage. Click on any audit question 
                    below to see detailed compliance information.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {activeStageDefinition && (
            <LifecycleStagePanel 
              stage={activeStageDefinition} 
              questionMetrics={questionMetrics}
              isDemoMode={isDemoMode}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default AuditComplianceDashboard;