// src/components/audit/AuditQuestionCard.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Chip, 
  Button, 
  List, 
  ListItem, 
  ListItemText 
} from '@mui/material';
import { 
  Assessment as AssessmentIcon,
  ListAlt as ListAltIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  AuditQuestion, 
  ComplianceStatus 
} from '../../types/auditCompliance';
import ComplianceStatusPieChart from './ComplianceStatusPieChart';
import AuditQuestionDetail from './AuditQuestionDetail';

interface AuditQuestionCardProps {
  question: AuditQuestion;
  metrics?: Record<ComplianceStatus, number>;
  isDemoMode?: boolean;
}

const AuditQuestionCard: React.FC<AuditQuestionCardProps> = ({ 
  question, 
  metrics = { 'compliant': 0, 'at-risk': 0, 'non-compliant': 0, 'not-evaluated': 0 },
  isDemoMode = false
}) => {
  const [showDetail, setShowDetail] = useState(false);

  // Calculate total submissions
  const totalSubmissions = Object.values(metrics).reduce((sum, count) => sum + count, 0);
  
  // Calculate percentage for each status
  const percentage: Record<ComplianceStatus, number> = {} as any;
  Object.entries(metrics).forEach(([status, count]) => {
    percentage[status as ComplianceStatus] = totalSubmissions > 0 
      ? Math.round((count / totalSubmissions) * 100) 
      : 0;
  });

  return (
    <>
      {!showDetail ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              {question.text}
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {question.description}
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Data Points
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="textSecondary">
                    Structured Data
                  </Typography>
                  <List dense>
                    {question.structuredDataInputs.slice(0, 3).map((input, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText primary={input} />
                      </ListItem>
                    ))}
                    {question.structuredDataInputs.length > 3 && (
                      <ListItem disablePadding>
                        <ListItemText 
                          primary={`+${question.structuredDataInputs.length - 3} more...`} 
                          primaryTypographyProps={{ variant: 'caption', color: 'textSecondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="textSecondary">
                    Unstructured Data
                  </Typography>
                  <List dense>
                    {question.unstructuredDataInputs.slice(0, 3).map((input, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText primary={input} />
                      </ListItem>
                    ))}
                    {question.unstructuredDataInputs.length > 3 && (
                      <ListItem disablePadding>
                        <ListItemText 
                          primary={`+${question.unstructuredDataInputs.length - 3} more...`} 
                          primaryTypographyProps={{ variant: 'caption', color: 'textSecondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <AssessmentIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Rule Categories
              </Typography>
              
              <Box>
                {question.relevantRuleCategories.map((category) => (
                  <Chip 
                    key={category} 
                    label={category} 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                ))}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" gutterBottom align="center">
                Compliance Status Distribution
              </Typography>
              
              <Box sx={{ height: 200, flexGrow: 1 }}>
                <ComplianceStatusPieChart 
                  data={metrics} 
                  title={`Submissions: ${totalSubmissions}`}
                  showLegend={true}
                />
              </Box>
              
              <Grid container spacing={1} sx={{ mt: 2 }}>
                {Object.entries(percentage).map(([status, pct]) => (
                  <Grid item xs={6} key={status}>
                    <Paper
                      variant="outlined"
                      sx={{ 
                        p: 1, 
                        textAlign: 'center',
                        bgcolor: 
                          status === 'compliant' ? 'success.light' :
                          status === 'at-risk' ? 'warning.light' :
                          status === 'non-compliant' ? 'error.light' :
                          'grey.300'  
                      }}
                    >
                      <Typography variant="h6">{pct}%</Typography>
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                        {status.replace(/-/g, ' ')}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<ListAltIcon />}
                sx={{ mt: 2 }}
                onClick={() => setShowDetail(true)}
                disabled={totalSubmissions === 0}
              >
                View Affected Submissions
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <AuditQuestionDetail 
          question={question} 
          metrics={metrics}
          onBack={() => setShowDetail(false)}
          isDemoMode={isDemoMode}
        />
      )}
    </>
  );
};

export default AuditQuestionCard;