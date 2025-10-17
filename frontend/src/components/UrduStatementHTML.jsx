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

function generateUrduStatementHTML(statementData, shopSettings, startDate, endDate, preferences = {}) {
  const { contact, openingBalance, closingBalance, transactions } = statementData;

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ur-PK');
  };

  const formatPeriod = () => {
    if (startDate && endDate) {
      return `بیان کی مدت: ${formatDate(startDate)} سے ${formatDate(endDate)} تک`;
    } else if (startDate) {
      return `بیان کی شروعات: ${formatDate(startDate)}`;
    } else if (endDate) {
      return `بیان کا اختتام: ${formatDate(endDate)}`;
    }
    return "مکمل بیان";
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ur">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>گاہک کا بیان - ${contact.name}</title>
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
          font-size: 12px;
          color: #333;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          direction: rtl;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 2px solid #4a5568;
          padding-bottom: 15px;
        }
        
        .logo {
          max-width: 80px;
          max-height: 80px;
        }
        
        .company-info {
          text-align: right;
          font-size: 11px;
        }
        
        .shop-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .brands {
          font-size: 10px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          color: #2d3748;
        }
        
        .customer-box {
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .customer-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #2d3748;
        }
        
        .customer-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .period-box {
          margin-bottom: 15px;
          padding: 10px;
          background: #e3f2fd;
          border-radius: 6px;
          text-align: center;
          font-weight: bold;
        }
        
        .balance-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px;
          background: #f0f0f0;
          border-radius: 6px;
          font-weight: bold;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 10px;
        }
        
        th, td {
          padding: 8px 4px;
          text-align: right;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #4a5568;
          color: white;
          font-weight: bold;
          font-size: 9px;
        }
        
        .table-row-alt {
          background-color: #f8f9fa;
        }
        
        .closing-balance {
          margin-top: 15px;
          padding: 12px;
          background: #4a5568;
          color: white;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 15px;
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
        
        .no-transactions {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin: 30px 0;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">پرنٹ کریں</button>
      
      <!-- Header -->
      <div class="header">
        ${shopSettings?.logo ? `<img src="${shopSettings.logo}" class="logo" />` : '<div></div>'}
        <div class="company-info">
          <div class="shop-name">${shopSettings?.shopName || "گاہک کا بیان"}</div>
          ${brands.length > 0 ? `<div class="brands">${brands.join(' • ')}</div>` : ''}
          ${shopSettings?.shopDescription ? `<div>${shopSettings.shopDescription}</div>` : ''}
          ${shopSettings?.shopDescription2 ? `<div>${shopSettings.shopDescription2}</div>` : ''}
          <div>&nbsp;</div>
          ${shopSettings?.userName1 ? `<div>${shopSettings.userName1}: ${shopSettings.userPhone1}</div>` : ''}
          ${shopSettings?.userName2 ? `<div>${shopSettings.userName2}: ${shopSettings.userPhone2}</div>` : ''}
          ${shopSettings?.userName3 ? `<div>${shopSettings.userName3}: ${shopSettings.userPhone3}</div>` : ''}
        </div>
      </div>

      <!-- Title -->
      <div class="title">گاہک کا بیان</div>

      <!-- Customer Details -->
      <div class="customer-box">
        <div class="customer-title">گاہک کی تفصیلات:</div>
        <div class="customer-name">${contact.name}</div>
        ${contact.phoneNumber && preferences.showContactPhone !== false ? 
          `<div><strong>فون:</strong> ${contact.phoneNumber}</div>` : ''}
        ${contact.address && preferences.showContactAddress !== false ? 
          `<div><strong>پتہ:</strong> ${contact.address}</div>` : ''}
      </div>

      <!-- Period -->
      <div class="period-box">${formatPeriod()}</div>

      <!-- Opening Balance -->
      <div class="balance-row">
        <span>ابتدائی بیلنس:</span>
        <span style="color: ${openingBalance >= 0 ? '#2d3748' : '#4a5568'}">
          ${formatPakistaniCurrency(Math.abs(openingBalance))} ${openingBalance >= 0 ? '(وصولی)' : '(ادائیگی)'}
        </span>
      </div>

      <!-- Transactions Table -->
      ${transactions && transactions.length > 0 ? `
        <table>
          <thead>
            <tr>
              ${preferences.showDate !== false ? '<th>تاریخ</th>' : ''}
              ${preferences.showDescription !== false ? '<th>میمو</th>' : ''}
              ${preferences.showLoadingDate !== false ? '<th>لوڈنگ تاریخ</th>' : ''}
              ${preferences.showArrivalDate !== false ? '<th>تاریخ</th>' : ''}
              ${preferences.showSaleDescription !== false ? '<th>تفصیل</th>' : ''}
              ${preferences.showCarNumber !== false ? '<th>گاڑی نمبر</th>' : ''}
              ${preferences.showQuantity !== false ? '<th>تعداد</th>' : ''}
              ${preferences.showUnitPrice !== false ? '<th>ریٹ</th>' : ''}
              ${preferences.showDebit !== false ? '<th>جمع</th>' : ''}
              ${preferences.showCredit !== false ? '<th>بنام</th>' : ''}
              ${preferences.showBalance !== false ? '<th>بقایا</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${transactions.map((transaction, index) => {
              const getTransactionIcon = (type) => {
                switch(type) {
                  case 'sale': return '📄';
                  case 'loan': return '💰';
                  default: return '📋';
                }
              };
              
              return `
                <tr class="${index % 2 === 1 ? 'table-row-alt' : ''}">
                  ${preferences.showDate !== false ? `<td>${formatDate(transaction.date)}</td>` : ''}
                  ${preferences.showDescription !== false ? `<td>${getTransactionIcon(transaction.type)} ${transaction.description}</td>` : ''}
                  ${preferences.showLoadingDate !== false ? `<td>${transaction.loadingDate ? formatDate(transaction.loadingDate) : '-'}</td>` : ''}
                  ${preferences.showArrivalDate !== false ? `<td>${transaction.arrivalDate ? formatDate(transaction.arrivalDate) : '-'}</td>` : ''}
                  ${preferences.showSaleDescription !== false ? `<td>${transaction.saleDescription || '-'}</td>` : ''}
                  ${preferences.showCarNumber !== false ? `<td>${transaction.carNumber || '-'}</td>` : ''}
                  ${preferences.showQuantity !== false ? `<td>${transaction.quantity || '-'}</td>` : ''}
                  ${preferences.showUnitPrice !== false ? `<td>${transaction.unitPrice ? formatPakistaniCurrency(transaction.unitPrice) : '-'}</td>` : ''}
                  ${preferences.showDebit !== false ? `<td>${transaction.debit > 0 ? formatPakistaniCurrency(transaction.debit) : '-'}</td>` : ''}
                  ${preferences.showCredit !== false ? `<td>${transaction.credit > 0 ? formatPakistaniCurrency(transaction.credit) : '-'}</td>` : ''}
                  ${preferences.showBalance !== false ? `<td style="color: ${transaction.balance >= 0 ? '#2d3748' : '#4a5568'}; font-weight: bold;">
                    ${formatPakistaniCurrency(Math.abs(transaction.balance))}${transaction.balance >= 0 ? ' Dr' : ' Cr'}
                  </td>` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : `
        <div class="no-transactions">منتخب مدت میں کوئی لین دین نہیں ملا۔</div>
      `}

      <!-- Closing Balance -->
      <div class="closing-balance">
        <span>اختتامی بیلنس:</span>
        <span>
          ${formatPakistaniCurrency(Math.abs(closingBalance))} ${closingBalance >= 0 ? '(گاہک کا قرض)' : '(ہمارا قرض)'}
        </span>
      </div>

      <!-- Footer -->
      <div class="footer">
        تیار کردہ: ${new Date().toLocaleDateString('ur-PK')} بوقت ${new Date().toLocaleTimeString('ur-PK')}
      </div>
    </body>
    </html>
  `;
}

function UrduStatementHTML({ statementData, shopSettings, startDate, endDate, preferences = {} }) {
  const handlePrint = () => {
    const htmlContent = generateUrduStatementHTML(statementData, shopSettings, startDate, endDate, preferences);
    
    // Check if we're in Electron
    if (window.electronAPI) {
      // Save HTML to temp file and open it
      window.electronAPI.saveAndOpenUrduInvoice(htmlContent, `urdu-statement-${statementData.contact.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.html`);
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
      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      اردو بیان
    </button>
  );
}

export default UrduStatementHTML;