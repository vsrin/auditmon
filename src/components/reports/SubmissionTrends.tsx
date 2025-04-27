// src/components/reports/SubmissionTrends.tsx
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SubmissionTrendsProps {
  submissions: any[];
}

const SubmissionTrends: React.FC<SubmissionTrendsProps> = ({ submissions }) => {
  // Calculate submission statistics
  const stats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return {
        totalSubmissions: 0,
        byDate: [],
        byIndustry: [],
        byLine: []
      };
    }
    
    const totalSubmissions = submissions.length;
    
    // Group by date
    const dateMap: Record<string, number> = {};
    // Group by industry
    const industryMap: Record<string, number> = {};
    // Group by line of business
    const lineMap: Record<string, number> = {};
    
    submissions.forEach(sub => {
      // Process date
      const date = sub.timestamp ? new Date(sub.timestamp) : new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
      
      // Process industry
      const industry = sub.insured?.industry?.description || 'Unknown';
      industryMap[industry] = (industryMap[industry] || 0) + 1;
      
      // Process lines of business
      if (sub.coverage && Array.isArray(sub.coverage.lines)) {
        sub.coverage.lines.forEach((line: string) => {
          lineMap[line] = (lineMap[line] || 0) + 1;
        });
      }
    });
    
    // Convert maps to arrays for charts
    
    // Date data (last 14 days)
    const now = new Date();
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push({
        date: dateStr,
        count: dateMap[dateStr] || 0
      });
    }
    
    // Industry data
    const byIndustry = Object.entries(industryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Line of business data
    const byLine = Object.entries(lineMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    return {
      totalSubmissions,
      byDate: dates,
      byIndustry,
      byLine
    };
  }, [submissions]);
  
  // Colors for pie charts
  const COLORS = [
    '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', 
    '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#3F51B5'
  ];
  
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Submission Volume Trends
      </Typography>
      
      {/* Volume Trend Chart */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Submission Volume Trend (Last 14 Days)" />
        <Divider />
        <CardContent>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.byDate}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  name="Submissions"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
      
      {/* Industry and Line of Business Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Submissions by Industry" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                {stats.byIndustry.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byIndustry}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => 
                          name.length > 10 
                            ? `${name.substring(0, 10)}...: ${(percent * 100).toFixed(0)}%`
                            : `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {stats.byIndustry.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} submissions`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No industry data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Lines of Business" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                {stats.byLine.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.byLine}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Submissions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No line of business data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default SubmissionTrends;