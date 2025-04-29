// src/components/audit/ComplianceTrendChart.tsx
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Typography, Box } from '@mui/material';
import { ComplianceStatus } from '../../types/auditCompliance';

// Mock data structure for trends
interface TrendDataPoint {
  date: string;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
}

interface ComplianceTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

const ComplianceTrendChart: React.FC<ComplianceTrendChartProps> = ({ 
  data, 
  title 
}) => {
  // Define colors for each status
  const COLORS = {
    'compliant': '#4caf50',
    'atRisk': '#ff9800',
    'nonCompliant': '#f44336'
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {title && (
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="compliant"
            name="Compliant"
            stroke={COLORS.compliant}
            activeDot={{ r: 8 }}
          />
          <Line 
            type="monotone" 
            dataKey="atRisk" 
            name="At Risk"
            stroke={COLORS.atRisk} 
          />
          <Line 
            type="monotone" 
            dataKey="nonCompliant" 
            name="Non-Compliant"
            stroke={COLORS.nonCompliant} 
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Export a version with mock data for demo purposes
export const ComplianceTrendChartWithMockData: React.FC<{ 
  title?: string, 
  questionId?: string 
}> = ({ title, questionId }) => {
  // Generate some mock data based on questionId for variety
  const seed = questionId ? questionId.charCodeAt(0) : 0;
  
  const generateMockData = (): TrendDataPoint[] => {
    const today = new Date();
    const data: TrendDataPoint[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i * 7); // Weekly data
      
      // Use seed to vary the data by question
      const seedFactor = (seed % 10) / 10;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        compliant: Math.floor(50 + Math.sin(i / 2) * 20 + seedFactor * 10),
        atRisk: Math.floor(20 + Math.cos(i / 3) * 10 + seedFactor * 5),
        nonCompliant: Math.floor(10 + Math.sin(i / 4) * 5 + seedFactor * 3)
      });
    }
    
    return data;
  };

  return (
    <ComplianceTrendChart 
      data={generateMockData()} 
      title={title || 'Compliance Trend (Last 6 Weeks)'}
    />
  );
};

export default ComplianceTrendChart;