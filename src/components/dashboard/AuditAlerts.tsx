// src/components/dashboard/AuditAlerts.tsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  styled
} from '@mui/material';

// Define styled components for alert cards
const AlertCard = styled(Card)(({ theme, bgcolor }: { theme?: any, bgcolor: string }) => ({
  marginBottom: '16px',
  backgroundColor: bgcolor,
  '&:last-child': {
    marginBottom: 0
  }
}));

// Alert data interface
interface AlertItem {
  title: string;
  description: string;
  color: string;
}

// Props for the AuditAlerts component
interface AuditAlertsProps {
  alerts: AlertItem[];
  totalAlerts: number;
  onViewAllClick?: () => void;
}

const AuditAlerts: React.FC<AuditAlertsProps> = ({ 
  alerts, 
  totalAlerts, 
  onViewAllClick 
}) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Audit Alerts
      </Typography>
      
      <Box sx={{ my: 2 }}>
        {alerts.map((alert, index) => (
          <AlertCard key={index} bgcolor={alert.color}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                {alert.title}
              </Typography>
              <Typography variant="body1">
                {alert.description}
              </Typography>
            </CardContent>
          </AlertCard>
        ))}
      </Box>
      
      {totalAlerts > alerts.length && (
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: '#e3f2fd', 
            borderRadius: 1, 
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onClick={onViewAllClick}
        >
          <Typography variant="body1" color="primary">
            View all {totalAlerts} alerts...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AuditAlerts;