// src/components/dashboard/AuditAlerts.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stack
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Submission, SubmissionDetail, Document, Industry } from '../../types';

// Interface for audit alert
interface AuditAlert {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: 'warning' | 'error' | 'info';
  filter: (submission: Submission | SubmissionDetail) => boolean;
}

const AuditAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { submissions } = useSelector((state: RootState) => state.submissions);
  const [alerts, setAlerts] = useState<AuditAlert[]>([]);
  
  // Define alerts with filters
  const defineAlerts = useCallback(() => {
    const alertDefinitions: AuditAlert[] = [
      {
        id: 'missing-financial',
        title: 'Missing Financial Documents',
        description: 'submissions need financial statements',
        severity: 'warning',
        count: 0,
        filter: (sub) => {
          // Check if financial statements are missing
          // Use type guard to check if this is a SubmissionDetail with documents
          const hasDocuments = 'documents' in sub && Array.isArray(sub.documents);
          
          if (!hasDocuments) {
            // If it doesn't have documents property, assume it's missing financials
            return true;
          }
          
          // Now TypeScript knows sub.documents exists and is an array
          return !(sub.documents?.some((doc: Document) => 
            doc.type?.toLowerCase().includes('financial') || 
            doc.name?.toLowerCase().includes('financial')
          ) ?? false);
        }
      },
      {
        id: 'prohibited-class',
        title: 'Outside Risk Appetite',
        description: 'submissions in prohibited classes',
        severity: 'error',
        count: 0,
        filter: (sub) => {
          // Check for prohibited industry codes
          const prohibitedCodes = ['6531', '7371', '3579']; 
          const industryCode = (sub.insured?.industry as Industry)?.code || '';
          return prohibitedCodes.includes(industryCode);
        }
      },
      // Additional alerts could be added here
    ];
    
    return alertDefinitions;
  }, []);
  
  // Process submissions to count alerts
  useEffect(() => {
    const processAlerts = () => {
      const alertDefs = defineAlerts();
      
      // Count submissions matching each alert filter
      const processedAlerts = alertDefs.map(alert => {
        const matchingSubmissions = submissions.filter(alert.filter);
        return {
          ...alert,
          count: matchingSubmissions.length
        };
      });
      
      // Only show alerts with matches
      const activeAlerts = processedAlerts.filter(alert => alert.count > 0);
      setAlerts(activeAlerts);
    };
    
    if (submissions.length > 0) {
      processAlerts();
    }
  }, [submissions, defineAlerts]);
  
  // Handle click on an alert
  const handleAlertClick = (alertId: string) => {
    // Navigate to submissions page with appropriate filter
    if (alertId === 'missing-financial') {
      navigate('/submissions?filter=missing-financials');
    } else if (alertId === 'prohibited-class') {
      navigate('/submissions?filter=prohibited-class');
    } else {
      navigate('/submissions');
    }
  };
  
  // Handle "View all" click
  const handleViewAll = () => {
    navigate('/alerts');
  };
  
  // Get background color based on severity
  const getBackgroundColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return '#FEECF0'; // Light red
      case 'warning':
        return '#FEF6E6'; // Light orange/beige
      case 'info':
        return '#E6F7FF'; // Light blue
      default:
        return '#F5F5F5'; // Light gray
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
        Audit Alerts
      </Typography>
      
      <Stack spacing={2}>
        {alerts.map((alert) => (
          <Paper 
            key={alert.id}
            sx={{ 
              p: 3, 
              backgroundColor: getBackgroundColor(alert.severity),
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 2
              }
            }}
            onClick={() => handleAlertClick(alert.id)}
          >
            <Typography variant="h5" component="h3" sx={{ fontWeight: 500, mb: 1 }}>
              {alert.title}
            </Typography>
            <Typography variant="body1">
              {alert.count} {alert.description}
            </Typography>
          </Paper>
        ))}
        
        {alerts.length > 0 && (
          <Paper
            sx={{
              p: 3,
              backgroundColor: '#E6F4FF', // Light blue
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 2
              }
            }}
            onClick={handleViewAll}
          >
            <Typography 
              variant="body1" 
              color="primary"
              sx={{ fontWeight: 500 }}
            >
              View all {alerts.length + 5} alerts...
            </Typography>
          </Paper>
        )}
        
        {alerts.length === 0 && (
          <Paper sx={{ p: 3, backgroundColor: '#F5F5F5' }}>
            <Typography variant="body1" align="center">
              No active alerts
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};

export default AuditAlerts;