// src/store/slices/submissionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubmissionDetail } from '../../types';

// Define Submission type locally if it's not exported from types
interface Submission {
  submissionId: string;
  insured?: {
    name?: string;
    industry?: {
      description?: string;
    };
  };
  broker?: {
    name?: string;
  };
  timestamp: string;
  status?: string;
  // Add other fields as needed
}

interface SubmissionsState {
  submissions: Submission[];
  selectedSubmission: SubmissionDetail | null;
  requestedSubmissionId: string | null; // Added to track which ID was requested
  loading: boolean;
  error: string | null;
}

const initialState: SubmissionsState = {
  submissions: [],
  selectedSubmission: null,
  requestedSubmissionId: null,
  loading: false,
  error: null,
};

export const submissionsSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    fetchSubmissionsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSubmissionsSuccess(state, action: PayloadAction<Submission[]>) {
      state.submissions = action.payload;
      state.loading = false;
    },
    fetchSubmissionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchSubmissionDetailStart(state, action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
      state.requestedSubmissionId = action.payload; // Store the requested ID
    },
    fetchSubmissionDetailSuccess(state, action: PayloadAction<SubmissionDetail>) {
      state.selectedSubmission = action.payload;
      state.loading = false;
      
      // Verify the ID matches what was requested
      if (state.requestedSubmissionId && 
          state.selectedSubmission && 
          state.selectedSubmission.submissionId !== state.requestedSubmissionId) {
        console.warn(`ID mismatch in reducer: requested=${state.requestedSubmissionId}, received=${state.selectedSubmission.submissionId}`);
        state.selectedSubmission.submissionId = state.requestedSubmissionId;
      }
    },
    fetchSubmissionDetailFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.selectedSubmission = null;
    },
    clearSelectedSubmission(state) {
      state.selectedSubmission = null;
      state.requestedSubmissionId = null;
    },
  },
});

export const {
  fetchSubmissionsStart,
  fetchSubmissionsSuccess,
  fetchSubmissionsFailure,
  fetchSubmissionDetailStart,
  fetchSubmissionDetailSuccess,
  fetchSubmissionDetailFailure,
  clearSelectedSubmission,
} = submissionsSlice.actions;

export default submissionsSlice.reducer;