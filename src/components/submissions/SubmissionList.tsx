// src/components/submissions/SubmissionList.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  TableSortLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { 
  fetchSubmissionsStart, 
  fetchSubmissionsSuccess, 
  fetchSubmissionsFailure,
  clearSelectedSubmission
} from '../../store/slices/submissionSlice';
import apiService from '../../services/api/apiService';
import useModeSwitching from '../../hooks/useModeSwitching';
import { Submission, Industry } from '../../types';

// Define type for sort direction
type Order = 'asc' | 'desc';

// Define interfaces for sort configuration
interface HeadCell {
  id: string;
  label: string;
  sortable: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

const SubmissionList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { submissions, loading, error } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode } = useModeSwitching('SubmissionList');
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  
  // State for sorting
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<string>('timestamp');

  // Define sortable columns - Added insured.industry.code column
  const headCells: readonly HeadCell[] = [
    { id: 'submissionId', label: 'Submission ID', sortable: true },
    { id: 'insured.name', label: 'Insured Name', sortable: true },
    { id: 'insured.industry.code', label: 'Industry Code', sortable: true, width: '120px' },
    { id: 'insured.industry.description', label: 'Industry', sortable: true },
    { id: 'timestamp', label: 'Date Received', sortable: true },
    { id: 'status', label: 'Status', sortable: true },
  ];

  // Parse query parameters for filters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get('status');
    
    if (statusParam) {
      // Set the status filter based on URL parameter
      setStatusFilter(statusParam);
      console.log(`Setting status filter to: ${statusParam} from URL`);
    } else {
      setStatusFilter('all');
    }
  }, [location.search]);

  // Load submissions data with mode-aware logic
  useEffect(() => {
    // Clear any previously selected submission to prevent context confusion
    dispatch(clearSelectedSubmission());
    
    // Function to load submissions
    const loadSubmissions = async () => {
      dispatch(fetchSubmissionsStart());
      
      try {
        console.log(`SubmissionList - Loading submissions in ${isDemoMode ? 'DEMO' : 'LIVE'} mode`);
        const data = await apiService.getSubmissions();
        
        if (data.length === 0 && isDemoMode) {
          throw new Error('No submissions returned from demo data');
        }
        
        dispatch(fetchSubmissionsSuccess(data));
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.error('Error loading submissions:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load submissions';
        dispatch(fetchSubmissionsFailure(errorMessage));
        
        // Retry logic for demo mode
        if (isDemoMode && retryCount < 3) {
          console.log(`SubmissionList - Retry attempt ${retryCount + 1}/3`);
          setRetryCount(prev => prev + 1);
          
          // Wait a moment before retrying
          setTimeout(() => {
            loadSubmissions();
          }, 1000);
        }
      }
    };
    
    // Load data if needed (empty or explicitly in loading state)
    if (submissions.length === 0 || loading) {
      loadSubmissions();
    }
  }, [dispatch, isDemoMode, submissions.length, loading, retryCount]);

  // Helper function to safely get nested property values for sorting
  const getNestedValue = useCallback((obj: any, path: string) => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) return null;
      result = result[key];
    }
    
    return result;
  }, []);

  // Comparator function for sorting
  const descendingComparator = useCallback((a: any, b: any, orderBy: string) => {
    const aValue = getNestedValue(a, orderBy);
    const bValue = getNestedValue(b, orderBy);
    
    // Handle null/undefined values
    if (bValue === null || bValue === undefined) return -1;
    if (aValue === null || aValue === undefined) return 1;
    
    // Handle dates
    if (orderBy === 'timestamp') {
      return new Date(bValue).getTime() - new Date(aValue).getTime();
    }
    
    // Handle strings case-insensitively
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return bValue.toLowerCase().localeCompare(aValue.toLowerCase());
    }
    
    // Handle other types
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }, [getNestedValue]);

  // Get comparator based on sort direction
  const getComparator = useCallback((order: Order, orderBy: string): (a: any, b: any) => number => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }, [descendingComparator]);

  // Stable sort function
  const stableSort = useCallback(<T,>(array: readonly T[], comparator: (a: T, b: T) => number) => {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }, []);

  // Apply filters and sorting to submissions
  useEffect(() => {
    if (submissions.length === 0) {
      setFilteredSubmissions([]);
      return;
    }
    
    console.log(`Applying filters: Status=${statusFilter}, Search=${searchTerm}`);
    console.log(`Total submissions before filtering: ${submissions.length}`);
    
    let result = [...submissions];
    
    // Apply status filter
    if (statusFilter.toLowerCase() !== 'all') {
      console.log(`Filtering by status: ${statusFilter}`);
      
      result = result.filter(sub => {
        const subStatus = sub.status || '';
        return subStatus === statusFilter;
      });
      
      console.log(`Submissions after status filter: ${result.length}`);
    }
    
    // Apply search term - Updated to include industry code in search
    if (searchTerm) {
      console.log(`Searching for: ${searchTerm}`);
      
      const term = searchTerm.toLowerCase();
      result = result.filter(sub => {
        // Type-safe access with proper type assertions
        const industryCode = sub.insured?.industry && 
          (sub.insured.industry as Industry).code !== undefined ? 
          (sub.insured.industry as Industry).code : '';
        
        const industryDesc = sub.insured?.industry?.description || '';
        
        return (
          (sub.submissionId || '').toLowerCase().includes(term) ||
          (sub.insured?.name || '').toLowerCase().includes(term) ||
          (industryCode || '').toLowerCase().includes(term) || // Fixed industry code access
          industryDesc.toLowerCase().includes(term) ||
          (sub.broker?.name || '').toLowerCase().includes(term)
        );
      });
      
      console.log(`Submissions after search filter: ${result.length}`);
    }
    
    // Apply sorting
    result = stableSort(result, getComparator(order, orderBy));
    console.log(`Final filtered submissions: ${result.length}`);
    
    setFilteredSubmissions(result);
  }, [submissions, statusFilter, searchTerm, order, orderBy, stableSort, getComparator]);

  // Handle sort request
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    navigate('/submissions');
  };

  // Handle row click (simplified and more reliable)
  const handleRowClick = (submissionId: string) => {
    if (!submissionId) {
      console.error('Invalid submission ID');
      return;
    }
    
    // Clear selected submission before navigating
    dispatch(clearSelectedSubmission());
    
    // Use the navigate function directly
    navigate(`/submissions/${submissionId}`);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    dispatch(fetchSubmissionsStart());
    
    try {
      const data = await apiService.getSubmissions();
      dispatch(fetchSubmissionsSuccess(data));
    } catch (err) {
      console.error('Error refreshing submissions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh submissions';
      dispatch(fetchSubmissionsFailure(errorMessage));
    }
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

  return (
    <Box my={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Insurance Submissions {statusFilter !== 'all' && `- ${statusFilter}`}
          {isDemoMode && <Chip label="Demo Mode" size="small" color="default" sx={{ ml: 2 }} />}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
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
              const newStatus = e.target.value;
              setStatusFilter(newStatus);
              
              // Update URL with status filter
              if (newStatus === 'all') {
                navigate('/submissions');
              } else {
                navigate(`/submissions?status=${newStatus}`);
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
      
      {/* Display loading indicator when loading */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Submissions Table with Sortable Columns */}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.align || 'left'}
                    width={headCell.width}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => {
                  // Safe access to industry code with type assertion
                  const industryCode = submission.insured?.industry && 
                    (submission.insured.industry as Industry).code;
                  
                  return (
                    <TableRow 
                      key={submission.submissionId}
                      hover
                      onClick={() => handleRowClick(submission.submissionId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{submission.submissionId}</TableCell>
                      <TableCell>{submission.insured?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {industryCode ? (
                          <Chip 
                            label={industryCode} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                          />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{submission.insured?.industry?.description || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(submission.timestamp)}</TableCell>
                      <TableCell>{getStatusChip(submission.status)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box p={3}>
                      <Typography variant="body1">
                        No submissions match the current filters
                      </Typography>
                      {(statusFilter !== 'all' || searchTerm) ? (
                        <Button 
                          variant="text" 
                          color="primary" 
                          onClick={handleClearFilters}
                          sx={{ mt: 1 }}
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          onClick={handleRefresh}
                          startIcon={<RefreshIcon />}
                          sx={{ mt: 2 }}
                        >
                          Refresh Data
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SubmissionList;