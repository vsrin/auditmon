// src/components/config/ApiMappingBuilder.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Define our application's required field structure
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const APP_FIELDS_DEFINITION = {
  submissionId: { label: 'Submission ID', required: true, type: 'string' },
  timestamp: { label: 'Timestamp', required: true, type: 'string' },
  status: { label: 'Status', required: true, type: 'string' },
  broker: {
    label: 'Broker',
    required: true,
    fields: {
      name: { label: 'Broker Name', required: true, type: 'string' },
      email: { label: 'Broker Email', required: false, type: 'string' }
    }
  },
  insured: {
    label: 'Insured',
    required: true,
    fields: {
      name: { label: 'Insured Name', required: true, type: 'string' },
      industry: {
        label: 'Industry',
        required: true,
        fields: {
          code: { label: 'Industry Code', required: true, type: 'string' },
          description: { label: 'Industry Description', required: true, type: 'string' }
        }
      },
      address: {
        label: 'Address',
        required: true,
        fields: {
          street: { label: 'Street', required: true, type: 'string' },
          city: { label: 'City', required: true, type: 'string' },
          state: { label: 'State', required: true, type: 'string' },
          zip: { label: 'Zip', required: true, type: 'string' }
        }
      },
      yearsInBusiness: { label: 'Years in Business', required: false, type: 'number' },
      employeeCount: { label: 'Employee Count', required: false, type: 'number' }
    }
  },
  coverage: {
    label: 'Coverage',
    required: true,
    fields: {
      lines: { label: 'Lines of Business', required: true, type: 'array' },
      effectiveDate: { label: 'Effective Date', required: true, type: 'string' },
      expirationDate: { label: 'Expiration Date', required: true, type: 'string' }
    }
  },
  documents: { label: 'Documents', required: false, type: 'array' }
  // Removed complianceChecks since these are generated internally
};

// This is the actual export that will be used by other components
export const APP_FIELDS = APP_FIELDS_DEFINITION;

// Helper component to display the field structure recursively
const FieldTree: React.FC<{ 
  fields: Record<string, any>; 
  level?: number;
  showRequired?: boolean;
}> = ({ fields, level = 0, showRequired = true }) => {
  return (
    <List dense disablePadding sx={{ pl: level * 2 }}>
      {Object.entries(fields).map(([key, value]: [string, any]) => (
        <React.Fragment key={key}>
          <ListItem disablePadding sx={{ pt: 0.5, pb: 0.5 }}>
            <ListItemText
              primary={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant={level === 0 ? 'subtitle1' : 'body2'} component="span">
                    <strong>{value.label || key}</strong>
                  </Typography>
                  {showRequired && value.required && (
                    <Typography component="span" color="error" sx={{ ml: 0.5 }}>
                      *
                    </Typography>
                  )}
                  {value.type && (
                    <Typography component="span" color="text.secondary" sx={{ ml: 1 }} variant="caption">
                      ({value.type})
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
          {value.fields && (
            <FieldTree fields={value.fields} level={level + 1} showRequired={showRequired} />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

// API Mapping Builder component
const ApiMappingBuilder: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | false>('fieldStructure');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // Example API-to-Dashboard field mapping
  const exampleMapping = {
    submissionId: "submission.id",
    timestamp: "submission.created_at",
    status: "status",
    broker: {
      name: "broker.company_name",
      email: "broker.email_address"
    },
    insured: {
      name: "insured.legal_name",
      industry: {
        code: "insured.sic_code",
        description: "insured.industry_description"
      },
      address: {
        street: "insured.address.line1",
        city: "insured.address.city",
        state: "insured.address.state",
        zip: "insured.address.postal_code"
      },
      yearsInBusiness: "insured.years_in_business",
      employeeCount: "insured.employee_count"
    },
    coverage: {
      lines: "submission.coverage_lines",
      effectiveDate: "submission.effective_date",
      expirationDate: "submission.expiration_date"
    },
    documents: "documents"
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        API Mapping Reference
      </Typography>
      
      <Typography variant="body2" paragraph>
        This component provides reference information about our API mapping structure. 
        Required fields are marked with an asterisk (*).
      </Typography>
      
      <Typography variant="body2" paragraph color="error">
        Note: Compliance checks are now generated by the rule engine and should not be mapped from the API.
      </Typography>
      
      <Accordion 
        expanded={expandedSection === 'fieldStructure'} 
        onChange={handleChange('fieldStructure')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Dashboard Field Structure</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            These are the fields needed by the dashboard application:
          </Typography>
          <FieldTree fields={APP_FIELDS} />
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expandedSection === 'exampleMapping'} 
        onChange={handleChange('exampleMapping')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Example API Mapping</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            This is an example of how to map API fields to dashboard fields:
          </Typography>
          
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1, 
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(exampleMapping, null, 2)}
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expandedSection === 'mappingRules'} 
        onChange={handleChange('mappingRules')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Mapping Rules</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemText 
                primary="Dot Notation" 
                secondary="Use dot notation to navigate nested fields, e.g., 'insured.address.city'" 
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Nested Objects" 
                secondary="For complex object mappings, define a nested mapping object" 
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Arrays" 
                secondary="Arrays are mapped directly from the source" 
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Compliance Checks" 
                secondary="These are generated by the rule engine and should not be mapped" 
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default ApiMappingBuilder;