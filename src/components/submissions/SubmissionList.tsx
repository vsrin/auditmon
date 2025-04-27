// src/components/submissions/SubmissionList.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Typography,
  Chip,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SubmissionData } from '../../types';
import { RootState } from '../../store';
import { 
  fetchSubmissionsStart, 
  fetchSubmissionsSuccess, 
  fetchSubmissionsFailure 
} from '../../store/slices/submissionSlice';
import apiService from '../../services/api/apiService';
import ModeSwitcher from '../core/ModeSwitcher';

const SubmissionList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submissions, loading, error } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionData[]>([]);
  
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
  
  // Filter submissions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSubmissions(submissions);
      return;
    }
    
    const filtered = submissions.filter(submission => 
      submission.insured.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submissionId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm]);
  
  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle row click
  const handleRowClick = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
  };
  
  // Get status chip color based on status
  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
        return 'success';
      case 'requires attention':
        return 'warning';
      case 'non-compliant':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Submissions
        </Typography>
      </Box>
      
      <ModeSwitcher />
      
      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by insured name, broker, or submission ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
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
      
      {!loading && !error && (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="submissions table">
              <TableHead>
                <TableRow>
                  <TableCell>Submission ID</TableCell>
                  <TableCell>Insured</TableCell>
                  <TableCell>Broker</TableCell>
                  <TableCell>Lines of Business</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubmissions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((submission) => (
                    <TableRow
                      key={submission.submissionId}
                      hover
                      onClick={() => handleRowClick(submission.submissionId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell component="th" scope="row">
                        {submission.submissionId}
                      </TableCell>
                      <TableCell>{submission.insured.name}</TableCell>
                      <TableCell>{submission.broker.name}</TableCell>
                      <TableCell>{submission.coverage.lines.join(', ')}</TableCell>
                      <TableCell>{formatDate(submission.timestamp)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={submission.status} 
                          color={getStatusChipColor(submission.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredSubmissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No submissions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSubmissions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </div>
  );
};

export default SubmissionList;