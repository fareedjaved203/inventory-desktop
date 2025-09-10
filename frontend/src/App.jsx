import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
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
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import NotFound from './pages/NotFound';
import AuthModal from './components/AuthModal';
import LicenseModal from './components/LicenseModal';
import SplashScreen from './components/SplashScreen';
import { useLicense } from './hooks/useLicense';

const queryClient = new QueryClient();

function AppContent() {
  const queryClient = useQueryClient();
  const [appVersion, setAppVersion] = useState('1.0.0');
  const { valid: licenseValid, loading: licenseLoading, refreshLicense } = useLicense();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
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
    // Mark initial load as complete once auth check is done
    if (authCheck !== undefined) {
      setIsInitialLoad(false);
    }
  }, [authCheck, isAuthenticated]);

  useEffect(() => {
    // Only show license modal after authentication is complete
    console.log('License check:', { licenseLoading, licenseValid, isAuthenticated });
    if (!licenseLoading && !licenseValid && isAuthenticated) {
      console.log('Showing license modal');
      setShowLicenseModal(true);
    } else if (!licenseLoading && licenseValid && isAuthenticated) {
      console.log('License is valid, hiding modal');
      setShowLicenseModal(false);
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
    
    // Redirect based on user type
    setTimeout(() => {
      if (type === 'superadmin') {
        window.location.replace('/super-admin');
      } else if (type === 'employee') {
        window.location.replace('/employee-stats');
      } else {
        // Regular admin user
        window.location.replace('/');
      }
    }, 100);
    
    // Refresh license status for non-super admin users
    if (type !== 'superadmin') {
      setTimeout(() => {
        refreshLicense();
      }, 500);
    }
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
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPassword');
    setUserPermissions([]);
    setUserType('admin');
  };

  const handleLicenseValidated = () => {
    setShowLicenseModal(false);
    refreshLicense();
  };

  // Splash screen removed - direct loading

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
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/super-admin" element={
                userType === 'superadmin' ? <SuperAdminDashboard /> : <Dashboard />
              } />
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