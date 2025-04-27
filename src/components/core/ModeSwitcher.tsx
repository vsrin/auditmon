// src/components/core/ModeSwitcher.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setDemoMode } from '../../store/slices/configSlice';
import apiService from '../../services/api/apiService';

// Remove all visible UI elements - this component will only handle the logic now
const ModeSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);

  // Sync component with localStorage on mount
  useEffect(() => {
    try {
      const savedDemoMode = localStorage.getItem('isDemoMode');
      if (savedDemoMode !== null && JSON.parse(savedDemoMode) !== isDemoMode) {
        dispatch(setDemoMode(JSON.parse(savedDemoMode)));
      }
    } catch (e) {
      console.error('Error loading demo mode from localStorage', e);
    }
  }, [dispatch, isDemoMode]);

  return null; // This component now renders nothing
};

export default ModeSwitcher;