import React from "react";

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

function generateUrduInvoiceHTML(sale, shopSettings, preferences = {}) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ur">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>رسید #${sale.billNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Urdu:wght@400;700&display=swap" rel="stylesheet">
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
          font-family: 'Noto Sans Urdu', Arial, sans-serif;
          font-size: 14px;
          color: #333;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          direction: rtl;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
        }
        
        .shop-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .title {
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0;
        }
        
        .invoice-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .customer-info {
          margin: 20px 0;
          padding: 15px;
          background: #f1f5f9;
          border-radius: 8px;
        }
        
        .transport-section {
          margin: 20px 0;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        
        .transport-title {
          font-weight: bold;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        th, td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f3f4f6;
          font-weight: bold;
          border-bottom: 2px solid #ccc;
        }
        
        .summary {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          max-width: 300px;
          margin-right: auto;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 5px 0;
        }
        
        .summary-total {
          font-weight: bold;
          font-size: 16px;
          border-top: 2px solid #000;
          margin-top: 10px;
          padding-top: 10px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        
        .print-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        
        @media print {
          .print-btn {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">پرنٹ کریں</button>
      
      <!-- Header -->
      <div class="header">
        <div class="shop-name">${shopSettings?.shopName || "رانا قدیر صاحب"}</div>
        <div class="title">رسید</div>
      </div>

      <!-- Invoice Info -->
      <div class="invoice-info">
        <div><strong>بل نمبر:</strong> #${sale.billNumber}</div>
        <div><strong>تاریخ:</strong> ${new Date(sale.saleDate).toLocaleDateString('ur-PK')}</div>
      </div>

      <!-- Customer Info -->
      <div class="customer-info">
        <div><strong>گاہک:</strong> ${sale.contact?.name || "واک ان کسٹمر"}</div>
        ${sale.contact?.phoneNumber && preferences.showContactPhone !== false ? 
          `<div><strong>فون:</strong> ${sale.contact.phoneNumber}</div>` : ''}
        ${sale.contact?.address && preferences.showContactAddress !== false ? 
          `<div><strong>پتہ:</strong> ${sale.contact.address}</div>` : ''}
      </div>

      ${preferences.showDescription !== false && sale.description ? `
        <div class="customer-info">
          <div><strong>تفصیل:</strong> ${sale.description}</div>
        </div>
      ` : ''}

      ${preferences.showTransportDetails !== false && (sale.transport || sale.transportCost || sale.loadingDate || sale.arrivalDate) ? `
        <div class="transport-section">
          <div class="transport-title">ٹرانسپورٹ کی تفصیلات</div>
          ${preferences.showCarNumber !== false && sale.transport?.carNumber ? 
            `<div><strong>گاڑی نمبر:</strong> ${sale.transport.carNumber}</div>` : ''}
          ${preferences.showLoadingDate !== false && sale.loadingDate ? 
            `<div><strong>لوڈنگ کی تاریخ:</strong> ${new Date(sale.loadingDate).toLocaleDateString()}</div>` : ''}
          ${preferences.showArrivalDate !== false && sale.arrivalDate ? 
            `<div><strong>پہنچنے کی تاریخ:</strong> ${new Date(sale.arrivalDate).toLocaleDateString()}</div>` : ''}
          ${preferences.showTransportCost !== false && sale.transportCost ? 
            `<div><strong>ٹرانسپورٹ کی لاگت:</strong> ${formatPakistaniCurrency(sale.transportCost)}</div>` : ''}
        </div>
      ` : ''}

      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th>پروڈکٹ</th>
            <th>ریٹ</th>
            <th>مقدار</th>
            <th>کل</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map(item => `
            <tr>
              <td>${item.product.name}</td>
              <td>${formatPakistaniCurrency(item.price, false)}</td>
              <td>${item.quantity}</td>
              <td>${formatPakistaniCurrency(item.price * item.quantity, false)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Summary -->
      <div class="summary">
        <div class="summary-row">
          <span>کل رقم:</span>
          <span>${formatPakistaniCurrency(sale.totalAmount)}</span>
        </div>
        <div class="summary-row">
          <span>ادا شدہ رقم:</span>
          <span>${formatPakistaniCurrency(sale.paidAmount)}</span>
        </div>
        <div class="summary-row summary-total">
          <span>باقی رقم:</span>
          <span>${formatPakistaniCurrency(Math.max(sale.totalAmount - sale.paidAmount, 0))}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        استعمال کے بعد واپسی یا تبدیلی نہیں
      </div>
    </body>
    </html>
  `;
}

function UrduInvoiceHTML({ sale, shopSettings, preferences = {} }) {
  const handlePrint = () => {
    const htmlContent = generateUrduInvoiceHTML(sale, shopSettings, preferences);
    
    // Check if we're in Electron
    if (window.electronAPI) {
      // Save HTML to temp file and open it
      window.electronAPI.saveAndOpenUrduInvoice(htmlContent, `urdu-invoice-${sale.billNumber}.html`);
    } else {
      // Fallback for web browsers
      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      اردو رسید
    </button>
  );
}

export default UrduInvoiceHTML;