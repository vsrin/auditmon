// src/components/core/Layout.tsx
import React, { ReactNode, useState, useEffect } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography,
  Drawer, 
  Divider, 
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  styled
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
  BugReport as BugReportIcon,
  Assignment as AssignmentIcon,
  Rule as RuleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ruleEngineProvider from '../../services/rules/ruleEngineProvider';

const drawerWidth = 240;

// Custom styled components
const SidebarWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: '#0c0c10',
  color: 'white',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const LogoBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.1)'
}));

const Logo = styled('div')(({ theme }) => ({
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2)
}));

const SidebarItem = styled(Box)(({ theme }) => ({
  color: 'rgba(255,255,255,0.7)',
  margin: '4px 0',
  padding: theme.spacing(1, 2),
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white'
  },
  '&.active': {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white'
  }
}));

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDemoMode, apiEndpoint } = useSelector((state: RootState) => state.config);
  const navigate = useNavigate();

  // Sync the current mode with rule engine provider
  useEffect(() => {
    if (ruleEngineProvider.setDemoMode) {
      console.log("Layout - Setting rule engine demo mode:", isDemoMode);
      ruleEngineProvider.setDemoMode(isDemoMode);
    }
  }, [isDemoMode]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Navigation handler to replace window.location.href
  const navigateTo = (path: string) => {
    navigate(path);
    if (mobileOpen) {
      setMobileOpen(false); // Close drawer on mobile after navigation
    }
  };

  const drawer = (
    <SidebarWrapper>
      <LogoBox>
        <Logo>
          <BuildIcon sx={{ color: '#D3D3D3' }} />
        </Logo>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">Insurance Monitor</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>By ArtifiData</Typography>
        </Box>
      </LogoBox>
      
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
      
      <Box sx={{ p: 1 }}>
        {/* Navigation Items */}
        <SidebarItem 
          onClick={() => navigateTo('/')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <DashboardIcon fontSize="small" />
          </Box>
          <Typography>Home</Typography>
        </SidebarItem>
        
        <SidebarItem
          onClick={() => navigateTo('/submissions')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <DescriptionIcon fontSize="small" />
          </Box>
          <Typography>Submissions</Typography>
        </SidebarItem>
        
        {/* Audit Compliance navigation item */}
        <SidebarItem
          onClick={() => navigateTo('/audit-compliance')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <AssignmentIcon fontSize="small" />
          </Box>
          <Typography>Audit Compliance</Typography>
        </SidebarItem>
        
        {/* Rule Engine navigation item */}
        <SidebarItem
          onClick={() => navigateTo('/rule-engine')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <RuleIcon fontSize="small" />
          </Box>
          <Typography>Rule Engine</Typography>
        </SidebarItem>
        
        {/* Reports navigation item - Moved down in the list */}
        <SidebarItem
          onClick={() => navigateTo('/reports')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <AssessmentIcon fontSize="small" />
          </Box>
          <Typography>Reports</Typography>
        </SidebarItem>
      </Box>
      
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
      
      <Box sx={{ p: 1 }}>
        <SidebarItem
          onClick={() => navigateTo('/config')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <BuildIcon fontSize="small" />
          </Box>
          <Typography>Configuration</Typography>
        </SidebarItem>
        
        <SidebarItem
          onClick={() => navigateTo('/settings')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <SettingsIcon fontSize="small" />
          </Box>
          <Typography>Settings</Typography>
        </SidebarItem>
        
        {/* API Debug navigation item */}
        <SidebarItem
          onClick={() => navigateTo('/api-debug')}
        >
          <Box sx={{ display: 'flex', minWidth: 40, color: 'inherit' }}>
            <BugReportIcon fontSize="small" />
          </Box>
          <Typography>API Debug</Typography>
        </SidebarItem>
      </Box>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="caption" sx={{ opacity: 0.5 }}>Enterprise plan</Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>username@artifdata.ai</Typography>
      </Box>
    </SidebarWrapper>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigateTo('/')}
          >
            Intake - Audit Compliance Monitoring
          </Typography>
          
          <Chip
            label={isDemoMode ? 'Demo Mode' : 'Live Mode'}
            color={isDemoMode ? 'default' : 'primary'}
            variant={isDemoMode ? 'outlined' : 'filled'}
            size="small"
            sx={{ 
              mr: 1,
              bgcolor: isDemoMode ? 'rgba(0, 0, 0, 0.08)' : undefined,
              fontWeight: 'bold',
              border: isDemoMode ? '1px solid rgba(0, 0, 0, 0.23)' : undefined
            }}
          />
          {!isDemoMode && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
              Connected to {apiEndpoint}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px' // AppBar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;