// src/store/slices/configSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConfigState } from '../../types';

// Default API mapping that works with the Flask API structure
const defaultApiMapping = {
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

const initialState: ConfigState = {
  isDemoMode: true, // Start in demo mode by default
  apiEndpoint: 'http://localhost:8000', // Default Flask API endpoint
  apiMapping: defaultApiMapping,
  useRemoteRuleEngine: false, // Default to using local rule engine
  ruleEngineApiUrl: 'http://localhost:8001' // Default rule engine API endpoint
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.isDemoMode = action.payload;
      // Log mode change for debugging
      console.log(`Mode changed to ${action.payload ? 'Demo' : 'Live'}`);
    },
    setApiEndpoint: (state, action: PayloadAction<string>) => {
      state.apiEndpoint = action.payload;
    },
    setApiMapping: (state, action: PayloadAction<Record<string, any>>) => {
      state.apiMapping = action.payload;
    },
    setUseRemoteRuleEngine: (state, action: PayloadAction<boolean>) => {
      state.useRemoteRuleEngine = action.payload;
    },
    setRuleEngineApiUrl: (state, action: PayloadAction<string>) => {
      state.ruleEngineApiUrl = action.payload;
    },
    resetConfig: (state) => {
      state.isDemoMode = initialState.isDemoMode;
      state.apiEndpoint = initialState.apiEndpoint;
      state.apiMapping = initialState.apiMapping;
      state.useRemoteRuleEngine = initialState.useRemoteRuleEngine;
      state.ruleEngineApiUrl = initialState.ruleEngineApiUrl;
    }
  }
});

export const { 
  setDemoMode, 
  setApiEndpoint, 
  setApiMapping, 
  setUseRemoteRuleEngine,
  setRuleEngineApiUrl,
  resetConfig
} = configSlice.actions;

export default configSlice.reducer;