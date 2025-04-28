// src/components/dashboard/AuditAlerts.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  styled,
  Chip
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';

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
  isLive?: boolean;
}

// Props for the AuditAlerts component
interface AuditAlertsProps {
  alerts: AlertItem[];
  totalAlerts: number;
  onViewAllClick?: () => void;
}

const AuditAlerts: React.FC<AuditAlertsProps> = ({ 
  alerts: initialAlerts, 
  totalAlerts, 
  onViewAllClick 
}) => {
  const { submissions } = useSelector((state: RootState) => state.submissions);
  const { isDemoMode } = useSelector((state: RootState) => state.config);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  
  // Count submissions by status to update alerts dynamically
  useEffect(() => {
    if (!submissions || submissions.length === 0) return;
    
    // FIXED: Store and preserve the isDemoMode setting
    console.log("AuditAlerts - Current mode:", isDemoMode ? "DEMO" : "LIVE");
    
    // Get current restricted NAICS codes - use empty array if the method doesn't exist
    const restrictedNaicsCodes = ruleEngineProvider.getRestrictedNaicsCodes?.() || [];
    const isNaicsRuleActive = ruleEngineProvider.isNaicsRuleEnabled?.() !== false;
    
    console.log("Restricted NAICS codes:", restrictedNaicsCodes);
    console.log("NAICS rule active:", isNaicsRuleActive);
    
    // Count submissions with restricted NAICS codes
    const restrictedNaicsCount = isNaicsRuleActive ? submissions.filter(sub => {
      const industryCode = sub.insured?.industry?.code || '';
      return restrictedNaicsCodes.includes(industryCode);
    }).length : 0;
    
    console.log("Submissions with restricted NAICS:", restrictedNaicsCount);
    
    // Create updated alerts array
    const updatedAlerts: AlertItem[] = [...initialAlerts];
    
    // Find and update the "Missing Financial Documents" alert if it exists
    const missingFinancialIndex = updatedAlerts.findIndex(alert => 
      alert.title === "Missing Financial Documents"
    );
    
    if (missingFinancialIndex >= 0) {
      updatedAlerts[missingFinancialIndex] = {
        ...updatedAlerts[missingFinancialIndex],
        isLive: false
      };
    }
    
    // Find and update the "Outside Risk Appetite" alert if it exists
    const riskAppetiteIndex = updatedAlerts.findIndex(alert => 
      alert.title === "Outside Risk Appetite"
    );
    
    if (riskAppetiteIndex >= 0 && restrictedNaicsCount > 0) {
      updatedAlerts[riskAppetiteIndex] = {
        ...updatedAlerts[riskAppetiteIndex],
        description: `${restrictedNaicsCount} submissions in prohibited classes`,
        isLive: true
      };
    } else if (riskAppetiteIndex >= 0) {
      updatedAlerts[riskAppetiteIndex] = {
        ...updatedAlerts[riskAppetiteIndex],
        isLive: false
      };
    } else if (restrictedNaicsCount > 0) {
      // If it doesn't exist, add it
      updatedAlerts.push({
        title: "Outside Risk Appetite",
        description: `${restrictedNaicsCount} submissions in prohibited classes`,
        color: "#ffebee", // Light red background
        isLive: true
      });
    }
    
    setAlerts(updatedAlerts);
  }, [submissions, initialAlerts, isDemoMode]);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Audit Alerts {isDemoMode && "(Demo Mode)"}
      </Typography>
      
      <Box sx={{ my: 2 }}>
        {alerts.map((alert, index) => (
          <AlertCard key={index} bgcolor={alert.color}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" gutterBottom>
                  {alert.title}
                  {alert.isLive && (
                    <Chip 
                      label="Live" 
                      color="error" 
                      size="small" 
                      sx={{ ml: 1, fontSize: '0.7rem' }} 
                    />
                  )}
                </Typography>
              </Box>
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