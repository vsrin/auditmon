// src/components/reports/DocumentCompleteness.tsx
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Define interfaces for the data structures
interface DocumentTypeCount {
  name: string;
  value: number;
}

interface StatusBreakdown {
  name: string;
  value: number;
}

interface ReportsData {
  documentStatusCounts: {
    processed: number;
    pending: number;
    failed: number;
  };
  documentTypesDistribution: DocumentTypeCount[];
  // other properties might be here but we're not using them in this component
}

interface DocumentCompletenessProps {
  submissions: any[];
  reportsData?: ReportsData;
}

const DocumentCompleteness: React.FC<DocumentCompletenessProps> = ({ submissions, reportsData }) => {
  // Calculate document statistics
  const stats = useMemo(() => {
    // Use enhanced reports data if available
    if (reportsData && reportsData.documentStatusCounts && reportsData.documentTypesDistribution) {
      const totalDocuments = reportsData.documentStatusCounts.processed +
                            reportsData.documentStatusCounts.pending +
                            reportsData.documentStatusCounts.failed;
      
      // Count submissions with complete documents
      let completeSubmissions = 0;
      submissions.forEach(sub => {
        const detail = sub.documents || [];
        const allProcessed = detail.every((doc: any) => 
          (doc.status || '').toLowerCase() === 'processed');
        
        if (allProcessed && detail.length > 0) {
          completeSubmissions++;
        }
      });
      
      const completionRate = submissions.length > 0 
        ? Math.round((completeSubmissions / submissions.length) * 100) 
        : 0;
      
      // Status breakdown
      const statusBreakdown = [
        { name: 'Processed', value: reportsData.documentStatusCounts.processed },
        { name: 'Pending', value: reportsData.documentStatusCounts.pending },
        { name: 'Failed', value: reportsData.documentStatusCounts.failed }
      ];
      
      return {
        totalSubmissions: submissions.length,
        totalDocuments,
        completeSubmissions,
        completionRate,
        statusBreakdown,
        documentTypes: reportsData.documentTypesDistribution
      };
    }

    // Fall back to calculation from submissions if reports data not available
    if (!submissions || submissions.length === 0) {
      return {
        totalSubmissions: 0,
        totalDocuments: 0,
        completeSubmissions: 0,
        completionRate: 0,
        statusBreakdown: [] as StatusBreakdown[],
        documentTypes: [] as DocumentTypeCount[]
      };
    }
    
    const totalSubmissions = submissions.length;
    let totalDocuments = 0;
    let completeSubmissions = 0;
    
    // Count documents by status
    const statusCounts: Record<string, number> = {
      processed: 0,
      pending: 0,
      failed: 0
    };
    
    // Count documents by type
    const typeCounts: Record<string, number> = {};
    
    submissions.forEach(sub => {
      if (sub.documents && Array.isArray(sub.documents)) {
        totalDocuments += sub.documents.length;
        
        // Check if all documents are processed
        const allProcessed = sub.documents.every((doc: any) => 
          (doc.status || '').toLowerCase() === 'processed');
        
        if (allProcessed && sub.documents.length > 0) {
          completeSubmissions++;
        }
        
        // Count by status
        sub.documents.forEach((doc: any) => {
          const status = (doc.status || '').toLowerCase();
          statusCounts[status] = (statusCounts[status] || 0) + 1;
          
          // Count by type
          const type = doc.type || 'Unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });
    
    // Calculate completion rate
    const completionRate = totalSubmissions > 0 
      ? Math.round((completeSubmissions / totalSubmissions) * 100) 
      : 0;
    
    // Convert to arrays for charts
    const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
    
    const documentTypes = Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    return {
      totalSubmissions,
      totalDocuments,
      completeSubmissions,
      completionRate,
      statusBreakdown,
      documentTypes
    };
  }, [submissions, reportsData]);
  
  // Colors for status pie chart
  const COLORS = ['#4CAF50', '#FF9800', '#F44336'];
  
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Document Completeness Report
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Documents
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {stats.totalDocuments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#E8F5E9' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="#2E7D32">
                {stats.completionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of submissions have all docs processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Processed Documents
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="#2E7D32">
                {stats.statusBreakdown.find(item => item.name === 'Processed')?.value || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#FFF3E0' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Pending/Failed
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="#ED6C02">
                {(stats.statusBreakdown.find(item => item.name === 'Pending')?.value || 0) + 
                 (stats.statusBreakdown.find(item => item.name === 'Failed')?.value || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Document Status Distribution" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} documents`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Document Types" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                {stats.documentTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.documentTypes.slice(0, 8)} // Show top 8 for better visualization
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No document types found
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Document Types Table */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Document Types Breakdown" />
            <Divider />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document Type</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.documentTypes.map((type: DocumentTypeCount) => (
                      <TableRow key={type.name}>
                        <TableCell component="th" scope="row">
                          {type.name}
                        </TableCell>
                        <TableCell align="right">{type.value}</TableCell>
                        <TableCell align="right">
                          {stats.totalDocuments > 0 
                            ? `${((type.value / stats.totalDocuments) * 100).toFixed(1)}%` 
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {stats.documentTypes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No document types to display
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default DocumentCompleteness;