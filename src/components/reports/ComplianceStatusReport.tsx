// src/components/reports/ComplianceStatusReport.tsx
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip
} from '@mui/material';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ComplianceStatusReportProps {
  submissions: any[];
}

const ComplianceStatusReport: React.FC<ComplianceStatusReportProps> = ({ submissions }) => {
  // Calculate compliance statistics
  const stats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return {
        totalCount: 0,
        compliantCount: 0,
        atRiskCount: 0,
        nonCompliantCount: 0,
        complianceRate: 0,
        topIssues: []
      };
    }
    
    const totalCount = submissions.length;
    const compliantCount = submissions.filter(sub => 
      (sub.status || '').toLowerCase() === 'compliant').length;
    const atRiskCount = submissions.filter(sub => 
      (sub.status || '').toLowerCase() === 'at risk').length;
    const nonCompliantCount = submissions.filter(sub => 
      (sub.status || '').toLowerCase() === 'non-compliant').length;
    const complianceRate = Math.round((compliantCount / totalCount) * 100);
    
    // Extract and count compliance issues
    const issues: Record<string, number> = {};
    submissions.forEach(sub => {
      if (sub.complianceChecks && Array.isArray(sub.complianceChecks)) {
        sub.complianceChecks.forEach((check: any) => {
          if ((check.status || '').toLowerCase() !== 'compliant') {
            const category = check.category || 'Unknown';
            issues[category] = (issues[category] || 0) + 1;
          }
        });
      }
    });
    
    // Convert to array and sort
    const topIssues = Object.entries(issues)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 issues
    
    return {
      totalCount,
      compliantCount,
      atRiskCount,
      nonCompliantCount,
      complianceRate,
      topIssues
    };
  }, [submissions]);
  
  // Status distribution data for pie chart
  const statusData = [
    { name: 'Compliant', value: stats.compliantCount, color: '#4CAF50' },
    { name: 'At Risk', value: stats.atRiskCount, color: '#FF9800' },
    { name: 'Non-Compliant', value: stats.nonCompliantCount, color: '#F44336' }
  ];
  
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Compliance Status Dashboard
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {stats.totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#E8F5E9' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Compliance Rate
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="#2E7D32">
                {stats.complianceRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#FFF3E0' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                At Risk
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="#ED6C02">
                {stats.atRiskCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#FFEBEE' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Non-Compliant
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="#D32F2F">
                {stats.nonCompliantCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Compliance Status Distribution" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} submissions`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top Compliance Issues" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                {stats.topIssues.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.topIssues}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No compliance issues found
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Compliance Details Table */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Compliance Issues Breakdown" />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {stats.topIssues.map((issue, index) => (
                  <Chip
                    key={index}
                    label={`${issue.name}: ${issue.value}`}
                    color={index === 0 ? 'error' : index === 1 ? 'warning' : 'default'}
                    variant="outlined"
                  />
                ))}
                {stats.topIssues.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No compliance issues to display
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default ComplianceStatusReport;