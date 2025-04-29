// src/components/audit/AuditQuestionDetail.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { 
  AuditQuestion, 
  ComplianceStatus 
} from '../../types/auditCompliance';
import { Submission, SubmissionDetail } from '../../types';
import { evaluateAuditQuestion } from '../../services/rules/ruleEvaluationService';
import apiService from '../../services/api/apiService';
import { Link } from 'react-router-dom';
import { getMockAuditComplianceStatus } from '../../services/mock/mockData';

interface AuditQuestionDetailProps {
  question: AuditQuestion;
  metrics: Record<ComplianceStatus, number>;
  onBack: () => void;
  isDemoMode?: boolean;
}

const AuditQuestionDetail: React.FC<AuditQuestionDetailProps> = ({ 
  question, 
  metrics, 
  onBack,
  isDemoMode = false
}) => {
  const [evaluatedSubmissions, setEvaluatedSubmissions] = useState<Array<{
    submission: Submission;
    status: ComplianceStatus;
    findings: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all');
  
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get all submissions
        const allSubmissions = await apiService.getSubmissions();
        
        // Limit to a reasonable number for performance
        const limitedSubmissions = allSubmissions.slice(0, 20);
        
        // For demo mode, we can just use the submissions directly
        if (isDemoMode) {
          // Pre-generate evaluation results for demo mode
          const evaluated = await Promise.all(limitedSubmissions.map(async (sub) => {
            const mockStatus = getMockAuditComplianceStatus(sub.submissionId);
            
            // Find the relevant question result
            let status: ComplianceStatus = 'not-evaluated';
            let findings = 'Not evaluated';
            
            for (const stage of mockStatus.stageResults) {
              const questionResult = stage.questionResults.find((q: any) => q.questionId === question.id);
              if (questionResult) {
                status = questionResult.status;
                findings = questionResult.findings;
                break;
              }
            }
            
            return {
              submission: sub,
              status,
              findings
            };
          }));
          
          setEvaluatedSubmissions(evaluated);
        } else {
          // Get detailed submissions for live mode
          const detailedSubmissions = await Promise.all(
            limitedSubmissions.map(async (sub) => {
              try {
                return await apiService.getSubmissionDetail(sub.submissionId);
              } catch (err) {
                console.error(`Error fetching details for submission ${sub.submissionId}:`, err);
                return null;
              }
            })
          );
          
          // Filter out null values and ensure type safety
          const validSubmissions = detailedSubmissions.filter((sub): sub is SubmissionDetail => sub !== null);
          
          // Evaluate each submission for this question
          const evaluated = await Promise.all(validSubmissions.map(async (sub) => {
            try {
              const result = await evaluateAuditQuestion(sub, question.id, isDemoMode);
              return {
                submission: sub,
                status: result.status,
                findings: result.findings
              };
            } catch (err) {
              console.error(`Error evaluating question for submission ${sub.submissionId}:`, err);
              return {
                submission: sub,
                status: 'not-evaluated' as ComplianceStatus,
                findings: 'Error evaluating compliance'
              };
            }
          }));
          
          setEvaluatedSubmissions(evaluated);
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [question.id, isDemoMode]);

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value as ComplianceStatus | 'all');
  };

  const getStatusChip = (status: ComplianceStatus) => (
    <Chip 
      label={status.replace(/-/g, ' ')}
      color={
        status === 'compliant' ? 'success' :
        status === 'at-risk' ? 'warning' :
        status === 'non-compliant' ? 'error' :
        'default'
      }
      size="small"
    />
  );

  // Filter submissions by selected status
  const filteredSubmissions = statusFilter === 'all'
    ? evaluatedSubmissions
    : evaluatedSubmissions.filter(item => item.status === statusFilter);

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={onBack} size="small" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h6">
          {question.text}
        </Typography>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">
            Submissions Affected by This Audit Question
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Filter by Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Filter by Status"
              startAdornment={<FilterListIcon sx={{ mr: 1, ml: -0.5 }} />}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="compliant">Compliant</MenuItem>
              <MenuItem value="at-risk">At Risk</MenuItem>
              <MenuItem value="non-compliant">Non-Compliant</MenuItem>
              <MenuItem value="not-evaluated">Not Evaluated</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : evaluatedSubmissions.length === 0 ? (
          <Alert severity="info">No submissions found.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Submission ID</TableCell>
                  <TableCell>Insured</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Findings</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubmissions.map((item) => (
                  <TableRow key={item.submission.submissionId}>
                    <TableCell>{item.submission.submissionId}</TableCell>
                    <TableCell>{item.submission.insured?.name || 'Unknown'}</TableCell>
                    <TableCell>{item.submission.insured?.industry?.description || 'Unknown'}</TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap style={{ maxWidth: 200 }}>
                        {item.findings}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        component={Link} 
                        to={`/submissions/${item.submission.submissionId}`}
                        size="small"
                        title="View Submission Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <Box display="flex" justifyContent="space-between">
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Back to Question Overview
        </Button>
      </Box>
    </Box>
  );
};

export default AuditQuestionDetail;