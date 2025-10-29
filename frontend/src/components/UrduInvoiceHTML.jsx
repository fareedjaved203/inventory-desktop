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
          font-size: 11px;
          color: #000;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
          direction: rtl;
        }
        
        .company-header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .company-subtitle {
          font-size: 10px;
          margin-bottom: 5px;
        }
        
        .invoice-title {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
        }
        
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        .bill-to-section {
          margin-bottom: 15px;
          border: 1px solid #000;
          padding: 8px;
        }
        
        .bill-to-title {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .customer-info {
          font-size: 10px;
          margin-bottom: 2px;
        }
        
        .table {
          border: 1px solid #000;
          margin-bottom: 10px;
          width: 100%;
          border-collapse: collapse;
        }
        
        .table-header {
          background-color: #000;
          color: #fff;
          font-weight: bold;
          font-size: 9px;
        }
        
        .table-row {
          border-bottom: 1px solid #000;
          font-size: 9px;
          min-height: 20px;
        }
        
        .table th, .table td {
          padding: 5px 3px;
          text-align: center;
          border-right: 1px solid #ccc;
        }
        
        .table th:last-child, .table td:last-child {
          border-right: none;
        }
        
        .col-sr { width: 8%; }
        .col-description { width: 35%; text-align: right; }
        .col-uom { width: 12%; }
        .col-qty { width: 10%; }
        .col-price { width: 15%; text-align: left; }
        .col-amount { width: 20%; text-align: left; }
        
        .summary-section {
          display: flex;
          margin-top: 10px;
        }
        
        .summary-left {
          width: 50%;
          border: 1px solid #000;
          padding: 5px;
        }
        
        .summary-right {
          width: 50%;
          border: 1px solid #000;
          border-right: none;
          padding: 5px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 9px;
        }
        
        .summary-label {
          font-weight: bold;
          font-size: 9px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 10px;
          font-weight: bold;
          border-top: 1px solid #000;
          padding-top: 3px;
          margin-top: 3px;
        }
        
        .status-section {
          margin-top: 10px;
          border: 1px solid #000;
          padding: 8px;
        }
        
        .status-title {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .status-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 9px;
        }
        
        .footer {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          text-align: right;
          font-size: 8px;
          padding-top: 5px;
        }
        
        .shop-description-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #000;
          color: #fff;
          text-align: center;
          font-size: 8px;
          padding: 5px;
          margin: 0;
        }
        
        .returns-section {
          margin-top: 10px;
          margin-bottom: 10px;
        }
        
        .returns-title {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 5px;
          background-color: #f0f0f0;
          padding: 3px;
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
      
      <!-- Company Header -->
      <div class="company-header">
        <div class="company-name">${shopSettings?.shopName || "کمپنی کا نام"}</div>
        ${brands.length > 0 ? `<div class="company-subtitle">${brands.join(" • ")}</div>` : ''}
        ${shopSettings?.shopDescription ? `<div class="company-subtitle">${shopSettings.shopDescription}</div>` : ''}
      </div>

      <!-- Invoice Title -->
      <div class="invoice-title">رسید</div>

      <!-- Date and Invoice Number -->
      <div class="invoice-info">
        <div>تاریخ: ${new Date(sale.saleDate).toLocaleDateString()}</div>
        <div>رسید نمبر: ${sale.billNumber}</div>
      </div>

      <!-- Bill To Section -->
      <div class="bill-to-section">
        <div class="bill-to-title">گاہک کی تفصیلات:</div>
        <div class="customer-info">گاہک کا نام: ${sale.contact?.name || "واک ان کسٹمر"}</div>
        ${sale.contact?.phoneNumber && preferences.showContactPhone !== false ? 
          `<div class="customer-info">رابطہ نمبر: ${sale.contact.phoneNumber}</div>` : ''}
        ${sale.contact?.address && preferences.showContactAddress !== false ? 
          `<div class="customer-info">پتہ: ${sale.contact.address}</div>` : ''}
      </div>

      <!-- Items Table -->
      <table class="table">
        <thead>
          <tr class="table-header">
            <th class="col-sr">سیریل</th>
            <th class="col-description">اشیاء کی تفصیل</th>
            <th class="col-uom">یونٹ</th>
            <th class="col-qty">تعداد</th>
            <th class="col-price">فی یونٹ ریٹ</th>
            <th class="col-amount">کل رقم</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map((item, i) => `
            <tr class="table-row">
              <td class="col-sr">${i + 1}</td>
              <td class="col-description">${item.product.name}</td>
              <td class="col-uom">${item.product.unit || 'عدد'}</td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-price">${formatPakistaniCurrency(item.price, false)}</td>
              <td class="col-amount">${formatPakistaniCurrency(item.price * item.quantity, false)}</td>
            </tr>
          `).join('')}
          
          ${Array.from({ length: Math.max(0, 20 - sale.items.length) }).map((_, i) => `
            <tr class="table-row">
              <td class="col-sr">${sale.items.length + i + 1}</td>
              <td class="col-description"></td>
              <td class="col-uom"></td>
              <td class="col-qty"></td>
              <td class="col-price"></td>
              <td class="col-amount"></td>
            </tr>
          `).join('')}
          
          <!-- TOTAL Row in table -->
          <tr class="table-row" style="background-color: #fff; font-weight: bold; border-top: 2px solid #000;">
            <td class="col-sr"></td>
            <td class="col-description" style="font-weight: bold;">کل</td>
            <td class="col-uom"></td>
            <td class="col-qty"></td>
            <td class="col-price"></td>
            <td class="col-amount" style="font-weight: bold;">${formatPakistaniCurrency(sale.totalAmount, false)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-left">
          ${Number(sale.discount) > 0 ? `
            <div class="summary-row">
              <span style="font-weight: bold; font-size: 9px;">رعایت</span>
              <span style="font-weight: bold; font-size: 9px;">${formatPakistaniCurrency(sale.discount || 0, false)}</span>
            </div>
          ` : ''}
          ${sale.returns && sale.returns.length > 0 ? `
            <div class="summary-row">
              <span style="font-weight: bold; font-size: 9px;">واپسی</span>
              <span style="font-weight: bold; font-size: 9px;">${formatPakistaniCurrency(sale.returns.reduce((sum, ret) => sum + ret.totalAmount, 0), false)}</span>
            </div>
          ` : ''}
          <div class="summary-row">
            <span style="font-weight: bold; font-size: 9px;">بقایا</span>
            <span style="font-weight: bold; font-size: 9px;">${formatPakistaniCurrency(balance > 0 ? balance : 0, false)}</span>
          </div>
          <div class="summary-row">
            <span style="font-weight: bold; font-size: 9px;">نقد ادائیگی</span>
            <span style="font-weight: bold; font-size: 9px;">${formatPakistaniCurrency(sale.paidAmount, false)}</span>
          </div>
          <div class="summary-row">
            <span style="font-weight: bold; font-size: 9px;">کریڈٹ</span>
            <span style="font-weight: bold; font-size: 9px;">${formatPakistaniCurrency(balance < 0 ? Math.abs(balance) : 0, false)}</span>
          </div>
        </div>
        <div class="summary-right">
          <div style="font-weight: bold; font-size: 9px;">آرڈر کے ساتھ:</div>
          <div style="font-size: 8px; margin-top: 3px;">${sale.description || ''}</div>
          <div> </div>
          <div> </div>
          <div style="font-weight: bold; font-size: 9px;">وصول کنندہ:</div>
        </div>
      </div>

      <!-- Payment Status Section -->
      <div class="status-section">
        ${sale.returns && sale.returns.length > 0 ? `
          <div class="status-row">
            <span>خالص رقم (واپسی کے بعد):</span>
            <span>${formatPakistaniCurrency(netAmount > 0 ? netAmount : 0)}</span>
          </div>
        ` : ''}
        <div class="status-row">
          <span>ادا شدہ رقم:</span>
          <span>${formatPakistaniCurrency(sale.paidAmount)}</span>
        </div>
        ${totalRefunded > 0 ? `
          <div class="status-row">
            <span>واپس شدہ رقم:</span>
            <span>${formatPakistaniCurrency(totalRefunded)}</span>
          </div>
        ` : ''}
        <div class="status-row">
          <span class="summary-label">
            ${balance > 0 ? 'واجب الادا رقم:' : balance < 0 ? 'کریڈٹ بیلنس:' : 'حالت:'}
          </span>
          <span class="summary-label">
            ${balance > 0 ? formatPakistaniCurrency(balance) : balance < 0 ? formatPakistaniCurrency(Math.abs(balance)) : 'مکمل ادائیگی'}
          </span>
        </div>
      </div>

      <!-- Returns Section -->
      ${sale.returns && sale.returns.length > 0 ? `
        <div class="returns-section">
          <div class="returns-title">واپس شدہ اشیاء:</div>
          ${sale.returns.map((returnRecord, index) => `
            <div style="font-size: 8px; margin-bottom: 2px;">
              واپسی #${returnRecord.returnNumber} (${new Date(returnRecord.returnDate).toLocaleDateString()}): 
              ${returnRecord.items.map(item => `${item.product?.name || "نامعلوم"} x${item.quantity}`).join(", ")} 
              - ${formatPakistaniCurrency(returnRecord.totalAmount)}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        <div style="margin-top: 4px; margin-bottom: 4px;">چیک اور منظوری: _________________________</div>
      </div>
      
      <!-- Shop Description Footer -->
      ${shopSettings?.shopDescription2 ? `
        <div class="shop-description-footer">
          ${shopSettings.shopDescription2}
        </div>
      ` : ''}
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