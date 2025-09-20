import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import DashboardCard from '../components/DashboardCard';
import SalesChart from '../components/SalesChart';
import SalesTrendChart from '../components/SalesTrendChart';
import BranchEmployeeSalesChart from '../components/BranchEmployeeSalesChart';
import AWSSpinner from '../components/AWSSpinner';
import { FaBox, FaWarehouse, FaExclamationTriangle, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaCalendar, FaSync } from 'react-icons/fa';
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { MdOutlinePayments } from "react-icons/md";
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';
import DashboardReportModal from '../components/DashboardReportModal';

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Fetch basic dashboard data
  const { data, isLoading, error } = useQuery(['dashboard'], async () => {
    const response = await api.get('/api/dashboard');
    return response.data;
  }, {
    retry: 2,
    staleTime: 30000
  });

  // Fetch enhanced sales statistics
  const { data: salesStats, isLoading: isLoadingStats, error: statsError } = useQuery(['dashboard-stats'], async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  }, {
    retry: 2,
    staleTime: 30000
  });

  const handleLowStockClick = () => {
    navigate('/products', { state: { showLowStock: true } });
  };

  const handlePendingPurchasePaymentsClick = () => {
    navigate('/bulk', { state: { showPendingPayments: true } });
  };
  
  const handlePendingSalePaymentsClick = () => {
    navigate('/sales', { state: { showPendingPayments: true } });
  };

  const handleDueCreditsClick = () => {
    navigate('/sales', { state: { showCreditBalance: true } });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries(['dashboard']);
    queryClient.invalidateQueries(['dashboard-stats']);
  };

  return (
    <div>
      <div className={`flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
        <h1 className="text-3xl font-bold text-primary-800">{t('dashboard')}</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h10a4 4 0 014 4v14a4 4 0 01-4 4z" />
            </svg>
            Generate Report
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
            disabled={isLoading || isLoadingStats}
          >
            {isLoading || isLoadingStats ? (
              <AWSSpinner size="sm" className="text-white" />
            ) : (
              <FaSync />
            )}
            {language === 'ur' ? 'ریفریش' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Inventory Stats */}
      <ErrorBoundary>
        <h2 className="text-xl font-semibold mb-4 text-primary-700">{language === 'ur' ? 'انوینٹری کا جائزہ' : 'Inventory Overview'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title={t('totalProducts')}
            value={data?.totalProducts || 0}
            icon={<FaBox className="text-xl" />}
            color="blue"
            isLoading={isLoading}
            error={error}
          />
          <DashboardCard
            title={t('totalInventory')}
            value={data?.totalInventory || 0}
            icon={<FaWarehouse className="text-xl" />}
            color="indigo"
            isLoading={isLoading}
            error={error}
          />
          <DashboardCard
            title={t('lowStock')}
            value={data?.lowStock || 0}
            icon={<FaExclamationTriangle className="text-xl" />}
            color="amber"
            isLoading={isLoading}
            error={error}
            onClick={handleLowStockClick}
            subtitle={language === 'ur' ? 'تفصیلات دیکھنے کے لیے کلک کریں' : 'Click to view details'}
          />
        </div>
      </ErrorBoundary>

      {/* Sales Stats */}
      <ErrorBoundary>
        <h2 className="text-xl font-semibold mb-4 text-primary-700">{language === 'ur' ? 'سیلز کی کارکردگی' : 'Sales Performance'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title={language === 'ur' ? 'آج کی سیلز' : 'Sales Today'}
            value={formatPakistaniCurrency(salesStats?.salesToday || 0)}
            icon={<FaCalendarDay className="text-xl" />}
            color="emerald"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title={language === 'ur' ? 'پچھلے 7 دن' : 'Last 7 Days'}
            value={formatPakistaniCurrency(salesStats?.salesLast7Days || 0)}
            icon={<FaCalendarWeek className="text-xl" />}
            color="teal"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title={language === 'ur' ? 'پچھلے 30 دن' : 'Last 30 Days'}
            value={formatPakistaniCurrency(salesStats?.salesLast30Days || 0)}
            icon={<FaCalendarAlt className="text-xl" />}
            color="cyan"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title={language === 'ur' ? 'پچھلے 365 دن' : 'Last 365 Days'}
            value={formatPakistaniCurrency(salesStats?.salesLast365Days || 0)}
            icon={<FaCalendar className="text-xl" />}
            color="sky"
            isLoading={isLoadingStats}
            error={statsError}
          />
        </div>
      </ErrorBoundary>

      {/* Profit Overview */}
      <ErrorBoundary>
        <h2 className="text-xl font-semibold mb-4 text-primary-700">{language === 'ur' ? 'منافع کا جائزہ' : 'Gross Profit Overview (Sales Only)'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Profit Today"
            value={formatPakistaniCurrency(salesStats?.profitToday || 0)}
            icon={<FaCalendarDay className="text-xl" />}
            color="violet"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title="Last 7 Days"
            value={formatPakistaniCurrency(salesStats?.profitLast7Days || 0)}
            icon={<FaCalendarWeek className="text-xl" />}
            color="purple"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title="Last 30 Days"
            value={formatPakistaniCurrency(salesStats?.profitLast30Days || 0)}
            icon={<FaCalendarAlt className="text-xl" />}
            color="fuchsia"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title="Last 365 Days"
            value={formatPakistaniCurrency(salesStats?.profitLast365Days || 0)}
            icon={<FaCalendar className="text-xl" />}
            color="pink"
            isLoading={isLoadingStats}
            error={statsError}
          />
        </div>
      </ErrorBoundary>

      {/* Expense Overview */}
      <ErrorBoundary>
        <h2 className="text-xl font-semibold mb-4 text-primary-700">Expense Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Expenses Today"
            value={formatPakistaniCurrency(salesStats?.expensesToday || 0)}
            icon={<FaCalendarDay className="text-xl" />}
            color="red"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title="Last 7 Days"
            value={formatPakistaniCurrency(salesStats?.expensesLast7Days || 0)}
            icon={<FaCalendarWeek className="text-xl" />}
            color="red"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title="Last 30 Days"
            value={formatPakistaniCurrency(salesStats?.expensesLast30Days || 0)}
            icon={<FaCalendarAlt className="text-xl" />}
            color="red"
            isLoading={isLoadingStats}
            error={statsError}
          />
          <DashboardCard
            title="Last 365 Days"
            value={formatPakistaniCurrency(salesStats?.expensesLast365Days || 0)}
            icon={<FaCalendar className="text-xl" />}
            color="red"
            isLoading={isLoadingStats}
            error={statsError}
          />
        </div>
      </ErrorBoundary>

      {/* Financial Overview */}
      <ErrorBoundary>
        <h2 className="text-xl font-semibold mb-4 text-primary-700">{language === 'ur' ? 'مالی جائزہ' : 'Financial Overview'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title={t('totalSales')}
            value={formatPakistaniCurrency(data?.totalSales || 0)}
            icon={<RiMoneyDollarCircleFill className="text-xl" />}
            color="slate"
            isLoading={isLoading}
            error={error}
          />
          <DashboardCard
            title="Purchase Due"
            value={formatPakistaniCurrency(salesStats?.totalPurchaseDueAmount || 0)}
            icon={<MdOutlinePayments className="text-xl" />}
            color="rose"
            isLoading={isLoadingStats}
            error={statsError}
            onClick={handlePendingPurchasePaymentsClick}
            subtitle="Click to view"
          />
          <DashboardCard
            title="Sales Due"
            value={formatPakistaniCurrency(salesStats?.totalSalesDueAmount || 0)}
            icon={<MdOutlinePayments className="text-xl" />}
            color="orange"
            isLoading={isLoadingStats}
            error={statsError}
            onClick={handlePendingSalePaymentsClick}
            subtitle="Click to view"
          />
          <DashboardCard
            title="Due Credits"
            value={formatPakistaniCurrency(salesStats?.totalDueCredits || 0)}
            icon={<RiMoneyDollarCircleFill className="text-xl" />}
            color="lime"
            isLoading={isLoadingStats}
            error={statsError}
            onClick={handleDueCreditsClick}
            subtitle="Click to view"
          />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="mb-8">
          <SalesTrendChart />
        </div>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <div className="mb-8">
          <SalesChart />
        </div>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <div className="mb-8">
          <BranchEmployeeSalesChart />
        </div>
      </ErrorBoundary>
      
      <DashboardReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </div>
  );
}

export default Dashboard;