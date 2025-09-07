import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LanguageProvider } from './contexts/LanguageContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Contacts from './pages/Contacts';
import BulkPurchasing from './pages/BulkPurchasing';
import Returns from './pages/Returns';
import Branches from './pages/Branches';
import Employees from './pages/Employees';
import EmployeeStats from './pages/EmployeeStats';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AuthModal from './components/AuthModal';
import LicenseModal from './components/LicenseModal';
import { useLicense } from './hooks/useLicense';

const queryClient = new QueryClient();

function AppContent() {
  const queryClient = useQueryClient();
  const [appVersion, setAppVersion] = useState('1.0.0');
  const { valid: licenseValid, loading: licenseLoading, refreshLicense } = useLicense();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Clear auth on container restart by checking a session timestamp
    const authTime = localStorage.getItem('authTime');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    // If more than 1 hour passed or no timestamp, require re-auth
    if (!authTime || Date.now() - parseInt(authTime) > 3600000) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authTime');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userType');
      return false;
    }
    
    return isAuth;
  });
  const [userPermissions, setUserPermissions] = useState(() => {
    const stored = localStorage.getItem('userPermissions');
    return stored ? JSON.parse(stored) : [];
  });
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || 'admin';
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { data: authCheck, isLoading } = useQuery(
    ['auth-check'],
    async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/check`);
      return response.data;
    },
    {
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  useEffect(() => {
    if (authCheck && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [authCheck, isAuthenticated]);

  useEffect(() => {
    // Only show license modal after authentication is complete
    if (!licenseLoading && !licenseValid && isAuthenticated) {
      setShowLicenseModal(true);
    }
  }, [licenseValid, licenseLoading, isAuthenticated]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getVersion().then(version => {
        setAppVersion(version);
      });
    }
  }, []);

  const handleAuthSuccess = (authData = {}) => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('authTime', Date.now().toString());
    
    // Store JWT token and user ID
    if (authData.token) {
      localStorage.setItem('authToken', authData.token);
    }
    if (authData.userId) {
      localStorage.setItem('userId', authData.userId);
    }
    
    // Store user permissions and type
    const permissions = authData.permissions || [];
    const type = authData.userType || 'admin';
    setUserPermissions(permissions);
    setUserType(type);
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    localStorage.setItem('userType', type);
    
    // Store employee info if employee login
    if (authData.employeeId) {
      localStorage.setItem('employeeId', authData.employeeId);
      localStorage.setItem('employeeName', authData.employeeName);
    }
    
    // Invalidate auth check to refetch user count
    queryClient.invalidateQueries(['auth-check']);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowAuthModal(true);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTime');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('userType');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    setUserPermissions([]);
    setUserType('admin');
  };

  const handleLicenseValidated = () => {
    setShowLicenseModal(false);
    refreshLicense();
  };

  if (isLoading || licenseLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't block app startup with license modal
  // License modal will be shown as overlay instead

  if (!isAuthenticated && showAuthModal) {
    return (
      <AuthModal 
        onSuccess={handleAuthSuccess}
        queryClient={queryClient}
      />
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar onLogout={handleLogout} userPermissions={userPermissions} userType={userType} />
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employee-stats" element={<EmployeeStats />} />
              <Route path="/products" element={<Products />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/bulk" element={<BulkPurchasing />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/settings" element={<Settings />} />
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
        isOpen={showLicenseModal && isAuthenticated}
        onLicenseValidated={handleLicenseValidated}
        onLogout={handleLogout}
      />
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;