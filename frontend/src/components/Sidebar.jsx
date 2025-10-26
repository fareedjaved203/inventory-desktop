import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import API from '../utils/api';
import { FaChevronLeft, FaChevronRight, FaChartLine, FaBoxOpen, FaMoneyBillWave, FaBuilding, FaShoppingCart, FaUndo, FaCog, FaCodeBranch, FaUsers, FaCashRegister, FaTag, FaBars, FaTimes, FaTruck, FaEye, FaEyeSlash, FaUtensils } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useSidebar } from '../contexts/SidebarContext';
import LanguageToggle from './LanguageToggle';

function Sidebar({ onLogout, userPermissions = [], userType = 'admin', isMobileOpen, setIsMobileOpen }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { isItemHidden, toggleItemVisibility } = useSidebar();

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobileOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [location.pathname, isMobile, setIsMobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobile, isMobileOpen]);

  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const result = await API.getShopSettings();
    return result.items?.[0] || {};
  }, {
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const allMenuItems = [
    { path: '/', label: t('dashboard'), icon: <FaChartLine />, permission: 'dashboard' },
    { path: '/pos', label: t('pos'), icon: <FaCashRegister />, permission: 'pos' },
    { path: '/employee-stats', label: t('employeeStats'), icon: <FaChartLine />, permission: 'employee-stats', employeeOnly: true },
    { path: '/products', label: t('products'), icon: <FaBoxOpen />, permission: 'products' },
    { path: '/categories', label: 'Categories', icon: <FaTag />, permission: 'categories' },
    { path: '/manufacturing', label: 'Recipe', icon: <FaUtensils />, permission: 'manufacturing' },
    { path: '/product-labels', label: t('productLabels'), icon: <FaTag />, permission: 'products' },
    { path: '/sales', label: t('sales'), icon: <FaMoneyBillWave />, permission: 'sales' },
    { path: '/contacts', label: t('contacts'), icon: <FaBuilding />, permission: 'contacts' },
    { path: '/bulk', label: t('bulkPurchasing'), icon: <FaShoppingCart />, permission: 'bulk-purchases' },
    { path: '/returns', label: t('returns'), icon: <FaUndo />, permission: 'returns' },
    { path: '/expenses', label: t('expenses'), icon: <FaMoneyBillWave />, permission: 'expenses' },
    { path: '/branches', label: t('branches'), icon: <FaCodeBranch />, permission: 'branches' },
    { path: '/employees', label: t('employees'), icon: <FaUsers />, permission: 'employees' },
    { path: '/settings', label: t('settings'), icon: <FaCog />, permission: 'settings' },
  ];

  // Filter menu items based on user permissions and visibility settings
  const menuItems = userType === 'superadmin'
    ? [] // Super admin has no sidebar menu items
    : userType === 'admin' 
    ? allMenuItems.filter(item => !item.employeeOnly && !isItemHidden(item.permission))
    : allMenuItems.filter(item => 
        (item.employeeOnly || userPermissions.includes(item.permission)) && !isItemHidden(item.permission)
      );

  // Get available menu items for customization (not filtered by visibility)
  const availableMenuItems = userType === 'superadmin'
    ? []
    : userType === 'admin' 
    ? allMenuItems.filter(item => !item.employeeOnly)
    : allMenuItems.filter(item => 
        item.employeeOnly || userPermissions.includes(item.permission)
      );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? `fixed left-0 top-0 h-full w-64 transform transition-transform duration-300 ease-in-out z-50 ${
              isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }` 
          : `${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`
        } 
        bg-gradient-to-b from-primary-700 to-primary-900 text-white shadow-xl h-full flex flex-col 
        ${language === 'ur' ? 'font-urdu' : ''}
      `}>
      <div className={`p-4 flex ${collapsed && !isMobile ? 'justify-center' : 'justify-between'} items-center border-b border-primary-600`}>
        {/* Mobile Close Button */}
        {isMobile && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-full hover:bg-primary-600 text-white md:hidden"
          >
            <FaTimes />
          </button>
        )}
        
        {(!collapsed || isMobile) && (
          <div className={`${isMobile ? 'flex-1 ml-2' : 'flex-1'}`}>
            <h1 className="text-xl font-bold text-white mb-2">
              {shopSettings?.shopName || 'Inventory System'}
            </h1>
            <LanguageToggle />
          </div>
        )}
        
        {/* Desktop Buttons */}
        {!isMobile && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCustomizeModal(true)}
              className="p-2 rounded-full hover:bg-primary-600 text-white"
              title="Customize Sidebar"
            >
              <FaCog />
            </button>
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="p-2 rounded-full hover:bg-primary-600 text-white"
            >
              {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>
        )}
      </div>
      <nav className="mt-6 flex-1 overflow-y-auto sidebar-nav" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#358FD4 transparent'
      }}>
        <style>{`
          .sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-nav::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-nav::-webkit-scrollbar-thumb {
            background: #044A80;
            border-radius: 3px;
          }
          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: #0369a1;
          }
        `}</style>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center ${collapsed && !isMobile ? 'justify-center' : 'px-6'} py-4 text-white hover:bg-primary-600 active:bg-primary-500 transition-colors ${
              location.pathname === item.path ? 'bg-primary-600 border-l-4 border-accent-400' : ''
            } ${isMobile ? 'min-h-[48px]' : ''}`}
            title={collapsed && !isMobile ? item.label : ''}
          >
            <span className={`text-xl ${isMobile ? 'mr-4' : 'mr-4'}`}>{item.icon}</span>
            {(!collapsed || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-primary-600">
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${collapsed && !isMobile ? 'justify-center' : 'px-2'} py-3 text-red-300 hover:bg-red-600 hover:text-white active:bg-red-700 rounded-lg transition-colors ${isMobile ? 'min-h-[48px]' : ''}`}
          title={collapsed && !isMobile ? 'Logout' : ''}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          {(!collapsed || isMobile) && <span className="ml-3 text-sm font-medium">{t('logout')}</span>}
        </button>
      </div>
      
      <div className="p-4 text-center text-xs text-primary-300">
        {(!collapsed || isMobile) && <p>Hisab Ghar</p>}
      </div>
      </div>

      {/* Customize Sidebar Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Customize Sidebar</h2>
              <p className="text-gray-600 mb-4 text-sm">Show or hide sidebar items according to your preference.</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableMenuItems.map((item) => (
                  <div key={item.permission} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{item.icon}</span>
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                    <button
                      onClick={() => toggleItemVisibility(item.permission)}
                      className={`p-1 rounded ${
                        isItemHidden(item.permission) 
                          ? 'text-gray-400 hover:text-gray-600' 
                          : 'text-blue-500 hover:text-blue-700'
                      }`}
                    >
                      {isItemHidden(item.permission) ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;