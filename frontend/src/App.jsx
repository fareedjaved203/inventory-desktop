import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import Sidebar from './components/Sidebar';
import HamburgerMenu from './components/HamburgerMenu';
import NetworkStatus from './components/NetworkStatus';
import ModeIndicator from './components/ModeIndicator';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import ProductLabels from './pages/ProductLabels';
import Sales from './pages/Sales';
import Contacts from './pages/Contacts';
import BulkPurchasing from './pages/BulkPurchasing';
import Returns from './pages/Returns';
import Branches from './pages/Branches';
import Employees from './pages/Employees';
import EmployeeStats from './pages/EmployeeStats';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import NotFound from './pages/NotFound';
import AuthModal from './components/AuthModal';
import LicenseModal from './components/LicenseModal';
import LoadingSpinner from './components/LoadingSpinner';
import { useLicense } from './hooks/useLicense';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      suspense: false,
      useErrorBoundary: false
    },
    mutations: {
      retry: false
    }
  }
});

function AppContent() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [appVersion, setAppVersion] = useState('1.0.0');
  const { valid: licenseValid, loading: licenseLoading, refreshLicense } = useLicense();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Initialize auth state from localStorage
  const [authState, setAuthState] = useState(() => {
    const authTime = localStorage.getItem('authTime');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const userType = localStorage.getItem('userType') || 'admin';
    const userPermissions = localStorage.getItem('userPermissions');
    
    // Clear auth if expired
    if (!authTime || Date.now() - parseInt(authTime) > 3600000) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authTime');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userType');
      return { isAuthenticated: false, userType: 'admin', userPermissions: [] };
    }
    
    return {
      isAuthenticated: isAuth,
      userType,
      userPermissions: userPermissions ? JSON.parse(userPermissions) : []
    };
  });
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { data: authCheck, isLoading } = useQuery(
    ['auth-check'],
    async () => {
      console.log('Auth check running...');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/check`);
      return response.data;
    },
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: false // Disable auth check completely for now
    }
  );

  // Handle initial auth check and routing
  useEffect(() => {
    console.log('Auth effect running:', { authInitialized, authState, authCheck });
    if (!authInitialized) {
      // Skip auth check completely and initialize immediately
      setAuthInitialized(true);
      if (!authState.isAuthenticated) {
        setShowAuthModal(true);
      }
    }
  }, [authInitialized, authState.isAuthenticated]);

  useEffect(() => {
    // Only show license modal for non-superadmin users
    if (!licenseLoading && !licenseValid && authState.isAuthenticated && authState.userType !== 'superadmin') {
      setShowLicenseModal(true);
    } else if (!licenseLoading && licenseValid && authState.isAuthenticated) {
      setShowLicenseModal(false);
    }
  }, [licenseValid, licenseLoading, authState.isAuthenticated, authState.userType]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getVersion().then(version => {
        setAppVersion(version);
      });
    }
  }, []);

  const handleAuthSuccess = (authData = {}) => {
    const permissions = authData.permissions || [];
    const type = authData.userType || 'admin';
    
    // Update auth state
    setAuthState({
      isAuthenticated: true,
      userType: type,
      userPermissions: permissions
    });
    setShowAuthModal(false);
    
    // Store in localStorage
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('authTime', Date.now().toString());
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    localStorage.setItem('userType', type);
    
    if (authData.token) localStorage.setItem('authToken', authData.token);
    if (authData.userId) localStorage.setItem('userId', authData.userId);
    if (authData.employeeId) {
      localStorage.setItem('employeeId', authData.employeeId);
      localStorage.setItem('employeeName', authData.employeeName);
    }
    
    queryClient.invalidateQueries(['auth-check']);
    
    // Immediate redirect based on user type
    if (type === 'superadmin') {
      window.location.replace('/super-admin');
    } else if (type === 'employee') {
      window.location.replace('/employee-stats');
    } else {
      window.location.replace('/');
    }
    
    // Refresh license for non-superadmin
    if (type !== 'superadmin') {
      refreshLicense();
    }
  };

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, userType: 'admin', userPermissions: [] });
    setShowAuthModal(true);
    setAuthInitialized(false);
    
    // Clear localStorage
    ['isAuthenticated', 'authTime', 'authToken', 'userId', 'userPermissions', 
     'userType', 'employeeId', 'employeeName', 'userEmail', 'userPassword'].forEach(
      key => localStorage.removeItem(key)
    );
  };

  const handleLicenseValidated = () => {
    setShowLicenseModal(false);
    refreshLicense();
  };

  // Show loading during initialization
  if (!authInitialized) {
    console.log('App loading state:', { authInitialized, authState });
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="w-12 h-12" />
        <div className="ml-4 text-gray-600">Initializing...</div>
      </div>
    );
  }

  if (!authState.isAuthenticated && showAuthModal) {
    return (
      <AuthModal 
        onSuccess={handleAuthSuccess}
        queryClient={queryClient}
      />
    );
  }

  // Prevent rendering if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="w-12 h-12" />
      </div>
    );
  }

  return (
    <>
      <NetworkStatus />
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          onLogout={handleLogout} 
          userPermissions={authState.userPermissions} 
          userType={authState.userType}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Mobile Header with Hamburger Menu */}
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
            <HamburgerMenu onClick={() => setIsMobileMenuOpen(true)} />
            <h1 className="text-lg font-semibold text-gray-800 flex-1 text-center">Hisab Ghar</h1>
            <ModeIndicator />
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:block bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
            <div className="flex justify-end">
              <ModeIndicator />
            </div>
          </div>
          
          <div className="flex-1 p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/employee-stats" element={<EmployeeStats />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product-labels" element={<ProductLabels />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/bulk" element={<BulkPurchasing />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <footer className="text-center py-2 text-xs text-gray-400 border-t bg-white">
            v{appVersion}
          </footer>
        </div>
      </div>
      
      {/* License modal as overlay */}
      <LicenseModal 
        isOpen={showLicenseModal && authState.isAuthenticated}
        onLicenseValidated={handleLicenseValidated}
        onLogout={handleLogout}
      />
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;