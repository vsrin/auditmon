// src/store/slices/submissionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubmissionData, SubmissionDetail } from '../../types';

interface SubmissionState {
  submissions: SubmissionData[];
  selectedSubmission: SubmissionDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubmissionState = {
  submissions: [],
  selectedSubmission: null,
  loading: false,
  error: null
};

const submissionSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    fetchSubmissionsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSubmissionsSuccess(state, action: PayloadAction<SubmissionData[]>) {
      state.submissions = action.payload;
      state.loading = false;
    },
    fetchSubmissionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchSubmissionDetailStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSubmissionDetailSuccess(state, action: PayloadAction<SubmissionDetail>) {
      state.selectedSubmission = action.payload;
      state.loading = false;
    },
    fetchSubmissionDetailFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearSelectedSubmission(state) {
      state.selectedSubmission = null;
    }
  }
});

export const {
  fetchSubmissionsStart,
  fetchSubmissionsSuccess,
  fetchSubmissionsFailure,
  fetchSubmissionDetailStart,
  fetchSubmissionDetailSuccess,
  fetchSubmissionDetailFailure,
  clearSelectedSubmission
} = submissionSlice.actions;

export default submissionSlice.reducer;