import { useState } from "react";
import LoadingSpinner from "../LoadingSpinner";
import { formatPakistaniCurrency } from "../../utils/formatCurrency";
import { useTranslation } from "../../utils/translations";

function SaleItemsCell({ sale }) {
  const returnedQuantities = {};
  if (Array.isArray(sale.returns)) {
    sale.returns.forEach((ret) => {
      ret.items?.forEach((ri) => {
        if (ri.productId) returnedQuantities[ri.productId] = (returnedQuantities[ri.productId] || 0) + Number(ri.quantity);
      });
    });
  }
  const consolidatedItems = {};
  if (Array.isArray(sale.items)) {
    sale.items.forEach((item) => {
      if (consolidatedItems[item.product?.id]) {
        consolidatedItems[item.product.id].quantity += item.quantity;
      } else {
        consolidatedItems[item.product?.id] = { product: item.product, quantity: Number(item.quantity), returnedQuantity: Number(returnedQuantities[item.product?.id]) || 0 };
      }
    });
  }
  return (
    <>
      {Object.values(consolidatedItems).map((item, index) => (
        <div key={item.product?.id || index} className="text-sm flex items-center gap-2 flex-wrap">
          <span className="whitespace-nowrap">
            {item.product?.name || "Unknown Product"} x {Number(item.quantity) % 1 === 0 ? item.quantity : Number(item.quantity).toFixed(2)} {item.product?.unit || ""}
          </span>
          {item.returnedQuantity > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
              -{Number(item.returnedQuantity)} returned
            </span>
          )}
        </div>
      ))}
    </>
  );
}

function PaidAmountCell({ sale, auditTrails, t }) {
  const originalAmount = Number(sale.totalAmount);
  const returnedAmount = Array.isArray(sale.returns) ? sale.returns.reduce((sum, ret) => sum + Number(ret.totalAmount || 0), 0) : 0;
  const totalRefunded = Array.isArray(sale.returns) ? sale.returns.reduce((sum, ret) => sum + (ret.refundPaid ? Number(ret.refundAmount || 0) : 0), 0) : 0;
  const netAmount = Math.max(originalAmount - returnedAmount, 0);
  const balance = netAmount - Number(sale.paidAmount || 0) + totalRefunded;
  const hasReturns = Array.isArray(sale.returns) && sale.returns.length > 0;
  const hasRefunds = hasReturns && sale.returns.some((ret) => ret.refundPaid);

  return (
    <div>
      {balance > 0 ? (
        <div className="flex items-center">
          <span className="text-yellow-600 font-medium">{formatPakistaniCurrency(sale.paidAmount)}</span>
          <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 rounded-full border border-yellow-200 shadow-sm">
            {t("due")}: {formatPakistaniCurrency(balance)}
          </span>
        </div>
      ) : balance < 0 ? (
        <div className="flex items-center">
          <span className="text-green-600 font-medium">{formatPakistaniCurrency(sale.paidAmount)}</span>
          <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-red-50 to-red-100 text-red-800 rounded-full border border-red-200 shadow-sm">
            {t("credit")}: {formatPakistaniCurrency(Math.abs(balance))}
          </span>
        </div>
      ) : (
        <div className="flex items-center">
          <span className="text-green-600 font-medium">{formatPakistaniCurrency(sale.paidAmount)}</span>
          {hasRefunds ? (
            <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-full border border-blue-200 shadow-sm">{t("refunded")}</span>
          ) : (
            <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-800 rounded-full border border-green-200 shadow-sm">{t("settled")}</span>
          )}
        </div>
      )}
      {auditTrails?.[sale.id]?.length > 0 && (
        <div className="mt-1">
          <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Updated
          </span>
        </div>
      )}
    </div>
  );
}

function SalesTable({ sales, auditTrails, isFetching, debouncedSearchTerm, selectedDate, showPendingPayments, showCreditBalance, currentPage, itemsPerPage, setCurrentPage, language, onView, onEdit, onDelete }) {
  const t = useTranslation(language);

  const allColumns = [
    { key: 'billNumber', label: 'Bill Number', default: true },
    { key: 'date', label: 'Date', default: true },
    { key: 'contact', label: 'Contact', default: true },
    { key: 'orderBooker', label: 'Order Booker', default: false },
    { key: 'carNumber', label: 'Car Number', default: false },
    { key: 'items', label: 'Items', default: true },
    { key: 'totalAmount', label: 'Total Amount', default: true },
    { key: 'paidAmount', label: 'Paid Amount', default: true },
    { key: 'actions', label: 'Actions', default: true },
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('salesVisibleColumns');
    if (saved) return JSON.parse(saved);
    return allColumns.filter(c => c.default).map(c => c.key);
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const toggleColumn = (key) => {
    const updated = visibleColumns.includes(key)
      ? visibleColumns.filter(k => k !== key)
      : [...visibleColumns, key];
    setVisibleColumns(updated);
    localStorage.setItem('salesVisibleColumns', JSON.stringify(updated));
  };

  const isVisible = (key) => visibleColumns.includes(key);

  return (
    <>
      {/* Column Picker */}
      <div className="flex justify-end mb-2 relative">
        <button
          onClick={() => setShowColumnPicker(!showColumnPicker)}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Columns
        </button>
        {showColumnPicker && (
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[160px]">
            {allColumns.map(col => (
              <label key={col.key} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-700">{col.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100">
        <table className="w-full divide-y divide-gray-200" style={{ minWidth: "600px" }}>
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              {allColumns.filter(c => isVisible(c.key)).map((c) => (
                <th key={c.key} className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetching && (debouncedSearchTerm || selectedDate || showPendingPayments || showCreditBalance) ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              sales?.items?.map((sale) => (
                <tr key={sale.id} className={`hover:bg-primary-50 transition-colors ${auditTrails?.[sale.id]?.length > 0 ? "bg-blue-50 border-l-4 border-blue-400" : ""}`}>
                  {isVisible('billNumber') && <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">#{sale.billNumber}</td>}
                  {isVisible('date') && <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {new Date(sale.saleDate).toLocaleDateString("en-GB", { timeZone: "UTC" })}
                  </td>}
                  {isVisible('contact') && <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {sale.contact ? <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{sale.contact.name}</span> : <span className="text-gray-400 text-sm">-</span>}
                  </td>}
                  {isVisible('orderBooker') && <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {sale.orderBooker ? <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{sale.orderBooker.name}</span> : <span className="text-gray-400 text-sm">-</span>}
                  </td>}
                  {isVisible('carNumber') && <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {sale.carNumber ? <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">{sale.carNumber}</span> : <span className="text-gray-400 text-sm">-</span>}
                  </td>}
                  {isVisible('items') && <td className="px-6 py-4 text-gray-700" style={{ minWidth: "300px" }}>
                    <div className="space-y-1">
                      <SaleItemsCell sale={sale} />
                      {auditTrails?.[sale.id]?.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <div className="text-xs text-blue-700 font-medium mb-1">Payment Updates:</div>
                          {auditTrails[sale.id].filter((a) => a.fieldName === "paidAmount").slice(0, 2).map((audit, idx) => (
                            <div key={idx} className="text-xs text-blue-600">
                              {audit.description && <div className="italic">{audit.description}</div>}
                              <div>{new Date(audit.changedAt).toLocaleDateString()} - Rs.{audit.oldValue} → Rs.{audit.newValue}</div>
                            </div>
                          ))}
                          {auditTrails[sale.id].filter((a) => a.fieldName === "paidAmount").length > 2 && (
                            <div className="text-xs text-blue-500 italic">+{auditTrails[sale.id].filter((a) => a.fieldName === "paidAmount").length - 2} more updates</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>}
                  {isVisible('totalAmount') && <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-800">{formatPakistaniCurrency(sale.totalAmount)}</td>}
                  {isVisible('paidAmount') && <td className="px-6 py-4 whitespace-nowrap">
                    <PaidAmountCell sale={sale} auditTrails={auditTrails} t={t} />
                  </td>}
                  {isVisible('actions') && <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button onClick={() => onView(sale)} className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t("view")}
                      </button>
                      <button onClick={() => onEdit(sale)} className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        {t("edit")}
                      </button>
                      <button onClick={() => onDelete(sale)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        {t("delete")}
                      </button>
                    </div>
                  </td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex space-x-2">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50">
            {t("previous")}
          </button>
          <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
            {language === "ur" ? `صفحہ ${currentPage} از ${Math.ceil((sales?.total || 0) / itemsPerPage)}` : `Page ${currentPage} of ${Math.ceil((sales?.total || 0) / itemsPerPage)}`}
          </span>
          <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= Math.ceil((sales?.total || 0) / itemsPerPage)} className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50">
            {t("next")}
          </button>
        </div>
      </div>
    </>
  );
}

export default SalesTable;
