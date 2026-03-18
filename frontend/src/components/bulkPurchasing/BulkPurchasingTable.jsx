import React from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function BulkPurchasingTable({
  t,
  isFetching,
  debouncedSearchTerm,
  showPendingPayments,
  purchases,
  auditTrails,
  handleEdit,
  setSelectedPurchase,
  setDetailsModalOpen,
  handleDelete
}) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-primary-50 to-secondary-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('invoiceNumber')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('date')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('contact')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Items</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('totalAmount')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('paidAmount')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isFetching && (debouncedSearchTerm || showPendingPayments) ? (
            <tr>
              <td colSpan="7" className="px-6 py-8 text-center">
                <div className="flex justify-center items-center">
                  <LoadingSpinner size="w-6 h-6" />
                  <span className="ml-2 text-gray-500">Searching...</span>
                </div>
              </td>
            </tr>
          ) : (
            purchases?.items?.map((purchase) => (
            <tr key={purchase.id} className={`hover:bg-primary-50 transition-colors ${purchase.totalAmount > purchase.paidAmount ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''} ${auditTrails?.[purchase.id]?.length > 0 ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">
                {purchase.invoiceNumber || `#${purchase.id.slice(-6)}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                {new Date(purchase.purchaseDate).toLocaleDateString('en-GB')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                {purchase.contact.name}
              </td>
              <td className="px-6 py-4 text-gray-700" style={{ minWidth: "300px" }}>
                <div className="space-y-1">
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((item, index) => (
                      <div key={index} className="text-sm flex items-center gap-2 flex-wrap">
                        <span className="whitespace-nowrap">
                          {item.product?.name || "Unknown Product"} x {Number(item.quantity) % 1 === 0 ? item.quantity : Number(item.quantity).toFixed(2)} {item.product?.unit || ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No items</span>
                  )}
                  {auditTrails?.[purchase.id]?.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div className="text-xs text-blue-700 font-medium mb-1">Payment Updates:</div>
                      {auditTrails[purchase.id]
                        .filter(audit => audit.fieldName === 'paidAmount')
                        .slice(0, 2)
                        .map((audit, idx) => (
                          <div key={idx} className="text-xs text-blue-600">
                            {audit.description && (
                              <div className="italic">{audit.description}</div>
                            )}
                            <div>
                              {new Date(audit.changedAt).toLocaleDateString()} - 
                              Rs.{audit.oldValue} → Rs.{audit.newValue}
                            </div>
                          </div>
                        ))}
                      {auditTrails[purchase.id].filter(audit => audit.fieldName === 'paidAmount').length > 2 && (
                        <div className="text-xs text-blue-500 italic">+{auditTrails[purchase.id].filter(audit => audit.fieldName === 'paidAmount').length - 2} more updates</div>
                      )}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-800">
                {formatPakistaniCurrency(purchase.totalAmount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  {purchase.totalAmount > purchase.paidAmount ? (
                    <div className="flex items-center">
                      <span className="text-yellow-600 font-medium">{formatPakistaniCurrency(purchase.paidAmount)}</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 rounded-full border border-yellow-200 shadow-sm">
                        {t('due')}: {formatPakistaniCurrency(purchase.totalAmount - purchase.paidAmount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-green-600 font-medium">{formatPakistaniCurrency(purchase.paidAmount)}</span>
                  )}
                  {auditTrails?.[purchase.id]?.length > 0 && (
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
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPurchase(purchase);
                      setDetailsModalOpen(true);
                    }}
                    className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('view')}
                  </button>
                  <button
                    onClick={() => handleEdit(purchase)}
                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(purchase)}
                    className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    {t('delete')}
                  </button>
                </div>
              </td>
            </tr>
          ))
          )}
        </tbody>
      </table>
    </div>
  );
}
