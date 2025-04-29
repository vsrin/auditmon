// src/components/audit/ComplianceStatusPieChart.tsx
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { Typography, Box } from '@mui/material';
import { ComplianceStatus } from '../../types/auditCompliance';

interface ComplianceStatusPieChartProps {
  data: Record<ComplianceStatus, number>;
  title?: string;
  showLegend?: boolean;
}

const ComplianceStatusPieChart: React.FC<ComplianceStatusPieChartProps> = ({ 
  data, 
  title,
  showLegend = false
}) => {
  // Define colors for each status
  const COLORS = {
    'compliant': '#4caf50',
    'at-risk': '#ff9800',
    'non-compliant': '#f44336',
    'not-evaluated': '#9e9e9e'
  };
  
  // Convert data to array format for recharts
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name: name.replace(/-/g, ' '),
    value
  }));
  
  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    const percentage = ((value / total) * 100).toFixed(1);
    return [`${value} (${percentage}%)`, name];
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {title && (
        <Typography 
          variant="body2" 
          color="textSecondary" 
          align="center"
          sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        >
          {title}
        </Typography>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={total > 0 ? 40 : 0}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name.replace(/\s/g, '-') as ComplianceStatus] || '#9e9e9e'} 
              />
            ))}
          </Pie>
          <Tooltip formatter={tooltipFormatter} />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              align="center"
              layout="horizontal"
              iconType="circle"
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
      {total === 0 && (
        <Typography 
          variant="body2" 
          color="textSecondary" 
          align="center"
          sx={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)' }}
        >
          No data available
        </Typography>
      )}
    </Box>
  );
};

export default ComplianceStatusPieChart;