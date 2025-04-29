// src/components/config/VisualFieldMapper.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, CircularProgress, Alert,
  Paper, Divider, Card, CardContent, TextField, Chip, IconButton, Tooltip,
  Badge, Stack, Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrayIcon from '@mui/icons-material/ViewList';
import ObjectIcon from '@mui/icons-material/AccountTree';
import InfoIcon from '@mui/icons-material/Info';
import { APP_FIELDS } from './ApiMappingBuilder';

interface VisualFieldMapperProps {
  appFields: Record<string, any>;
  apiEndpoint: string;
  currentMapping: Record<string, any>;
  onMappingChange: (mapping: Record<string, any>) => void;
}

const VisualFieldMapper: React.FC<VisualFieldMapperProps> = ({
  appFields,
  apiEndpoint,
  currentMapping,
  onMappingChange
}) => {
  const [sampleData, setSampleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flattenedApiFields, setFlattenedApiFields] = useState<{path: string, type: string, value: any}[]>([]);
  const [selectedAppField, setSelectedAppField] = useState<string | null>(null);
  const [apiFieldFilter, setApiFieldFilter] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // When currentMapping changes externally, update preview
  useEffect(() => {
    if (sampleData && currentMapping) {
      updatePreview(sampleData, currentMapping);
    }
  }, [currentMapping, sampleData]);
  
  // Fetch sample data from API
  const fetchSampleData = async () => {
    if (!apiEndpoint) {
      setError('Please configure API endpoint in Settings before fetching sample data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure endpoint ends with /api
      const baseEndpoint = apiEndpoint.endsWith('/api') 
        ? apiEndpoint 
        : `${apiEndpoint}/api`;
      
      // Adjust the endpoint to match the API's submissions endpoint
      const url = `${baseEndpoint}/submissions`;
      const response = await axios.get(url);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Use the first item as sample data
        setSampleData(response.data[0]);
        
        // Flatten the API data structure into field metadata
        const fields = flattenObjectWithMetadata(response.data[0]);
        setFlattenedApiFields(fields);
        
        // Generate preview based on current mapping
        updatePreview(response.data[0], currentMapping);
      } else {
        setError('No valid data received from API');
      }
    } catch (error) {
      console.error('Error fetching sample data:', error);
      setError(`Failed to fetch sample data: ${error instanceof Error ? error.message : String(error)}`);
      
      // If in development, provide a mock sample for testing
      if (process.env.NODE_ENV === 'development') {
        const mockSample = {
          id: "SUB-12345",
          created_at: "2023-05-15",
          status: "In Review",
          broker: {
            company_name: "ABC Insurance",
            email_address: "contact@abc.com"
          },
          insured: {
            legal_name: "Acme Corp",
            sic_code: "1234",
            industry_description: "Manufacturing",
            address: {
              line1: "123 Main St",
              city: "Boston",
              state: "MA",
              postal_code: "02108"
            },
            years_in_business: 15,
            employee_count: 250
          },
          submission: {
            coverage_lines: ["General Liability", "Property"],
            effective_date: "2023-06-01",
            expiration_date: "2024-06-01"
          },
          documents: [
            { id: "DOC-1", name: "Application", type: "Application Form", status: "Processed" }
          ]
        };
        
        setSampleData(mockSample);
        const fields = flattenObjectWithMetadata(mockSample);
        setFlattenedApiFields(fields);
        updatePreview(mockSample, currentMapping);
        setError('Using mock data for demonstration. Connect to a real API for production use.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle a specific group's expanded state
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  // Flatten nested object into array of metadata objects
  const flattenObjectWithMetadata = (obj: any, prefix = ''): Array<{path: string, type: string, value: any}> => {
    if (obj === null || obj === undefined) {
      return [{
        path: prefix,
        type: 'null',
        value: null
      }];
    }
    
    if (typeof obj !== 'object') {
      return [{
        path: prefix,
        type: typeof obj,
        value: obj
      }];
    }
    
    let result: Array<{path: string, type: string, value: any}> = [];
    
    // Add the object/array itself as a field
    if (prefix) {
      result.push({
        path: prefix,
        type: Array.isArray(obj) ? 'array' : 'object',
        value: obj
      });
    }
    
    if (Array.isArray(obj)) {
      // Add array elements with their indices
      obj.forEach((item, index) => {
        const itemPath = prefix ? `${prefix}[${index}]` : `[${index}]`;
        
        // First add the item itself
        result.push({
          path: itemPath,
          type: typeof item === 'object' && item !== null ? (Array.isArray(item) ? 'array' : 'object') : typeof item,
          value: item
        });
        
        // Then add its nested properties if it's an object
        if (typeof item === 'object' && item !== null) {
          result = result.concat(flattenObjectWithMetadata(item, itemPath));
        }
      });
    } else {
      // Process regular object properties
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = prefix ? `${prefix}.${key}` : key;
        
        // Add the property itself
        result.push({
          path: newPath,
          type: typeof value === 'object' && value !== null ? (Array.isArray(value) ? 'array' : 'object') : typeof value,
          value: value
        });
        
        // Then add nested properties if it's an object
        if (typeof value === 'object' && value !== null) {
          result = result.concat(flattenObjectWithMetadata(value, newPath));
        }
      });
    }
    
    return result;
  };
  
  // Get nested value from object using dot and bracket notation
  const getValueFromPath = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;
    
    // Handle empty path edge case
    if (path === '') return obj;
    
    try {
      // Replace square brackets in a way that split will preserve them
      const normalizedPath = path
        .replace(/\[(\d+)\]/g, '.[__ARRAY__][$1]')
        .replace(/\.\[__ARRAY__\]\[/g, '[');
      
      const segments = normalizedPath.split('.');
      
      return segments.reduce((prev, curr) => {
        if (prev === undefined || prev === null) return undefined;
        
        // Handle array index notation [n]
        if (curr.match(/^\[\d+\]$/)) {
          const index = parseInt(curr.slice(1, -1), 10);
          return Array.isArray(prev) && index < prev.length ? prev[index] : undefined;
        }
        
        return prev[curr];
      }, obj);
    } catch (error) {
      console.error(`Error getting value from path "${path}":`, error);
      return undefined;
    }
  };
  
  // Update preview data based on mapping
  const updatePreview = (data: any, mapping: Record<string, any>) => {
    if (!data || !mapping) return;
    
    const result: Record<string, any> = {};
    
    const applyMapping = (targetObj: any, mappingObj: any, parentPath = '') => {
      Object.entries(mappingObj).forEach(([key, value]) => {
        const currentPath = parentPath ? `${parentPath}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          // Create a new object or array in the target
          targetObj[key] = Array.isArray(value) ? [] : {};
          applyMapping(targetObj[key], value, currentPath);
        } else if (typeof value === 'string' && value) {
          try {
            // Get value from source object using the mapped path
            const sourceValue = getValueFromPath(data, value);
            
            // Handle special cases for arrays and complex values
            if (value.includes('[') && value.includes(']')) {
              // Direct array element access
              targetObj[key] = sourceValue;
            } else {
              const fieldInfo = flattenedApiFields.find(f => f.path === value);
              
              if (fieldInfo && fieldInfo.type === 'array') {
                // If the source is an array, clone it
                targetObj[key] = Array.isArray(sourceValue) ? [...sourceValue] : sourceValue;
              } else {
                // Regular value assignment
                targetObj[key] = sourceValue;
              }
            }
          } catch (error) {
            console.error(`Error applying mapping for field "${key}" with path "${value}":`, error);
            targetObj[key] = undefined;
          }
        }
      });
    };
    
    applyMapping(result, mapping);
    setPreviewData(result);
  };
  
  // Get current mapping value for a field path
  const getMappingForPath = (path: string): string => {
    if (!path) return '';
    
    const segments = path.split('.');
    let current = currentMapping;
    
    for (let i = 0; i < segments.length; i++) {
      if (!current[segments[i]]) return '';
      
      if (i === segments.length - 1) {
        return typeof current[segments[i]] === 'string' ? current[segments[i]] : '';
      }
      
      current = current[segments[i]];
    }
    
    return '';
  };
  
  // Handle mapping change
  const handleMapField = (appField: string, apiField: string) => {
    if (!appField) return;
    
    // Create a deep copy of the current mapping
    const newMapping = JSON.parse(JSON.stringify(currentMapping));
    
    // Split the app field path into segments
    const fieldPath = appField.split('.');
    
    // Navigate to the right location in the mapping object
    let current = newMapping;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) {
        current[fieldPath[i]] = {};
      }
      current = current[fieldPath[i]];
    }
    
    // Set the mapping value
    current[fieldPath[fieldPath.length - 1]] = apiField;
    
    // Update the mapping
    onMappingChange(newMapping);
    
    // Update preview
    if (sampleData) {
      updatePreview(sampleData, newMapping);
    }
    
    // Clear selection
    setSelectedAppField(null);
  };
  
  // Validate mapping completeness
  const validateMapping = (): { 
    valid: boolean; 
    missingRequired: string[]; 
    incorrectTypes: Array<{field: string, expectedType: string, actualType: string}>;
  } => {
    const requiredFields = [
      'submissionId',
      'timestamp',
      'status',
      'insured.name',
      'insured.industry.code',
      'insured.industry.description',
      'insured.address.street',
      'insured.address.city',
      'insured.address.state',
      'insured.address.zip',
      'broker.name',
      'coverage.lines',
      'coverage.effectiveDate',
      'coverage.expirationDate'
    ];
    
    const missingRequired = requiredFields.filter(field => {
      // For nested fields, check if they exist in the preview data
      const parts = field.split('.');
      let current = previewData;
      
      for (const part of parts) {
        if (!current || typeof current !== 'object') return true;
        current = current[part];
      }
      
      return current === undefined || current === null;
    });
    
    // For this implementation, we'll keep type checking simple
    const incorrectTypes: Array<{field: string, expectedType: string, actualType: string}> = [];
    
    return {
      valid: missingRequired.length === 0 && incorrectTypes.length === 0,
      missingRequired,
      incorrectTypes
    };
  };
  
  // Extract field type from the flattened API fields
  const getApiFieldType = (path: string): string => {
    const field = flattenedApiFields.find(f => f.path === path);
    return field ? field.type : 'unknown';
  };
  
  // Auto-map fields based on name similarity
  const autoMapFields = () => {
    if (!sampleData || flattenedApiFields.length === 0) return;
    
    const newMapping = { ...currentMapping };
    
    // Utility to find the best match for a field name
    const findBestMatch = (fieldName: string, preferredTypes: string[] = []): string | null => {
      const normalized = fieldName.toLowerCase();
      const apiPaths = flattenedApiFields.map(f => f.path);
      
      // Helper function to check if a path contains a specific segment
      const pathContainsSegment = (path: string, segment: string): boolean => {
        return path.split(/\.|\[|\]/).some(part => part.toLowerCase() === segment);
      };
      
      // First, look for exact field name matches with preferred types
      if (preferredTypes.length > 0) {
        for (const apiField of flattenedApiFields) {
          const fieldType = apiField.type;
          const apiFieldName = apiField.path.split('.').pop()?.toLowerCase() || '';
          if (apiFieldName === normalized && preferredTypes.includes(fieldType)) {
            return apiField.path;
          }
        }
      }
      
      // Then look for exact field name matches
      for (const apiField of flattenedApiFields) {
        const apiFieldName = apiField.path.split('.').pop()?.toLowerCase() || '';
        if (apiFieldName === normalized) {
            return apiField.path;
        }
      }
      
      // Look for fields where the last segment matches
      for (const apiField of flattenedApiFields) {
        const parts = apiField.path.split('.');
        const lastPart = parts[parts.length - 1].toLowerCase();
        if (lastPart === normalized) {
          return apiField.path;
        }
      }
      
      // Then check if any path segment contains the field name
      for (const apiField of flattenedApiFields) {
        if (pathContainsSegment(apiField.path, normalized)) {
          return apiField.path;
        }
      }
      
      // Check for paths that contain the field name as a substring
      for (const apiField of flattenedApiFields) {
        const pathLower = apiField.path.toLowerCase();
        if (pathLower.includes(normalized) || normalized.includes(pathLower.split('.').pop() || '')) {
          return apiField.path;
        }
      }
      
      // Special case handling for common field mappings
      const specialMappings: Record<string, string[]> = {
        'id': ['id', 'identifier', 'recordid', 'tx_id', 'transaction_id'], 
        'name': ['name', 'legal_name', 'company_name', 'business_name', 'organization_name'],
        'street': ['address', 'line1', 'street', 'street_address'],
        'city': ['city', 'municipality', 'town'],
        'state': ['state', 'province', 'region'],
        'zip': ['zip', 'postal_code', 'zipcode', 'zip_code'],
        'code': ['code', 'industry_code', 'sic_code', 'naics_code'],
        'description': ['description', 'desc', 'industry_description', 'details']
      };
      
      // Check if field is in our special mappings
      for (const [key, alternatives] of Object.entries(specialMappings)) {
        if (alternatives.includes(normalized)) {
          // Look for any API field that has one of the alternatives in its path
          for (const alt of [...alternatives, key]) {  // Include the key itself
            for (const apiField of flattenedApiFields) {
              const path = apiField.path.toLowerCase();
              // Check if path contains this alternative as a discrete segment
              if (path.split(/\.|\[|\]/).some(part => part === alt)) {
                return apiField.path;
              }
            }
          }
        }
      }
      
      // Handle "value" fields by looking for paths that contain both the field name and "value"
      if (!normalized.includes('value')) {
        for (const apiField of flattenedApiFields) {
          const pathLower = apiField.path.toLowerCase();
          if (pathLower.includes(normalized) && pathLower.includes('value')) {
            return apiField.path;
          }
        }
      }
      
      return null;
    };
    
    // Helper to map a single field
    const mapField = (appField: string, fieldConfig: any, path = '') => {
      const fieldPath = path ? `${path}.${appField}` : appField;
      
      if (fieldConfig.fields) {
        // Recursively map child fields
        Object.entries(fieldConfig.fields).forEach(([childKey, childConfig]: [string, any]) => {
          mapField(childKey, childConfig, fieldPath);
        });
      } else {
        // Determine preferred types based on field config
        const preferredTypes: string[] = [];
        if (fieldConfig.type === 'array') {
          preferredTypes.push('array');
        }
        
        // Find matching API field
        const match = findBestMatch(appField, preferredTypes);
        if (match) {
          // Set the mapping, creating parent objects as needed
          const segments = fieldPath.split('.');
          let current = newMapping;
          
          for (let i = 0; i < segments.length - 1; i++) {
            if (!current[segments[i]]) {
              current[segments[i]] = {};
            }
            current = current[segments[i]];
          }
          
          current[segments[segments.length - 1]] = match;
        }
      }
    };
    
    // Map all app fields
    Object.entries(appFields).forEach(([key, config]: [string, any]) => {
      mapField(key, config);
    });
    
    // Update the mapping
    onMappingChange(newMapping);
    
    // Update preview
    updatePreview(sampleData, newMapping);
  };
  
  // Get a user-friendly display type for an API field
  const getDisplayType = (type: string, value: any): string => {
    if (type === 'array') {
      return `Array (${value ? value.length : 0} items)`;
    } else if (type === 'object') {
      return 'Object';
    } else if (type === 'string') {
      return 'String';
    } else if (type === 'number') {
      return 'Number';
    } else if (type === 'boolean') {
      return 'Boolean';
    } else {
      return type;
    }
  };
  
  // Render app fields recursively
  const renderAppFields = (fields: Record<string, any>, path = '') => {
    return Object.entries(fields).map(([key, config]: [string, any]) => {
      const fieldPath = path ? `${path}.${key}` : key;
      const mappedValue = getMappingForPath(fieldPath);
      const isSelected = selectedAppField === fieldPath;
      const fieldType = mappedValue ? getApiFieldType(mappedValue) : '';
      
      if (config.fields) {
        return (
          <Box key={fieldPath} sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                pb: 1
              }}
              onClick={() => toggleGroup(fieldPath)}
            >
              <IconButton size="small" sx={{ mr: 1 }}>
                {expandedGroups[fieldPath] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <Typography variant="subtitle1" fontWeight="bold">
                {config.label} {config.required && <span style={{ color: 'red' }}>*</span>}
              </Typography>
              {mappedValue && (
                <Chip 
                  label="Partially Mapped" 
                  size="small" 
                  color="info" 
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            <Collapse in={expandedGroups[fieldPath] !== false}>
              <Box sx={{ pl: 4, borderLeft: '1px solid #ccc' }}>
                {renderAppFields(config.fields, fieldPath)}
              </Box>
            </Collapse>
          </Box>
        );
      }
      
      return (
        <Card 
          key={fieldPath}
          variant="outlined"
          sx={{
            mb: 1,
            cursor: 'pointer',
            borderColor: isSelected ? 'primary.main' : (mappedValue ? 'success.main' : (config.required ? 'error.light' : 'grey.300')),
            bgcolor: isSelected ? 'rgba(0, 0, 255, 0.05)' : 'background.paper'
          }}
          onClick={() => setSelectedAppField(isSelected ? null : fieldPath)}
        >
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {config.label} {config.required && <span style={{ color: 'red' }}>*</span>}
              </Typography>
              
              {mappedValue && (
                <Stack direction="row" spacing={1} alignItems="center">
                  {fieldType === 'array' && (
                    <Badge color="info">
                      <ArrayIcon fontSize="small" />
                    </Badge>
                  )}
                  {fieldType === 'object' && (
                    <Badge color="info">
                      <ObjectIcon fontSize="small" />
                    </Badge>
                  )}
                  <Chip 
                    label={mappedValue}
                    size="small"
                    color="success"
                    onDelete={() => handleMapField(fieldPath, '')}
                  />
                </Stack>
              )}
            </Box>
          </CardContent>
        </Card>
      );
    });
  };
  
  // Group API fields by path prefix
  const groupApiFields = (fields: Array<{path: string, type: string, value: any}>): Record<string, Array<{path: string, type: string, value: any}>> => {
    const groups: Record<string, Array<{path: string, type: string, value: any}>> = {
      'root': []
    };
    
    for (const field of fields) {
      if (!field.path.includes('.') && !field.path.match(/^\[\d+\]/)) {
        // Top-level fields go to root
        groups['root'].push(field);
        continue;
      }
      
      // Extract the top-level namespace
      let groupKey = field.path.split('.')[0];
      
      // Handle array notation at top level
      if (groupKey.includes('[')) {
        groupKey = groupKey.split('[')[0];
        if (!groupKey) groupKey = 'arrays';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(field);
    }
    
    return groups;
  };
  
  // Format a display value for preview
  const formatDisplayValue = (value: any, type: string): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (type === 'array') {
      return `Array(${value.length})`;
    }
    
    if (type === 'object') {
      return '{...}';
    }
    
    if (typeof value === 'string') {
      return value.length > 30 ? `"${value.substring(0, 27)}..."` : `"${value}"`;
    }
    
    return String(value);
  };
  
  // Check if a field has meaningful nested structure (for expansion)
  const hasNestedStructure = (path: string): boolean => {
    return flattenedApiFields.some(field => 
      field.path !== path && field.path.startsWith(path + '.')
    );
  };
  
  // Render API fields with improved grouping and visualization
  const renderApiFields = () => {
    const filteredFields = flattenedApiFields.filter(field => 
      field.path.toLowerCase().includes(apiFieldFilter.toLowerCase())
    );
  
    // Modified renderApiFields function that properly handles filtering
    const renderApiFields = () => {
      // Apply filtering to all fields first
      const filteredFields = flattenedApiFields.filter(field => 
        field.path.toLowerCase().includes(apiFieldFilter.toLowerCase())
      );
      
      // If there's no filter text or we're in simple mode, show the flat list
      if (apiFieldFilter || !showAdvancedOptions) {
        return (
          <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
            {filteredFields.map(field => (
              <Card 
                key={field.path}
                variant="outlined"
                sx={{
                  mb: 1,
                  cursor: selectedAppField ? 'pointer' : 'default',
                  '&:hover': {
                    bgcolor: selectedAppField ? 'action.hover' : 'background.paper'
                  }
                }}
                onClick={() => {
                  if (selectedAppField) {
                    handleMapField(selectedAppField, field.path);
                  }
                }}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Box display="flex" alignItems="center">
                    {field.type === 'array' && (
                      <ArrayIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                    )}
                    {field.type === 'object' && (
                      <ObjectIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="body2" fontFamily="monospace">
                      {renderApiFieldPath(field.path)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {field.type === 'value' ? 'Value:' : 'Type:'} {
                      formatDisplayValue(field.value, field.type)
                    }
                  </Typography>
                </CardContent>
              </Card>
            ))}
            
            {filteredFields.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                No matching API fields found
              </Typography>
            )}
          </Box>
        );
      }
      
      // For advanced mode with no search filter, use grouping
      const groups = groupApiFields(filteredFields);
      
      return (
        <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
          {Object.entries(groups).map(([groupName, fields]) => (
            <Box key={groupName} sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: 'background.default',
                  p: 1,
                  borderRadius: 1,
                  cursor: 'pointer'
                }}
                onClick={() => toggleGroup(`api_${groupName}`)}
              >
                <IconButton size="small" sx={{ mr: 1 }}>
                  {expandedGroups[`api_${groupName}`] === false ? 
                    <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
                <Typography variant="subtitle2" fontWeight="bold">
                  {groupName === 'root' ? 'Root Fields' : groupName}
                </Typography>
                <Chip
                  label={fields.length}
                  size="small"
                  sx={{ ml: 1 }}
                  color="primary"
                />
              </Box>
              
              <Collapse in={expandedGroups[`api_${groupName}`] !== false}>
                <Box sx={{ pl: 2, mt: 1 }}>
                  {fields.map(field => (
                    <Card 
                      key={field.path}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        cursor: selectedAppField ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: selectedAppField ? 'action.hover' : 'background.paper'
                        },
                        borderLeft: hasNestedStructure(field.path) ? '3px solid #1976d2' : undefined
                      }}
                      onClick={() => {
                        if (selectedAppField) {
                          handleMapField(selectedAppField, field.path);
                        }
                      }}
                    >
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Box display="flex" alignItems="center">
                          {field.type === 'array' && (
                            <ArrayIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                          )}
                          {field.type === 'object' && (
                            <ObjectIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                          )}
                          <Typography variant="body2" fontFamily="monospace">
                            {renderApiFieldPath(field.path, groupName)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {getDisplayType(field.type, field.value)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDisplayValue(field.value, field.type)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Collapse>
            </Box>
          ))}
          
          {Object.keys(groups).length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No matching API fields found
            </Typography>
          )}
        </Box>
      );
    };
    
    // Group fields for better organization
    const groups = groupApiFields(filteredFields);
    
    return (
      <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
        {Object.entries(groups).map(([groupName, fields]) => (
          <Box key={groupName} sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'background.default',
                p: 1,
                borderRadius: 1,
                cursor: 'pointer'
              }}
              onClick={() => toggleGroup(`api_${groupName}`)}
            >
              <IconButton size="small" sx={{ mr: 1 }}>
                {expandedGroups[`api_${groupName}`] === false ? 
                  <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
              <Typography variant="subtitle2" fontWeight="bold">
                {groupName === 'root' ? 'Root Fields' : groupName}
              </Typography>
              <Chip
                label={fields.length}
                size="small"
                sx={{ ml: 1 }}
                color="primary"
              />
            </Box>
            
            <Collapse in={expandedGroups[`api_${groupName}`] !== false}>
              <Box sx={{ pl: 2, mt: 1 }}>
                {fields.map(field => (
                  <Card 
                    key={field.path}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      cursor: selectedAppField ? 'pointer' : 'default',
                      '&:hover': {
                        bgcolor: selectedAppField ? 'action.hover' : 'background.paper'
                      },
                      borderLeft: hasNestedStructure(field.path) ? '3px solid #1976d2' : undefined
                    }}
                    onClick={() => {
                      if (selectedAppField) {
                        handleMapField(selectedAppField, field.path);
                      }
                    }}
                  >
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Box display="flex" alignItems="center">
                        {field.type === 'array' && (
                          <ArrayIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                        )}
                        {field.type === 'object' && (
                          <ObjectIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="body2" fontFamily="monospace">
                          {renderApiFieldPath(field.path, groupName)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {getDisplayType(field.type, field.value)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDisplayValue(field.value, field.type)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Collapse>
          </Box>
        ))}
        
        {Object.keys(groups).length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No matching API fields found
          </Typography>
        )}
      </Box>
    );
  };
  
  // Format API field path for display
  const renderApiFieldPath = (path: string, groupPrefix = '') => {
    // If we're in a group view, simplify the display by removing the group prefix
    let displayPath = path;
    if (groupPrefix && groupPrefix !== 'root' && path.startsWith(groupPrefix)) {
      displayPath = path.substring(groupPrefix.length + 1); // +1 for the dot
    }
    
    // Split path and highlight array indices and nested structures
    const segments = displayPath.split('.');
    
    return segments.map((segment, index) => {
      // Check if segment has array notation
      if (segment.includes('[') && segment.includes(']')) {
        const [name, ...rest] = segment.split('[');
        return (
          <React.Fragment key={index}>
            {index > 0 && <span style={{ color: '#666' }}>.</span>}
            <span>{name}</span>
            <span style={{ color: '#1976d2' }}>[{rest.join('[').replace(']', '')}</span>
            <span style={{ color: '#1976d2' }}>]</span>
          </React.Fragment>
        );
      }
      
      // Handle when the segment is just an array index
      if (segment.match(/^\[\d+\]$/)) {
        return (
          <React.Fragment key={index}>
            <span style={{ color: '#1976d2' }}>{segment}</span>
          </React.Fragment>
        );
      }
      
      return (
        <React.Fragment key={index}>
          {index > 0 && <span style={{ color: '#666' }}>.</span>}
          <span>{segment}</span>
        </React.Fragment>
      );
    });
  };

  return (
    <Box>
      <Typography variant="body2" paragraph>
        This visual mapper helps you connect your API data to the dashboard. First, fetch a sample of your API data,
        then map each dashboard field to the corresponding API field by clicking them.
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchSampleData} 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Fetching...' : 'Fetch Sample Data'}
        </Button>
        
        {sampleData && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={autoMapFields}
          >
            Auto-Map Fields
          </Button>
        )}
        
        <Tooltip title="Toggle advanced mapping options">
          <Button
            variant="outlined"
            color="info"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            startIcon={showAdvancedOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {showAdvancedOptions ? 'Simple View' : 'Advanced View'}
          </Button>
        </Tooltip>
        
        <Tooltip title="How to use the mapper">
          <IconButton 
            color="info" 
            onClick={() => setShowTutorial(!showTutorial)}
            sx={{ ml: 'auto' }}
          >
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {showTutorial && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setShowTutorial(false)}>
          <Typography variant="subtitle2">How to use the Visual Mapper:</Typography>
          <ol>
            <li>Ensure you've configured your API endpoint in the Settings page</li>
            <li>Click "Fetch Sample Data" to get data from your API</li>
            <li>Click a dashboard field on the left side to select it</li>
            <li>Click a matching API field on the right side to create a mapping</li>
            <li>Required fields are marked with a red asterisk (*)</li>
            <li>Mapped fields will show a green indicator</li>
            <li>Click "Auto-Map Fields" to automatically find potential matches</li>
            <li>Use Advanced View to see better visualization of nested data structures</li>
            <li>Look for special icons that indicate arrays <ArrayIcon fontSize="small" /> and objects <ObjectIcon fontSize="small" /></li>
            <li>For complex payloads, expand/collapse sections to focus on relevant data</li>
          </ol>
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      {sampleData && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" gutterBottom>Sample API Response:</Typography>
              <Tooltip title="The sample data structure is used to generate field mappings">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                borderRadius: 1, 
                maxHeight: '200px', 
                overflow: 'auto',
                fontSize: '0.875rem'
              }}
            >
              {JSON.stringify(sampleData, null, 2)}
            </Box>
          </Paper>
          
          <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
            {/* App Fields (Left Side) */}
            <Box width={{ xs: '100%', md: '45%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Dashboard Fields
              </Typography>
              <Typography variant="caption" display="block" mb={2}>
                Click on a field to map it with an API field
              </Typography>
              
              <Box sx={{ maxHeight: '500px', overflow: 'auto', pr: 1 }}>
                {renderAppFields(appFields)}
              </Box>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Divider sx={{ display: { xs: 'block', md: 'none' }, my: 2 }} />
            
            {/* API Fields (Right Side) */}
            <Box width={{ xs: '100%', md: '45%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                API Fields
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search API fields..."
                  value={apiFieldFilter}
                  onChange={(e) => setApiFieldFilter(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
                <Tooltip title="Clear search">
                  <IconButton 
                    size="small" 
                    sx={{ ml: 1 }}
                    onClick={() => setApiFieldFilter('')}
                    disabled={!apiFieldFilter}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {selectedAppField ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select an API field to map to: <strong>{selectedAppField}</strong>
                </Alert>
              ) : (
                <Typography variant="caption" display="block" mb={2}>
                  Click on an API field after selecting a dashboard field
                </Typography>
              )}
              
              {renderApiFields()}
            </Box>
          </Box>
          
          {/* Preview Section */}
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Mapped Data Preview:</Typography>
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                borderRadius: 1, 
                maxHeight: '200px', 
                overflow: 'auto',
                fontSize: '0.875rem'
              }}
            >
              {JSON.stringify(previewData, null, 2)}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default VisualFieldMapper;