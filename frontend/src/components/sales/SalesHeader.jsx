import { useQueryClient } from "@tanstack/react-query";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import GenerateTodayInvoiceButton from "../GenerateTodayInvoiceButton";
import { useTranslation } from "../../utils/translations";

function SalesHeader({
  language,
  searchTerm,
  onSearchChange,
  selectedDate,
  onDateChange,
  onClearDate,
  showPendingPayments,
  showCreditBalance,
  setShowPendingPayments,
  setShowCreditBalance,
  sales,
  debouncedSearchTerm,
  onNewSale,
  searchInputRef,
}) {
  const queryClient = useQueryClient();
  const t = useTranslation(language);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">
              {t("sales")}
            </h1>
            {showPendingPayments && (
              <span className="bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                Pending Payments
              </span>
            )}
            {showCreditBalance && (
              <span className="bg-gradient-to-r from-green-50 to-green-100 text-green-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-green-200 shadow-sm">
                Credit Balance
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search bill, contact, or order booker..."
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={onDateChange}
                className="pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
                <FaCalendarAlt />
              </div>
            </div>
            {(showPendingPayments || showCreditBalance) && (
              <button
                onClick={() => { setShowPendingPayments(false); setShowCreditBalance(false); }}
                className="px-3 py-2 text-sm border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors"
              >
                {t("allSales")}
              </button>
            )}
            {!showPendingPayments && !showCreditBalance && (
              <>
                <button
                  onClick={() => { setShowPendingPayments(true); setShowCreditBalance(false); }}
                  className="px-3 py-2 text-sm border border-yellow-200 rounded-lg text-yellow-700 hover:bg-yellow-50 transition-colors"
                >
                  {t("pendingPayments")}
                </button>
                <button
                  onClick={() => { setShowCreditBalance(true); setShowPendingPayments(false); }}
                  className="px-3 py-2 text-sm border border-green-200 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
                >
                  {t("creditBalance")}
                </button>
              </>
            )}
            <button
              onClick={onNewSale}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap w-full sm:w-auto"
            >
              New Sale
            </button>
            <GenerateTodayInvoiceButton sales={sales} />
          </div>
        </div>
      </div>

      <div className="my-6 flex justify-between items-center">
        <div>
          {(selectedDate || debouncedSearchTerm) && (
            <div className="mt-2">
              <span className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                {sales?.total || 0} {t("results")}
              </span>
            </div>
          )}
        </div>
        <div>
          {selectedDate && (
            <button
              onClick={() => { onClearDate(); queryClient.invalidateQueries(["sales", ""]); }}
              className="px-3 py-2 text-sm border border-primary-600 bg-primary-600 rounded-lg hover:bg-primary-700 text-white"
            >
              {t("clear")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default SalesHeader;
