import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaSearch, FaCalendarAlt, FaUser, FaTimes, FaChevronDown } from "react-icons/fa";
import GenerateTodayInvoiceButton from "../GenerateTodayInvoiceButton";
import { useTranslation } from "../../utils/translations";
import API from "../../utils/api";

function ContactFilterDropdown({ contacts, contactFilter, setContactFilter }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedName = contacts.find((c) => c.id === contactFilter)?.name;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[160px] text-left"
      >
        <span className="truncate flex-1">{selectedName || "All Contacts"}</span>
        {contactFilter ? (
          <FaTimes
            className="text-gray-400 hover:text-red-500 flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); setContactFilter(""); setSearch(""); }}
          />
        ) : (
          <FaChevronDown className="text-gray-400 flex-shrink-0 text-xs" />
        )}
      </button>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
        <FaUser />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { setContactFilter(""); setSearch(""); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-primary-50 ${!contactFilter ? "bg-primary-50 font-medium text-primary-700" : "text-gray-700"}`}
            >
              All Contacts
            </button>
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setContactFilter(c.id); setSearch(""); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-primary-50 ${contactFilter === c.id ? "bg-primary-50 font-medium text-primary-700" : "text-gray-700"}`}
              >
                {c.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No contacts found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  contactFilter,
  setContactFilter,
}) {
  const queryClient = useQueryClient();
  const t = useTranslation(language);

  const { data: contacts = [] } = useQuery(
    ['sales-contacts-filter'],
    async () => {
      const result = await API.getContacts({ limit: 500 });
      return result.items || [];
    },
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <>
      <div className="flex flex-col gap-4 mb-8">
        {/* Top row: Title + New Sale */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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
          <div className="flex gap-2">
            <button
              onClick={onNewSale}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap"
            >
              New Sale
            </button>
            <GenerateTodayInvoiceButton sales={sales} />
          </div>
        </div>

        {/* Filters row: Search on left, filters + status on right */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search bill, contact, or order booker..."
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <ContactFilterDropdown contacts={contacts} contactFilter={contactFilter} setContactFilter={setContactFilter} />
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
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div>
          {(selectedDate || debouncedSearchTerm || contactFilter) && (
            <span className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border border-blue-200 shadow-sm">
              {sales?.total || 0} {t("results")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
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
