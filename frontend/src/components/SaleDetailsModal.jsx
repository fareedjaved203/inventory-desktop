import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import API from '../utils/api';
import SaleInvoicePDF from './SaleInvoicePDF';
import UrduInvoiceHTML from './UrduInvoiceHTML';
import PDFPreferencesModal from './PDFPreferencesModal';

function formatPakistaniCurrency(amount, showCurrency = true) {
  if (amount === null || amount === undefined) return showCurrency ? 'Rs.0.00' : '0.00';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return showCurrency ? 'Rs.0.00' : '0.00';
  
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  let formattedInteger = '';
  const length = integerPart.length;
  
  if (length <= 3) {
    formattedInteger = integerPart;
  } else {
    formattedInteger = integerPart.substring(length - 3);
    let remaining = integerPart.substring(0, length - 3);
    while (remaining.length > 0) {
      const chunk = remaining.substring(Math.max(0, remaining.length - 2));
      formattedInteger = chunk + ',' + formattedInteger;
      remaining = remaining.substring(0, Math.max(0, remaining.length - 2));
    }
  }
  
  return (showCurrency ? 'Rs.' : '') + formattedInteger + '.' + decimalPart;
}

function SaleDetailsModal({ sale, isOpen, onClose }) {
  const [creditPayment, setCreditPayment] = useState({});
  const [processingRefund, setProcessingRefund] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPDFPreferences, setShowPDFPreferences] = useState(false);
  const [pdfPreferences, setPdfPreferences] = useState({});
  const queryClient = useQueryClient();
  
  // Fetch audit trail for this sale
  const { data: auditTrail } = useQuery(
    ['sale-audit-trail', sale?.id],
    async () => {
      if (!sale?.id) return [];
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audit-trail/Sale/${sale.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        return await response.json();
      } catch (error) {
        console.error('Error fetching audit trail:', error);
        return [];
      }
    },
    { enabled: Boolean(sale?.id && isOpen) }
  );
  
  // Reset state when modal opens with a new sale
  useEffect(() => {
    if (isOpen && sale) {
      setCreditPayment({});
      setSuccessMessage('');
      // Load PDF preferences
      const saved = localStorage.getItem('pdfPreferences');
      if (saved) {
        setPdfPreferences(JSON.parse(saved));
      }
    }
  }, [isOpen, sale?.id]);
  
  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const response = await API.get('/shop-settings');
    return response.data;
  });

  const payCredit = useMutation(
    async (paymentData) => {
      let response;
      
      // Set processing state for this specific return
      if (paymentData.returnId) {
        setCreditPayment(prev => ({
          ...prev,
          [paymentData.returnId]: {
            amount: paymentData.amount,
            processing: true
          }
        }));
        
        // Pay refund for specific return
        response = await API.post(
          `/returns/${paymentData.returnId}/pay-credit`,
          { amount: paymentData.amount }
        );
      } else if (paymentData.saleId) {
        // Set processing state for direct credit refund
        setCreditPayment(prev => ({
          ...prev,
          saleRefund: {
            amount: paymentData.amount,
            processing: true
          }
        }));
        
        // Pay direct credit refund
        response = await API.post(
          `/sales/${paymentData.saleId}/pay-credit`,
          { amount: paymentData.amount }
        );
      }
      
      return response.data;
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['sales']);
        queryClient.invalidateQueries(['sale-audit-trail']);
        
        // Reset processing state but keep the amount for UI feedback
        if (variables.returnId) {
          setCreditPayment(prev => ({
            ...prev,
            [variables.returnId]: {
              amount: variables.amount,
              processing: false,
              completed: true
            }
          }));
        } else {
          // For "Refund All", also update the sale object to show refunds as paid
          if (sale.returns) {
            sale.returns.forEach(ret => {
              if (!ret.refundPaid && ret.refundAmount > 0) {
                ret.refundPaid = true;
                ret.refundDate = new Date().toISOString();
              }
            });
          }
          
          setCreditPayment(prev => ({
            ...prev,
            saleRefund: {
              amount: variables.amount,
              processing: false,
              completed: true
            }
          }));
        }
        
        const amount = variables.amount;
        toast.success(`Refund of Rs.${amount} processed successfully!`);
        setSuccessMessage(`Refund of Rs.${amount} processed successfully!`);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.error || 'Failed to process refund';
        toast.error(errorMessage);
      }
    }
  );

  const handleMarkRefundPaid = (returnId) => {
    payCredit.mutate({ returnId, amount: 0 });
  };

  if (!isOpen || !sale) return null;

  // Debug: Check sale object structure
  console.log('Sale object:', sale);
  console.log('Sale discount:', sale.discount);

  // Check if any individual return has been refunded
  const hasIndividualRefunds = Object.keys(creditPayment).some(key => 
    key !== 'saleRefund' && creditPayment[key]?.completed
  );

  // Check if full credit has been refunded
  const hasFullRefund = creditPayment.saleRefund?.completed;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        <div className="flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Sale Details</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                if (window.openReturnModal) {
                  window.openReturnModal(sale, 'partial');
                }
              }}
              disabled={!sale.items.some(item => (item.remainingQuantity || item.quantity) > 0)}
              className={`px-3 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm ${
                !sale.items?.some(item => (item.remainingQuantity || item.quantity) > 0)
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              Return Items
            </button>
            <button
              onClick={() => {
                onClose();
                if (window.openReturnModal) {
                  window.openReturnModal(sale, 'full');
                }
              }}
              disabled={!sale.items.some(item => (item.remainingQuantity || item.quantity) > 0)}
              className={`px-3 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm ${
                !sale.items.some(item => (item.remainingQuantity || item.quantity) > 0)
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Return Entire Sale
            </button>
            {!sale.items?.some(item => (item.remainingQuantity || item.quantity) > 0) && (
              <div className="text-sm text-gray-500 italic">
                No items available to return
              </div>
            )}
            <button
              onClick={() => setShowPDFPreferences(true)}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 shadow-sm flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              PDF Settings
            </button>
            <button
              onClick={() => {
                import('@react-pdf/renderer').then(({ pdf }) => {
                  pdf(<SaleInvoicePDF sale={sale} shopSettings={shopSettings} preferences={pdfPreferences} />)
                    .toBlob()
                    .then(blob => {
                      const url = URL.createObjectURL(blob);
                      const printWindow = window.open(url, '_blank');
                      printWindow.onload = () => {
                        printWindow.print();
                        URL.revokeObjectURL(url);
                      };
                    });
                });
              }}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-lg hover:from-green-700 hover:to-green-800 shadow-sm flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015-1.837-2.175a48.041 48.041 0 711.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print PDF
            </button>
            <UrduInvoiceHTML sale={sale} shopSettings={shopSettings} preferences={pdfPreferences} />
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
              <span>{successMessage}</span>
              <button 
                onClick={() => setSuccessMessage('')}
                className="text-green-700 hover:text-green-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">#{sale.billNumber}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{new Date(sale.saleDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Contact</p>
                <p className="font-medium">
                  {sale.contact ? (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {sale.contact.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">Not specified</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Car Number</p>
                <p className="font-medium">{sale.carNumber || <span className="text-gray-400">Not specified</span>}</p>
              </div>
              <div>
                <p className="text-gray-600">Transport Cost</p>
                <p className="font-medium">{sale.transportCost ? formatPakistaniCurrency(sale.transportCost) : <span className="text-gray-400">Not specified</span>}</p>
              </div>
            </div>
            {(sale.loadingDate || sale.arrivalDate) && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-gray-600">Loading Date</p>
                  <p className="font-medium">{sale.loadingDate ? new Date(sale.loadingDate).toLocaleDateString() : <span className="text-gray-400">Not specified</span>}</p>
                </div>
                <div>
                  <p className="text-gray-600">Arrival Date</p>
                  <p className="font-medium">{sale.arrivalDate ? new Date(sale.arrivalDate).toLocaleDateString() : <span className="text-gray-400">Not specified</span>}</p>
                </div>
              </div>
            )}
            {sale.description && (
              <div className="mt-4">
                <p className="text-gray-600">Description</p>
                <p className="font-medium">{sale.description}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Items</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Calculate returned quantities from returns data
                    const returnedQuantities = {};
                    if (Array.isArray(sale.returns)) {
                      sale.returns.forEach(returnRecord => {
                        if (returnRecord.items && Array.isArray(returnRecord.items)) {
                          returnRecord.items.forEach(returnItem => {
                            if (returnItem.productId) {
                              returnedQuantities[returnItem.productId] = (returnedQuantities[returnItem.productId] || 0) + Number(returnItem.quantity);
                            }
                          });
                        }
                      });
                    }
                    
                    // Consolidate items by product ID
                    const consolidatedItems = {};
                    if (Array.isArray(sale.items)) {
                      sale.items.forEach(item => {
                        if (consolidatedItems[item.product?.id]) {
                          consolidatedItems[item.product.id].quantity += item.quantity;
                        } else {
                          consolidatedItems[item.product?.id] = {
                            product: item.product,
                            quantity: Number(item.quantity),
                            price: item.price,
                            returnedQuantity: Number(returnedQuantities[item.product?.id]) || 0
                          };
                        }
                      });
                    }
                    
                    return Object.values(consolidatedItems).map((item, index) => (
                      <tr key={item.product?.id || index} className={item.returnedQuantity > 0 ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {item.product?.name}
                            {item.returnedQuantity > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                </svg>
                                {Number(item.returnedQuantity)} Returned
                              </span>
                            )}
                            {item.returnedQuantity === item.quantity && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                Fully Returned
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div>{Number(item.quantity)}</div>
                          {item.returnedQuantity > 0 && (
                            <div className="text-xs text-red-600">
                              -{Number(item.returnedQuantity)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          Rs.{(Number(item.price) || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div>Rs.{((Number(item.price) || 0) * Number(item.quantity)).toFixed(2)}</div>
                          {item.returnedQuantity > 0 && (
                            <div className="text-xs text-red-600">
                              -Rs.{((Number(item.price) || 0) * Number(item.returnedQuantity)).toFixed(2)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Subtotal
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs.{sale.originalTotalAmount}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium text-green-600">
                      Discount
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      -Rs.{(Number(sale.discount) || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Total Amount
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs.{(Number(sale.totalAmount) || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Paid Amount
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs.{(Number(sale.paidAmount) || 0).toFixed(2)}
                    </td>
                  </tr>
                  {sale.returns?.length > 0 && (
                    <>
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right font-medium text-red-600">
                          Total Returned
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-red-600">
                          -Rs.{sale.returns.reduce((sum, ret) => sum + (Number(ret.totalAmount) || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                      {sale.returns.some(ret => ret.refundPaid) && (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-right font-medium text-green-600">
                            Total Refunded
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-green-600">
                            Rs.{sale.returns.reduce((sum, ret) => sum + (ret.refundPaid ? (Number(ret.refundAmount) || 0) : 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Net Total After Returns
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs.{Math.max(((Number(sale.totalAmount) || 0) - (sale.returns?.reduce((sum, ret) => sum + (Number(ret.totalAmount) || 0), 0) || 0)), 0).toFixed(2)}
                    </td>

                  </tr>
                  {(() => {
                    const netAmount = (Number(sale.totalAmount) || 0) - (sale.returns?.reduce((sum, ret) => sum + (Number(ret.totalAmount) || 0), 0) || 0);
                    const totalRefunded = (sale.returns?.reduce((sum, ret) => sum + (ret.refundPaid ? (Number(ret.refundAmount) || 0) : 0), 0) || 0);
                    const balance = netAmount - (Number(sale.paidAmount) || 0) + totalRefunded;
                    
                    // Check if all credit has been refunded
                    const allCreditRefunded = hasFullRefund || 
                      (hasIndividualRefunds && 
                       Object.keys(creditPayment)
                         .filter(key => key !== 'saleRefund')
                         .reduce((sum, key) => sum + parseFloat(creditPayment[key]?.amount || 0), 0) >= Math.abs(balance));
                    
                    return balance > 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right font-medium">
                          Updated Balance Due
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-yellow-600">
                          Rs.{balance.toFixed(2)}
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Payment Due
                          </span>
                        </td>
                      </tr>
                    ) : balance < 0 && Math.abs(balance) <= (Number(sale.paidAmount) || 0) ? (
                      <>
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-right font-medium">
                            Credit Balance
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-green-600">
                            <div className="flex items-center justify-end gap-2">
                              <span>Rs.{Math.abs(balance).toFixed(2)}</span>
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                {allCreditRefunded ? 'Refunded' : 'Overpaid'}
                              </span>
                              {!allCreditRefunded && Math.abs(balance) > 0 && (
                                <button
                                  onClick={() => {
                                    const amount = Math.abs(balance);
                                    // Mark all individual returns as completed when refunding all
                                    const updatedCreditPayment = { ...creditPayment };
                                    if (sale.returns) {
                                      sale.returns.forEach(ret => {
                                        if (!ret.refundPaid && ret.refundAmount > 0) {
                                          updatedCreditPayment[ret.id] = {
                                            amount: ret.refundAmount,
                                            processing: false,
                                            completed: true
                                          };
                                        }
                                      });
                                    }
                                    setCreditPayment(updatedCreditPayment);
                                    payCredit.mutate({ saleId: sale.id, amount });
                                  }}
                                  disabled={creditPayment.saleRefund?.processing}
                                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {creditPayment.saleRefund?.processing ? 'Processing...' : 'Refund All'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right font-medium">
                          Status
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Fully Paid
                          </span>
                        </td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Returned Items Section */}
          {sale.returns?.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2 text-red-800">Returned Items</h3>
              <div className="bg-red-50 rounded-lg overflow-hidden overflow-x-auto border border-red-200">
                <table className="min-w-full divide-y divide-red-200">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Return #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Items</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-red-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-red-700 uppercase">Refund</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-200">
                    {sale.returns.map((returnRecord, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-800">
                          {returnRecord.returnNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(returnRecord.returnDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {returnRecord.items?.map((item, itemIndex) => (
                            <div key={itemIndex} className="text-sm">
                              {item.product?.name} × {item.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-800">
                          Rs.{(Number(returnRecord.totalAmount) || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div className="text-sm font-medium text-gray-900">
                            Rs.{(Number(returnRecord.refundAmount) || 0).toFixed(2)}
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              (returnRecord.refundPaid || creditPayment[returnRecord.id]?.completed)
                                ? 'bg-green-100 text-green-800' 
                                : (returnRecord.refundAmount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600')
                            }`}>
                              {(returnRecord.refundPaid || creditPayment[returnRecord.id]?.completed) ? 'Paid' : (returnRecord.refundAmount > 0 ? 'Pending' : 'No Refund')}
                            </div>
                            {!returnRecord.refundPaid && !creditPayment[returnRecord.id]?.completed && returnRecord.refundAmount > 0 && (
                              <button
                                onClick={() => {
                                  const amount = Number(returnRecord.refundAmount);
                                  payCredit.mutate({ returnId: returnRecord.id, amount });
                                }}
                                disabled={creditPayment[returnRecord.id]?.processing}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                              >
                                {creditPayment[returnRecord.id]?.processing ? 'Processing...' : 'Pay Refund'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Trail Section */}
          {auditTrail && auditTrail.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Payment History</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="space-y-3">
                  {auditTrail
                    .filter(audit => audit.fieldName === 'paidAmount')
                    .map((audit, index) => (
                      <div key={index} className="flex items-start justify-between p-3 bg-white rounded border border-blue-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-blue-800">
                              Payment Updated
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(audit.changedAt).toLocaleDateString()} at {new Date(audit.changedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {audit.description && (
                            <div className="text-sm text-gray-700 mb-2 italic">
                              "{audit.description}"
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            Amount changed from <span className="font-medium text-red-600">Rs.{audit.oldValue}</span> to <span className="font-medium text-green-600">Rs.{audit.newValue}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            Number(audit.newValue) > Number(audit.oldValue) ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Number(audit.newValue) > Number(audit.oldValue) ? '+' : ''}
                            Rs.{(Number(audit.newValue) - Number(audit.oldValue)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
        
        <PDFPreferencesModal
          isOpen={showPDFPreferences}
          onClose={() => setShowPDFPreferences(false)}
          onSave={(prefs) => setPdfPreferences(prefs)}
        />
      </div>
    </div>
  );
}

function createPrintableInvoice(sale, shopSettings) {
  // Create brand array with registered trademark symbols
  const brands = [];
  
  if (shopSettings?.brand1) {
    brands.push(shopSettings.brand1 + (shopSettings.brand1Registered ? '®' : ''));
  }
  if (shopSettings?.brand2) {
    brands.push(shopSettings.brand2 + (shopSettings.brand2Registered ? '®' : ''));
  }
  if (shopSettings?.brand3) {
    brands.push(shopSettings.brand3 + (shopSettings.brand3Registered ? '®' : ''));
  }

  // Calculate payment status
  const netAmount = (sale.totalAmount) - (sale.returns?.reduce((sum, ret) => sum + ret.totalAmount, 0) || 0);
  const totalRefunded = (sale.returns?.reduce((sum, ret) => sum + (ret.refundPaid ? (ret.refundAmount || 0) : 0), 0) || 0);
  const balance = netAmount - sale.paidAmount + totalRefunded;
  
  // Determine status
  let status = '';
  let statusColor = '';
  
  if (balance > 0) {
    status = 'PAYMENT DUE';
    statusColor = '#92400e';
  } else if (balance < 0) {
    const allRefundsPaid = sale.returns?.every(ret => ret.refundPaid) || false;
    if (allRefundsPaid && totalRefunded > 0) {
      status = 'REFUNDED';
      statusColor = '#0369a1';
    } else {
      status = 'CREDIT BALANCE';
      statusColor = '#1e40af';
    }
  } else {
    status = 'FULLY PAID';
    statusColor = '#065f46';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice #${sale.billNumber}</title>
      <style>
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #333;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
        }
        
        .logo {
          max-width: 100px;
          max-height: 100px;
        }
        
        .company-info {
          text-align: right;
          font-size: 10px;
        }
        
        .shop-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .brands {
          font-size: 10px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .recipient-box {
          margin: 20px 0 15px 0;
        }
        
        .recipient-title {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .recipient-name {
          font-size: 12px;
          font-weight: bold;
        }
        
        .invoice-box {
          background: white;
          color: black;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 200px;
          margin-left: auto;
          margin-bottom: 20px;
        }
        
        .invoice-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 4px;
        }
        
        .invoice-total {
          font-size: 14px;
          font-weight: bold;
          text-align: right;
          margin-top: 4px;
        }
        
        .status-tag {
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          color: white;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        th, td {
          padding: 4px;
          text-align: left;
          border-bottom: 1px solid #eee;
          font-size: 9px;
        }
        
        th {
          background-color: #f3f4f6;
          font-weight: bold;
          border-bottom: 1px solid #ccc;
          font-size: 8px;
        }
        
        .text-right {
          text-align: right;
        }
        
        .summary {
          margin-top: 15px;
          margin-left: auto;
          width: 200px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .summary-total {
          font-weight: bold;
          font-size: 12px;
          border-top: 1px solid #000;
          margin-top: 6px;
          padding-top: 6px;
        }
        
        .returns-section {
          margin: 20px 0 15px 0;
        }
        
        .returns-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
          background-color: #fef2f2;
          padding: 6px;
        }
        
        .footer {
          position: fixed;
          bottom: 30px;
          left: 40px;
          right: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #666;
        }
        
        .terms-box {
          border: 1px solid #666;
          padding: 5px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        ${shopSettings?.logo ? `<img src="${shopSettings.logo}" class="logo" />` : '<div></div>'}
        <div class="company-info">
          <div class="shop-name">${shopSettings?.shopName || 'INVOICE'}</div>
          ${brands.length > 0 ? `<div class="brands">${brands.join(' • ')}</div>` : ''}
          ${shopSettings?.shopDescription ? `<div>${shopSettings.shopDescription}</div>` : ''}
          ${shopSettings?.shopDescription2 ? `<div>${shopSettings.shopDescription2}</div>` : ''}
          <div>&nbsp;</div>
          ${shopSettings?.userName1 ? `<div>${shopSettings.userName1}: ${shopSettings.userPhone1}</div>` : ''}
          ${shopSettings?.userName2 ? `<div>${shopSettings.userName2}: ${shopSettings.userPhone2}</div>` : ''}
          ${shopSettings?.userName3 ? `<div>${shopSettings.userName3}: ${shopSettings.userPhone3}</div>` : ''}
        </div>
      </div>

      <!-- Recipient -->
      <div class="recipient-box">
        <div class="recipient-title">RECIPIENT:</div>
        <div class="recipient-name">${sale.contact?.name || 'Walk-in Customer'}</div>
        ${sale.contact?.phoneNumber ? `<div>Phone: ${sale.contact.phoneNumber}</div>` : ''}
        ${sale.contact?.address ? `<div>${sale.contact.address}</div>` : ''}
      </div>

      <!-- Invoice Box -->
      <div class="invoice-box">
        <div>Invoice #${sale.billNumber}</div>
        <div class="invoice-row">
          <span>Issued</span>
          <span>${new Date(sale.saleDate).toLocaleDateString()}</span>
        </div>
        <div class="invoice-row">
          <span>Time</span>
          <span>${new Date(sale.saleDate).toLocaleTimeString()}</span>
        </div>
        <div class="invoice-row">
          <span>Status</span>
          <span class="status-tag" style="background-color: ${statusColor}; color: white;">${status}</span>
        </div>
        <div class="invoice-total">${formatPakistaniCurrency(sale.totalAmount)}</div>
      </div>

      <!-- Single Table with All Data -->
      <table>
        <thead>
          <tr>
            <th>PRODUCT</th>
            <th class="text-right">UNIT PRICE</th>
            <th class="text-right">QTY</th>
            <th class="text-right">TOTAL</th>
            <th class="text-right">CAR NUMBER</th>
            <th class="text-right">LOADING DATE</th>
            <th class="text-right">ARRIVAL DATE</th>
            <th class="text-right">DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map(item => `
            <tr>
              <td>${item.product.name}</td>
              <td class="text-right">${formatPakistaniCurrency(item.price)}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatPakistaniCurrency(item.price * item.quantity)}</td>
              <td class="text-right">${sale.transport?.carNumber || '-'}</td>
              <td class="text-right">${sale.loadingDate ? new Date(sale.loadingDate).toLocaleDateString() : '-'}</td>
              <td class="text-right">${sale.arrivalDate ? new Date(sale.arrivalDate).toLocaleDateString() : '-'}</td>
              <td class="text-right">${sale.description || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${sale.returns && sale.returns.length > 0 ? `
        <!-- Returns Section -->
        <div class="returns-section">
          <div class="returns-title">RETURNED ITEMS</div>
          <table>
            <thead>
              <tr>
                <th>Return #</th>
                <th>Date</th>
                <th>Items</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${sale.returns.map(returnRecord => `
                <tr>
                  <td>${returnRecord.returnNumber}</td>
                  <td>${new Date(returnRecord.returnDate).toLocaleDateString()}</td>
                  <td>${returnRecord.items.map(item => `${item.product?.name || 'Unknown Product'} x${item.quantity}`).join(', ')}</td>
                  <td class="text-right">${formatPakistaniCurrency(returnRecord.totalAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Summary -->
      <div class="summary">
        ${Number(sale.discount) > 0 ? `
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${formatPakistaniCurrency(sale.totalAmount + (sale.discount || 0))}</span>
          </div>
          <div class="summary-row">
            <span>Discount</span>
            <span>-${formatPakistaniCurrency(sale.discount || 0)}</span>
          </div>
        ` : ''}
        <div class="summary-row">
          <span>Total Amount</span>
          <span>${formatPakistaniCurrency(sale.totalAmount)}</span>
        </div>
        <div class="summary-row">
          <span>Paid Amount</span>
          <span>${formatPakistaniCurrency(sale.paidAmount)}</span>
        </div>
        ${sale.returns && sale.returns.length > 0 ? `
          <div class="summary-row">
            <span>Total Returned</span>
            <span>${formatPakistaniCurrency(sale.returns.reduce((sum, ret) => sum + ret.totalAmount, 0))}</span>
          </div>
          ${totalRefunded > 0 ? `
            <div class="summary-row">
              <span>Total Refunded</span>
              <span>${formatPakistaniCurrency(totalRefunded)}</span>
            </div>
          ` : ''}
          <div class="summary-row">
            <span>Net Total After Returns</span>
            <span>${formatPakistaniCurrency(netAmount > 0 ? netAmount : 0)}</span>
          </div>
        ` : ''}
        ${balance > 0 ? `
          <div class="summary-row summary-total">
            <span>Balance Due</span>
            <span>${formatPakistaniCurrency(balance)}</span>
          </div>
        ` : balance < 0 ? `
          <div class="summary-row summary-total">
            <span>Credit Balance</span>
            <span>${formatPakistaniCurrency(Math.abs(balance) <= sale.paidAmount ? Math.abs(balance) : 0)}</span>
          </div>
        ` : `
          <div class="summary-row summary-total">
            <span>Status</span>
            <span>Fully Paid</span>
          </div>
        `}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div style="font-size: 8px;">
          Need system like this? Contact: 03145292649
        </div>
        <div class="terms-box">
          <div style="font-size: 8px;">
            Goods will not be returned or exchanged after use.
          </div>
          <div style="font-size: 8px;">
            No Return / Exchange after use.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default SaleDetailsModal;