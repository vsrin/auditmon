// src/components/audit/LifecycleStagePanel.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  Grid,
  Chip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { 
  LifecycleStageDefinition,
  ComplianceStatus
} from '../../types/auditCompliance';
import AuditQuestionCard from './AuditQuestionCard';

interface LifecycleStagePanelProps {
  stage: LifecycleStageDefinition;
  questionMetrics: Record<string, Record<ComplianceStatus, number>>;
  isDemoMode?: boolean;
}

const LifecycleStagePanel: React.FC<LifecycleStagePanelProps> = ({ 
  stage, 
  questionMetrics,
  isDemoMode = false
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const handleQuestionClick = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  // Calculate overall status for a question
  const getQuestionStatus = (questionId: string): ComplianceStatus => {
    const metrics = questionMetrics[questionId];
    if (!metrics) return 'not-evaluated';
    
    if (metrics['non-compliant'] > 0) return 'non-compliant';
    if (metrics['at-risk'] > 0) return 'at-risk';
    if (metrics['compliant'] > 0) return 'compliant';
    return 'not-evaluated';
  };

  // Calculate count of questions by status
  const statusCounts: Record<ComplianceStatus, number> = {
    'compliant': 0,
    'at-risk': 0,
    'non-compliant': 0,
    'not-evaluated': 0
  };

  stage.auditQuestions.forEach(question => {
    const status = getQuestionStatus(question.id);
    statusCounts[status]++;
  });

  return (
    <Paper sx={{ p: 0, overflow: 'hidden' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
        <Typography variant="h6">
          Audit Questions - {stage.name}
        </Typography>
      </Box>
      
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Grid item key={status}>
              <Chip 
                label={`${count} ${status.replace(/-/g, ' ')}`}
                color={
                  status === 'compliant' ? 'success' :
                  status === 'at-risk' ? 'warning' :
                  status === 'non-compliant' ? 'error' :
                  'default'
                }
                variant="outlined"
                sx={{ mr: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Divider />
      
      <List>
        {stage.auditQuestions.map((question) => (
          <React.Fragment key={question.id}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleQuestionClick(question.id)}>
                <ListItemText
                  primary={question.text}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Chip 
                        size="small"
                        label={getQuestionStatus(question.id).replace(/-/g, ' ')}
                        color={
                          getQuestionStatus(question.id) === 'compliant' ? 'success' :
                          getQuestionStatus(question.id) === 'at-risk' ? 'warning' :
                          getQuestionStatus(question.id) === 'non-compliant' ? 'error' :
                          'default'
                        }
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {question.capturePoint}
                      </Typography>
                    </Box>
                  }
                />
                {expandedQuestion === question.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={expandedQuestion === question.id} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <AuditQuestionCard 
                  question={question} 
                  metrics={questionMetrics[question.id]}
                  isDemoMode={isDemoMode}
                />
              </Box>
            </Collapse>
            
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default LifecycleStagePanel;