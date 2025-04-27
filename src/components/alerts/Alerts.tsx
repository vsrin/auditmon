// src/components/alerts/Alerts.tsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Sample alerts data
const allAlerts = [
  {
    title: "Missing Financial Documents",
    description: "5 submissions need financial statements",
    color: "#fff3e0", // Light orange background
    severity: "warning"
  },
  {
    title: "Outside Risk Appetite",
    description: "3 submissions in prohibited classes",
    color: "#ffebee", // Light red background
    severity: "high"
  },
  {
    title: "Incomplete Loss Runs",
    description: "2 submissions have incomplete loss history",
    color: "#fff3e0", // Light orange background
    severity: "warning"
  },
  {
    title: "Missing Underwriting Approval",
    description: "4 submissions pending supervisor review",
    color: "#e8f5e9", // Light green background
    severity: "low"
  },
  {
    title: "Document Processing Failed",
    description: "1 submission with document processing errors",
    color: "#ffebee", // Light red background
    severity: "high"
  },
  {
    title: "Expired Certificates",
    description: "2 submissions with expired certificates",
    color: "#fff3e0", // Light orange background
    severity: "warning"
  },
  {
    title: "Policy Expiration Approaching",
    description: "7 policies expire within 30 days",
    color: "#e8f5e9", // Light green background
    severity: "low"
  },
  {
    title: "Business Class Review Required",
    description: "3 submissions need business class validation",
    color: "#fff3e0", // Light orange background
    severity: "warning"
  }
];

const Alerts: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton edge="start" onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          All Audit Alerts
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {allAlerts.map((alert, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ bgcolor: alert.color }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {alert.title}
                </Typography>
                <Typography variant="body1">
                  {alert.description}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    mt: 2 
                  }}
                >
                  <Typography 
                    color="primary" 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => console.log(`View details for ${alert.title}`)}
                  >
                    View details
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Alerts;