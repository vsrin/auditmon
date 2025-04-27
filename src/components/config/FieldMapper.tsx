// src/components/config/FieldMapper.tsx
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface FieldMapperProps {
  appFields: any;
  apiFields: string[];
  currentMapping: any;
  onChange: (appField: string, apiField: string) => void;
  onComplexChange: (appField: string, fieldMapping: any) => void;
  getValueFromPath: (path: string) => any;
  parentPath?: string;
}

const FieldMapper: React.FC<FieldMapperProps> = ({
  appFields,
  apiFields,
  currentMapping,
  onChange,
  onComplexChange,
  getValueFromPath,
  parentPath = ''
}) => {
  // Render a single field mapping row
  const renderFieldMapping = (fieldKey: string, fieldConfig: any, path: string) => {
    const fullPath = path ? `${path}.${fieldKey}` : fieldKey;
    const currentValue = path ? 
      (currentMapping[path] && currentMapping[path][fieldKey]) : 
      currentMapping[fieldKey];
    
    const sampleValue = currentValue ? getValueFromPath(currentValue) : null;
    const isValueValid = currentValue && sampleValue !== undefined && sampleValue !== null;
    
    // For nested objects, render a nested FieldMapper
    if (fieldConfig.fields) {
      // Get or initialize the complex mapping
      const complexMapping = path ? 
        (currentMapping[path] && currentMapping[path][fieldKey]) || {} : 
        currentMapping[fieldKey] || {};
      
      const handleNestedChange = (mapping: any) => {
        if (path) {
          // Update nested field in parent object
          const parentMapping = { ...(currentMapping[path] || {}) };
          parentMapping[fieldKey] = mapping;
          onComplexChange(path, parentMapping);
        } else {
          // Update top-level field
          onComplexChange(fieldKey, mapping);
        }
      };
      
      return (
        <Box key={fullPath} sx={{ mb: 3 }}>
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 'medium' }}>
                {fieldConfig.label}
                {fieldConfig.required && (
                  <Typography component="span" color="error" sx={{ ml: 1 }}>*</Typography>
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
              <FieldMapper
                appFields={fieldConfig.fields}
                apiFields={apiFields}
                currentMapping={complexMapping}
                onChange={(subField, apiField) => {
                  const newMapping = { ...complexMapping, [subField]: apiField };
                  handleNestedChange(newMapping);
                }}
                onComplexChange={(subField, fieldMapping) => {
                  const newMapping = { ...complexMapping, [subField]: fieldMapping };
                  handleNestedChange(newMapping);
                }}
                getValueFromPath={getValueFromPath}
                parentPath={fullPath}
              />
            </AccordionDetails>
          </Accordion>
        </Box>
      );
    }
    
    // For simple fields, render a dropdown selector
    return (
      <Box key={fullPath} sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontWeight: 'medium', flexGrow: 1 }}>
            {fieldConfig.label}
            {fieldConfig.required && (
              <Typography component="span" color="error" sx={{ ml: 1 }}>*</Typography>
            )}
          </Typography>
          {isValueValid ? (
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Mapped" 
              color="success" 
              size="small" 
            />
          ) : fieldConfig.required ? (
            <Chip 
              icon={<ErrorIcon />} 
              label="Required" 
              color="error" 
              size="small" 
            />
          ) : null}
        </Box>
        
        <FormControl fullWidth size="small">
          <InputLabel>Select API Field</InputLabel>
          <Select
            value={currentValue || ''}
            onChange={(e) => {
              if (path) {
                // Update nested field
                const parentMapping = { ...(currentMapping[path] || {}) };
                parentMapping[fieldKey] = e.target.value;
                onComplexChange(path, parentMapping);
              } else {
                // Update top-level field
                onChange(fieldKey, e.target.value);
              }
            }}
            label="Select API Field"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {apiFields.map((field) => (
              <MenuItem key={field} value={field}>
                {field}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {currentValue && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Sample value:
            </Typography>
            <Typography variant="body2" sx={{ 
              fontFamily: 'monospace', 
              p: 1, 
              bgcolor: 'rgba(0,0,0,0.04)', 
              borderRadius: 1,
              wordBreak: 'break-all'
            }}>
              {sampleValue !== null && sampleValue !== undefined 
                ? JSON.stringify(sampleValue) 
                : '<no value>'}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      {Object.entries(appFields).map(([key, config]) => 
        renderFieldMapping(key, config, parentPath)
      )}
    </Box>
  );
};

export default FieldMapper;