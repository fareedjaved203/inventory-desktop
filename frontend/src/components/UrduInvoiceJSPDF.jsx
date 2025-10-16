import React from "react";
import jsPDF from "jspdf";

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

function generateUrduInvoicePDF(sale, shopSettings, preferences = {}) {
  const doc = new jsPDF();
  
  // Set font for better Unicode support
  doc.setFont("helvetica");
  
  let yPosition = 30;
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(shopSettings?.shopName || "رانا قدیر صاحب", 105, yPosition, { align: "center" });
  
  yPosition += 20;
  
  // Title
  doc.setFontSize(16);
  doc.text("رسید", 105, yPosition, { align: "center" });
  
  yPosition += 20;
  
  // Customer Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("گاہک: " + (sale.contact?.name || "واک ان کسٹمر"), 20, yPosition);
  
  yPosition += 10;
  
  if (sale.contact?.phoneNumber && preferences.showContactPhone !== false) {
    doc.text("فون: " + sale.contact.phoneNumber, 20, yPosition);
    yPosition += 10;
  }
  
  if (sale.contact?.address && preferences.showContactAddress !== false) {
    doc.text("پتہ: " + sale.contact.address, 20, yPosition);
    yPosition += 10;
  }
  
  yPosition += 10;
  
  // Invoice Info
  doc.text("تاریخ: " + new Date(sale.saleDate).toLocaleDateString('ur-PK'), 20, yPosition);
  doc.text("بل نمبر: #" + sale.billNumber, 120, yPosition);
  
  yPosition += 20;
  
  // Description
  if (preferences.showDescription !== false && sale.description) {
    doc.text("تفصیل: " + sale.description, 20, yPosition);
    yPosition += 15;
  }
  
  // Transport Details
  if (preferences.showTransportDetails !== false && (sale.transport || sale.transportCost || sale.loadingDate || sale.arrivalDate)) {
    doc.setFont("helvetica", "bold");
    doc.text("ٹرانسپورٹ کی تفصیلات", 105, yPosition, { align: "center" });
    yPosition += 10;
    
    doc.setFont("helvetica", "normal");
    if (preferences.showCarNumber !== false && sale.transport?.carNumber) {
      doc.text("گاڑی نمبر: " + sale.transport.carNumber, 20, yPosition);
      yPosition += 8;
    }
    
    if (preferences.showLoadingDate !== false && sale.loadingDate) {
      doc.text("لوڈنگ کی تاریخ: " + new Date(sale.loadingDate).toLocaleDateString(), 20, yPosition);
      yPosition += 8;
    }
    
    if (preferences.showArrivalDate !== false && sale.arrivalDate) {
      doc.text("پہنچنے کی تاریخ: " + new Date(sale.arrivalDate).toLocaleDateString(), 20, yPosition);
      yPosition += 8;
    }
    
    if (preferences.showTransportCost !== false && sale.transportCost) {
      doc.text("ٹرانسپورٹ کی لاگت: " + formatPakistaniCurrency(sale.transportCost), 20, yPosition);
      yPosition += 8;
    }
    
    yPosition += 10;
  }
  
  // Table Header
  doc.setFont("helvetica", "bold");
  doc.text("پروڈکٹ", 20, yPosition);
  doc.text("ریٹ", 80, yPosition);
  doc.text("مقدار", 120, yPosition);
  doc.text("کل", 160, yPosition);
  
  // Draw line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 15;
  
  // Table Rows
  doc.setFont("helvetica", "normal");
  sale.items.forEach((item) => {
    doc.text(item.product.name, 20, yPosition);
    doc.text(formatPakistaniCurrency(item.price, false), 80, yPosition);
    doc.text(item.quantity.toString(), 120, yPosition);
    doc.text(formatPakistaniCurrency(item.price * item.quantity, false), 160, yPosition);
    yPosition += 10;
  });
  
  yPosition += 10;
  
  // Summary
  doc.setFont("helvetica", "bold");
  doc.text("کل رقم: " + formatPakistaniCurrency(sale.totalAmount), 120, yPosition);
  yPosition += 10;
  doc.text("ادا شدہ رقم: " + formatPakistaniCurrency(sale.paidAmount), 120, yPosition);
  yPosition += 10;
  doc.text("باقی رقم: " + formatPakistaniCurrency(Math.max(sale.totalAmount - sale.paidAmount, 0)), 120, yPosition);
  
  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("استعمال کے بعد واپسی یا تبدیلی نہیں", 105, 280, { align: "center" });
  
  return doc;
}

function UrduInvoiceJSPDF({ sale, shopSettings, preferences = {} }) {
  const handleDownload = () => {
    const doc = generateUrduInvoicePDF(sale, shopSettings, preferences);
    doc.save(`urdu-invoice-${sale.billNumber}.pdf`);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      اردو PDF
    </button>
  );
}

export default UrduInvoiceJSPDF;