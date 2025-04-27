// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import submissionReducer from './slices/submissionSlice';
import configReducer from './slices/configSlice';

export const store = configureStore({
  reducer: {
    submissions: submissionReducer,
    config: configReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;