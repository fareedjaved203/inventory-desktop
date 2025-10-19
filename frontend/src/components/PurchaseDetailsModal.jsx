import React from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../utils/api';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PurchaseInvoicePDF from './PurchaseInvoicePDF';

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

function PurchaseDetailsModal({ purchase, isOpen, onClose }) {
  const { data: shopSettings } = useQuery(['shop-settings'], async () => {
    const result = await API.getShopSettings();
    return result.items?.[0] || {};
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[90vh] flex flex-col">
        <div className="flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Purchase Details</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Create print content
                const printContent = createPrintablePurchaseInvoice(purchase, shopSettings);
                
                // Create a new window for printing
                const printWindow = window.open('', '_blank');
                printWindow.document.write(printContent);
                printWindow.document.close();
                
                // Wait for content to load then print
                printWindow.onload = () => {
                  printWindow.print();
                  printWindow.close();
                };
              }}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015-1.837-2.175a48.041 48.041 0 711.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print Invoice
            </button>
            <PDFDownloadLink
              document={<PurchaseInvoicePDF purchase={purchase} shopSettings={shopSettings} />}
              fileName={`purchase-${purchase.invoiceNumber}.pdf`}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </PDFDownloadLink>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Purchase Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Contact</p>
                <p className="font-medium">{purchase.contact?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Items</h3>
            <div className="bg-gray-50 rounded-lg overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: "600px" }}>
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchase.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {item.isTotalCostItem ? 
                          `Rs.${(Number(item.purchasePrice) / Number(item.quantity)).toFixed(2)}` :
                          `Rs.${Number(item.purchasePrice).toFixed(2)}`
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {item.isTotalCostItem ? 
                          `Rs.${Number(item.purchasePrice).toFixed(2)}` :
                          `Rs.${(Number(item.purchasePrice) * Number(item.quantity)).toFixed(2)}`
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  {Number(purchase.discount) > 0 && (
                    <>
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right font-medium">
                          Subtotal
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          Rs.{(Number(purchase.totalAmount) + Number(purchase.discount || 0)).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right font-medium text-green-600">
                          Discount
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">
                          -Rs.{Number(purchase.discount || 0).toFixed(2)}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Total
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs.{Number(purchase.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Paid Amount
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs.{Number(purchase.paidAmount).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Balance
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${Number(purchase.totalAmount) > Number(purchase.paidAmount) ? 'text-yellow-600' : ''}`}>
                      Rs.{(Number(purchase.totalAmount) - Number(purchase.paidAmount)).toFixed(2)}
                      {Number(purchase.totalAmount) > Number(purchase.paidAmount) && (
                        <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Payment Due
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function createPrintablePurchaseInvoice(purchase, shopSettings) {
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
  const balance = purchase.totalAmount - purchase.paidAmount;
  let status = '';
  let statusColor = '';
  
  if (balance > 0) {
    status = 'PAYMENT DUE';
    statusColor = '#92400e';
  } else {
    status = 'FULLY PAID';
    statusColor = '#065f46';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Invoice #${purchase.invoiceNumber}</title>
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
          border-bottom: 2px solid #dc2626;
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
          padding: 6px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        th {
          background-color: #f3f4f6;
          font-weight: bold;
          border-bottom: 1px solid #ccc;
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
          <div class="shop-name">${shopSettings?.shopName || 'PURCHASE INVOICE'}</div>
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
        <div class="recipient-title">SUPPLIER:</div>
        <div class="recipient-name">${purchase.contact?.name || 'Supplier'}</div>
        ${purchase.contact?.phoneNumber ? `<div>Phone: ${purchase.contact.phoneNumber}</div>` : ''}
        ${purchase.contact?.address ? `<div>${purchase.contact.address}</div>` : ''}
      </div>

      <!-- Invoice Box -->
      <div class="invoice-box">
        <div>Invoice #${purchase.invoiceNumber}</div>
        <div class="invoice-row">
          <span>Date</span>
          <span>${new Date(purchase.purchaseDate).toLocaleDateString()}</span>
        </div>
        <div class="invoice-row">
          <span>Time</span>
          <span>${new Date(purchase.purchaseDate).toLocaleTimeString()}</span>
        </div>
        <div class="invoice-row">
          <span>Status</span>
          <span class="status-tag" style="background-color: ${statusColor}; color: white;">${status}</span>
        </div>
        <div class="invoice-total">${formatPakistaniCurrency(purchase.totalAmount)}</div>
      </div>

      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th>PRODUCT</th>
            <th class="text-right">UNIT PRICE</th>
            <th class="text-right">QTY</th>
            <th class="text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${purchase.items.map(item => `
            <tr>
              <td>${item.product.name}</td>
              <td class="text-right">${item.isTotalCostItem ? 
                formatPakistaniCurrency(item.purchasePrice / item.quantity) :
                formatPakistaniCurrency(item.purchasePrice)
              }</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${item.isTotalCostItem ? 
                formatPakistaniCurrency(item.purchasePrice) :
                formatPakistaniCurrency(item.purchasePrice * item.quantity)
              }</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Summary -->
      <div class="summary">
        ${Number(purchase.discount) > 0 ? `
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${formatPakistaniCurrency(purchase.totalAmount + (purchase.discount || 0))}</span>
          </div>
          <div class="summary-row">
            <span>Discount</span>
            <span>-${formatPakistaniCurrency(purchase.discount || 0)}</span>
          </div>
        ` : ''}
        <div class="summary-row">
          <span>Total Amount</span>
          <span>${formatPakistaniCurrency(purchase.totalAmount)}</span>
        </div>
        <div class="summary-row">
          <span>Paid Amount</span>
          <span>${formatPakistaniCurrency(purchase.paidAmount)}</span>
        </div>
        ${balance > 0 ? `
          <div class="summary-row summary-total">
            <span>Balance Due</span>
            <span>${formatPakistaniCurrency(balance)}</span>
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
            Purchase terms and conditions apply.
          </div>
          <div style="font-size: 8px;">
            Quality check required on delivery.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default PurchaseDetailsModal;