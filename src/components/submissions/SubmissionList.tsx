// src/components/submissions/SubmissionList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Toolbar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
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
  const location = useLocation();
  const { submissions, loading, error } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredSubmissions, setFilteredSubmissions] = useState(submissions);

  // Parse query parameters for filters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get('status');
    
    if (statusParam) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter('all');
    }
  }, [location.search]);

  // Load submissions data (we've already loaded this in Dashboard, so we're only reloading if needed)
  useEffect(() => {
    // Only load if we don't already have submissions
    if (submissions.length === 0) {
      const loadSubmissions = async () => {
        dispatch(fetchSubmissionsStart());
        
        try {
          const data = await apiService.getSubmissions();
          dispatch(fetchSubmissionsSuccess(data));
        } catch (err) {
          console.error('Error loading submissions:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to load submissions';
          dispatch(fetchSubmissionsFailure(errorMessage));
        }
      };
      
      loadSubmissions();
    }
  }, [dispatch, isDemoMode, submissions.length]);

  // Apply filters to submissions
  useEffect(() => {
    let result = [...submissions];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(sub => {
        const subStatus = sub.status.toLowerCase();
        const filter = statusFilter.toLowerCase();
        
        // Handle special case for "At Risk" which might be stored as "Requires Attention"
        if (filter === 'at risk') {
          return subStatus === 'at risk' || subStatus.includes('attention');
        }
        
        return subStatus.includes(filter.toLowerCase());
      });
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(sub => 
        (sub.submissionId || '').toLowerCase().includes(term) ||
        (sub.insured?.name || '').toLowerCase().includes(term) ||
        (sub.insured?.industry?.description || '').toLowerCase().includes(term) ||
        (sub.broker?.name || '').toLowerCase().includes(term)
      );
    }
    
    setFilteredSubmissions(result);
  }, [submissions, statusFilter, searchTerm]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    navigate('/submissions');
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

  return (
    <Box my={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Insurance Submissions {statusFilter !== 'all' && `- ${statusFilter}`}
        </Typography>
      </Box>
      
      <ModeSwitcher />
      
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
          {/* Filters Toolbar */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Toolbar disableGutters sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                label="Search"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: '200px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear search"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  // Update URL with status filter
                  if (e.target.value === 'all') {
                    navigate('/submissions');
                  } else {
                    navigate(`/submissions?status=${e.target.value}`);
                  }
                }}
                variant="outlined"
                size="small"
                sx={{ minWidth: '150px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListIcon />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="Compliant">Compliant</MenuItem>
                <MenuItem value="At Risk">At Risk</MenuItem>
                <MenuItem value="Non-Compliant">Non-Compliant</MenuItem>
              </TextField>
              
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
                disabled={statusFilter === 'all' && !searchTerm}
              >
                Clear Filters
              </Button>
            </Toolbar>
          </Paper>
          
          {/* Submissions Table */}
          <TableContainer component={Paper}>
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
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <TableRow 
                      key={submission.submissionId}
                      hover
                      onClick={() => navigate(`/submissions/${submission.submissionId}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{submission.submissionId}</TableCell>
                      <TableCell>{submission.insured?.name}</TableCell>
                      <TableCell>{submission.insured?.industry?.description}</TableCell>
                      <TableCell>{formatDate(submission.timestamp)}</TableCell>
                      <TableCell>{getStatusChip(submission.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box p={3}>
                        <Typography variant="body1">
                          No submissions match the current filters
                        </Typography>
                        {(statusFilter !== 'all' || searchTerm) && (
                          <Button 
                            variant="text" 
                            color="primary" 
                            onClick={handleClearFilters}
                            sx={{ mt: 1 }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default SubmissionList;