// src/store/slices/configSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Try to load initial state from localStorage
const getInitialState = () => {
  try {
    const savedApiEndpoint = localStorage.getItem('apiEndpoint');
    const savedApiMapping = localStorage.getItem('apiMapping');
    const savedDemoMode = localStorage.getItem('isDemoMode');
    
    return {
      isDemoMode: savedDemoMode ? JSON.parse(savedDemoMode) : true,
      apiEndpoint: savedApiEndpoint || '',
      apiMapping: savedApiMapping ? JSON.parse(savedApiMapping) : null
    };
  } catch (e) {
    console.error('Error loading config from localStorage', e);
    return {
      isDemoMode: true,
      apiEndpoint: '',
      apiMapping: null
    };
  }
};

const configSlice = createSlice({
  name: 'config',
  initialState: getInitialState(),
  reducers: {
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.isDemoMode = action.payload;
      // Save to localStorage
      localStorage.setItem('isDemoMode', JSON.stringify(action.payload));
    },
    setApiEndpoint: (state, action: PayloadAction<string>) => {
      state.apiEndpoint = action.payload;
      // Save to localStorage
      localStorage.setItem('apiEndpoint', action.payload);
    },
    setApiMapping: (state, action: PayloadAction<any>) => {
      state.apiMapping = action.payload;
      // Save to localStorage
      localStorage.setItem('apiMapping', JSON.stringify(action.payload));
    }
  }
});

export const { setDemoMode, setApiEndpoint, setApiMapping } = configSlice.actions;
export default configSlice.reducer;