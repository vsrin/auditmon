// src/store/slices/configSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
  isDemoMode: boolean;
  apiEndpoint: string;
  apiMapping: Record<string, any> | null;
}

const initialState: ConfigState = {
  isDemoMode: true,
  apiEndpoint: 'https://api.example.com',
  apiMapping: null
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setDemoMode(state, action: PayloadAction<boolean>) {
      state.isDemoMode = action.payload;
    },
    setApiEndpoint(state, action: PayloadAction<string>) {
      state.apiEndpoint = action.payload;
    },
    setApiMapping(state, action: PayloadAction<Record<string, any>>) {
      state.apiMapping = action.payload;
    }
  }
});

export const { setDemoMode, setApiEndpoint, setApiMapping } = configSlice.actions;

export default configSlice.reducer;