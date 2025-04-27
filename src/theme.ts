// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#17af55', // ArtifiData green
      light: '#4abe77',
      dark: '#0e9a3c',
      contrastText: '#fff',
    },
    secondary: {
      main: '#0c0c10', // Dark sidebar color
      light: '#2c2c30',
      dark: '#000000',
      contrastText: '#fff',
    },
    success: {
      main: '#17af55',
      light: '#4abe77',
      dark: '#0e9a3c',
    },
    warning: {
      main: '#ED6C02',
      light: '#ff9233',
      dark: '#c56200',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '6px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': {
            border: 0,
          },
        },
      },
    },
  },
});

export default theme;