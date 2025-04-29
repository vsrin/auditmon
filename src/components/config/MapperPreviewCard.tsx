// src/components/config/MapperPreviewCard.tsx
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Link
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

interface PreviewCardProps {
  previewData: any;
  requiredFields: string[];
  validationResult?: {
    valid: boolean;
    missingRequired: string[];
    incorrectTypes: Array<{field: string, expectedType: string, actualType: string}>;
  };
}

/**
 * A component to preview mapped data in a more user-friendly format
 */
const MapperPreviewCard: React.FC<PreviewCardProps> = ({
  previewData,
  requiredFields,
  validationResult
}) => {
  if (!previewData) {
    return (
      <Paper sx={{ p: 2, mt: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No preview data available. Map fields to see a preview.
        </Typography>
      </Paper>
    );
  }

  // Helper to check if a field exists in the preview data
  const hasField = (fieldPath: string): boolean => {
    const parts = fieldPath.split('.');
    let current = previewData;
    
    for (const part of parts) {
      if (current === undefined || current === null) return false;
      if (typeof current !== 'object') return false;
      current = current[part];
    }
    
    return current !== undefined && current !== null;
  };

  // Helper to get nested value by path
  const getValueByPath = (obj: any, path: string): any => {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    
    return current;
  };

  // Format a value for display
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      return '{object}';
    }
    return String(value);
  };

  // Simplified flat structure for main information
  const renderMainInfo = () => {
    return (
      <Grid container spacing={2}>
        {/* Submission ID */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Submission ID
              </Typography>
              <Typography variant="body1">
                {previewData.submissionId || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Status */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Status
              </Typography>
              <Box display="flex" alignItems="center">
                <Chip 
                  size="small"
                  label={previewData.status || 'N/A'} 
                  color={
                    previewData.status === 'Compliant' ? 'success' :
                    previewData.status === 'At Risk' ? 'warning' :
                    previewData.status === 'Non-Compliant' ? 'error' :
                    'default'
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Insured */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Insured
              </Typography>
              <Typography variant="body1">
                {previewData.insured?.name || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Broker */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Broker
              </Typography>
              <Typography variant="body1">
                {previewData.broker?.name || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Validation status for the mapping
  const renderValidationStatus = () => {
    if (!validationResult) {
      // Perform a basic check if validation result wasn't provided
      const missingRequired = requiredFields.filter(field => !hasField(field));
      const isValid = missingRequired.length === 0;
      
      return (
        <Box display="flex" alignItems="center" mb={2} mt={2}>
          {isValid ? (
            <>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="success.main">
                All required fields are mapped
              </Typography>
            </>
          ) : (
            <>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="body2" color="warning.main">
                {missingRequired.length} required field(s) missing
              </Typography>
            </>
          )}
        </Box>
      );
    }

    return (
      <Box mb={2} mt={2}>
        <Box display="flex" alignItems="center">
          {validationResult.valid ? (
            <>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="success.main">
                Mapping validation successful
              </Typography>
            </>
          ) : (
            <>
              <ErrorIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body2" color="error.main">
                Mapping validation failed
              </Typography>
            </>
          )}
        </Box>
        
        {!validationResult.valid && (
          <Box mt={1} ml={4}>
            {validationResult.missingRequired.length > 0 && (
              <Typography variant="body2">
                Missing required fields: {validationResult.missingRequired.join(', ')}
              </Typography>
            )}
            
            {validationResult.incorrectTypes.length > 0 && (
              <Typography variant="body2">
                Type mismatches: {
                  validationResult.incorrectTypes.map(item => 
                    `${item.field} (expected: ${item.expectedType}, got: ${item.actualType})`
                  ).join(', ')
                }
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" gutterBottom>
          Mapped Data Preview
        </Typography>
        <Link href="#" onClick={(e) => {
          e.preventDefault();
          const dataStr = JSON.stringify(previewData, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'mapping-preview.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}>
          Download JSON
        </Link>
      </Box>
      
      {renderValidationStatus()}
      {renderMainInfo()}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Complete Data Structure
      </Typography>
      
      <Box 
        component="pre" 
        sx={{ 
          p: 2, 
          bgcolor: 'rgba(0, 0, 0, 0.04)', 
          borderRadius: 1, 
          maxHeight: '200px', 
          overflow: 'auto',
          fontSize: '0.75rem'
        }}
      >
        {JSON.stringify(previewData, null, 2)}
      </Box>
    </Paper>
  );
};

export default MapperPreviewCard;