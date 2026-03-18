import React from 'react';

export function BulkPurchasingHeader({
  language,
  t,
  showPendingPayments,
  setShowPendingPayments,
  searchTerm,
  handleSearchChange,
  searchInputRef,
  setIsModalOpen
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">{t('bulkPurchasing')}</h1>
        {showPendingPayments && (
          <span className="bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
            Pending Payments
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={language === 'ur' ? 'انوائس یا رابطے سے تلاش کریں...' : 'Search by invoice or contact...'}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {showPendingPayments && (
            <button
              onClick={() => setShowPendingPayments(false)}
              className="px-3 py-2 text-sm border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors"
            >
              {t('allPurchases')}
            </button>
          )}
          {!showPendingPayments && (
            <button
              onClick={() => setShowPendingPayments(true)}
              className="px-3 py-2 text-sm border border-yellow-200 rounded-lg text-yellow-700 hover:bg-yellow-50 transition-colors"
            >
              {t('pendingPayments')}
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap w-full sm:w-auto"
          >
            {t('newPurchase')}
          </button>
        </div>
      </div>
    </div>
  );
}
