import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

function formatPakistaniCurrencyPDF(amount, showCurrency = true) {
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

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000",
  },
  // Header section
  companyHeader: {
    textAlign: "center",
    marginBottom: 10,
    borderBottom: "2px solid #000",
    paddingBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  companySubtitle: {
    fontSize: 10,
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  // Invoice info section
  invoiceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dateSection: {
    fontSize: 10,
  },
  invoiceNumber: {
    fontSize: 10,
    textAlign: "right",
  },
  // Bill to section
  billToSection: {
    marginBottom: 15,
    border: "1px solid #000",
    padding: 8,
  },
  billToTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  customerInfo: {
    fontSize: 10,
    marginBottom: 2,
  },
  // Table styles
  table: {
    border: "1px solid #000",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 9,
    padding: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    fontSize: 9,
    padding: 3,
    minHeight: 20,
  },
  // Column widths
  colSr: { width: "8%", textAlign: "center", borderRight: "1px solid #ccc" },
  colDescription: { width: "35%", paddingLeft: 3, borderRight: "1px solid #ccc" },
  colUom: { width: "12%", textAlign: "center", borderRight: "1px solid #ccc" },
  colQty: { width: "10%", textAlign: "center", borderRight: "1px solid #ccc" },
  colPrice: { width: "15%", textAlign: "right", paddingRight: 3, borderRight: "1px solid #ccc" },
  colAmount: { width: "20%", textAlign: "right", paddingRight: 3 },
  // Summary section
  summarySection: {
    flexDirection: "row",
    marginTop: 10,
  },
  summaryLeft: {
    width: "50%",
    border: "1px solid #000",
    padding: 5,
  },
  summaryRight: {
    width: "50%",
    border: "1px solid #000",
    borderLeft: "none",
    padding: 5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 9,
  },
  summaryLabel: {
    fontWeight: "bold",
    fontSize: 9,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 10,
    fontWeight: "bold",
    borderTop: "1px solid #000",
    paddingTop: 3,
    marginTop: 3,
  },
  // Status section
  statusSection: {
    marginTop: 10,
    border: "1px solid #000",
    padding: 8,
  },
  statusTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 9,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: "left",
    fontSize: 8,
    paddingTop: 5,
  },
  shopDescriptionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    color: '#fff',
    textAlign: 'center',
    fontSize: 8,
    padding: 5,
    margin: 0,
  },
  returnsSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  returnsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
    backgroundColor: "#f0f0f0",
    padding: 3,
  },
});

function SaleInvoicePDF({ sale, shopSettings, preferences = {} }) {
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
  let statusStyle = {};
  
  if (balance > 0) {
    status = 'PAYMENT DUE';
    statusStyle = styles.statusDue;
  } else if (balance < 0) {
    const allRefundsPaid = sale.returns?.every(ret => ret.refundPaid) || false;
    if (allRefundsPaid && totalRefunded > 0) {
      status = 'REFUNDED';
      statusStyle = styles.statusRefunded;
    } else {
      status = 'CREDIT BALANCE';
      statusStyle = styles.statusCredit;
    }
  } else {
    status = 'FULLY PAID';
    statusStyle = styles.statusPaid;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>{shopSettings?.shopName || "COMPANY NAME"}</Text>
          {brands.length > 0 && (
            <Text style={styles.companySubtitle}>{brands.join(" • ")}</Text>
          )}
          {shopSettings?.shopDescription && (
            <Text style={styles.companySubtitle}>{shopSettings.shopDescription}</Text>
          )}
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Date and Invoice Number */}
        <View style={styles.invoiceInfo}>
          <Text style={styles.dateSection}>DATE: {new Date(sale.saleDate).toLocaleDateString()}</Text>
          <Text style={styles.invoiceNumber}>INVOICE NO.: {sale.billNumber}</Text>
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <Text style={styles.billToTitle}>BILL TO:</Text>
          <Text style={styles.customerInfo}>CUSTOMER NAME: {sale.contact?.name || "Walk-in Customer"}</Text>
          {sale.contact?.phoneNumber && preferences.showContactPhone !== false && (
            <Text style={styles.customerInfo}>CONTACT #: {sale.contact.phoneNumber}</Text>
          )}
          {sale.contact?.address && preferences.showContactAddress !== false && (
            <Text style={styles.customerInfo}>ADDRESS: {sale.contact.address}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colSr}>SR.</Text>
            <Text style={styles.colDescription}>ITEM DESCRIPTION</Text>
            <Text style={styles.colUom}>UOM</Text>
            <Text style={styles.colQty}>QTY</Text>
            <Text style={styles.colPrice}>UNIT PRICE</Text>
            <Text style={styles.colAmount}>AMOUNT</Text>
          </View>

          {sale.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colSr}>{i + 1}</Text>
              <Text style={styles.colDescription}>{item.product.name}</Text>
              <Text style={styles.colUom}>{item.product.unit || 'PCS'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatPakistaniCurrencyPDF(item.price, false)}</Text>
              <Text style={styles.colAmount}>{formatPakistaniCurrencyPDF(item.price * item.quantity, false)}</Text>
            </View>
          ))}
          
          {/* Empty rows to fill space */}
          {Array.from({ length: Math.max(0, 20 - sale.items.length) }).map((_, i) => (
            <View style={styles.tableRow} key={`empty-${i}`}>
              <Text style={styles.colSr}>{sale.items.length + i + 1}</Text>
              <Text style={styles.colDescription}></Text>
              <Text style={styles.colUom}></Text>
              <Text style={styles.colQty}></Text>
              <Text style={styles.colPrice}></Text>
              <Text style={styles.colAmount}></Text>
            </View>
          ))}
          
          {/* TOTAL Row in table */}
          <View style={[styles.tableRow, { backgroundColor: "#fff", fontWeight: "bold", borderTop: "2px solid #000" }]}>
            <Text style={styles.colSr}></Text>
            <Text style={[styles.colDescription, { fontWeight: "bold" }]}>TOTAL</Text>
            <Text style={styles.colUom}></Text>
            <Text style={styles.colQty}></Text>
            <Text style={styles.colPrice}></Text>
            <Text style={[styles.colAmount, { fontWeight: "bold" }]}>{formatPakistaniCurrencyPDF(sale.totalAmount, false)}</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryLeft}>
            {Number(sale.discount) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>DISCOUNT</Text>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(sale.discount || 0, false)}</Text>
              </View>
            )}
            {sale.returns && sale.returns.length > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>RETURNS</Text>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(sale.returns.reduce((sum, ret) => sum + ret.totalAmount, 0), false)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>BALANCE</Text>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(balance > 0 ? balance : 0, false)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>CASH PAID</Text>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(sale.paidAmount, false)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>CREDIT</Text>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(balance < 0 ? Math.abs(balance) : 0, false)}</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={{ fontWeight: "bold", fontSize: 9 }}>WITH THE ORDER:</Text>
            <Text style={{ fontSize: 8, marginTop: 3 }}>{sale.description || ''}</Text>
            <Text> </Text>
            <Text> </Text>
            <Text style={{ fontWeight: "bold", fontSize: 9 }}>RECEIVED BY:</Text>
          </View>
        </View>

        {/* Payment Status Section */}
        <View style={styles.statusSection}>
          {sale.returns && sale.returns.length > 0 && (
            <View style={styles.statusRow}>
              <Text>Net Amount (After Returns):</Text>
              <Text>{formatPakistaniCurrencyPDF(netAmount > 0 ? netAmount : 0)}</Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <Text>Amount Paid:</Text>
            <Text>{formatPakistaniCurrencyPDF(sale.paidAmount)}</Text>
          </View>
          {totalRefunded > 0 && (
            <View style={styles.statusRow}>
              <Text>Amount Refunded:</Text>
              <Text>{formatPakistaniCurrencyPDF(totalRefunded)}</Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <Text style={styles.summaryLabel}>
              {balance > 0 ? 'Amount Due:' : balance < 0 ? 'Credit Balance:' : 'Status:'}
            </Text>
            <Text style={styles.summaryLabel}>
              {balance > 0 ? formatPakistaniCurrencyPDF(balance) : balance < 0 ? formatPakistaniCurrencyPDF(Math.abs(balance)) : 'FULLY PAID'}
            </Text>
          </View>
        </View>

        {/* Returns Section */}
        {sale.returns && sale.returns.length > 0 && (
          <View style={styles.returnsSection}>
            <Text style={styles.returnsTitle}>RETURNED ITEMS:</Text>
            {sale.returns.map((returnRecord, index) => (
              <Text key={index} style={{ fontSize: 8, marginBottom: 2 }}>
                Return #{returnRecord.returnNumber} ({new Date(returnRecord.returnDate).toLocaleDateString()}): 
                {returnRecord.items.map(item => `${item.product?.name || "Unknown"} x${item.quantity}`).join(", ")} 
                - {formatPakistaniCurrencyPDF(returnRecord.totalAmount)}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{marginTop: '4px', marginBottom: '4px'}}>CHECK & APPROVED BY: _________________________</Text>
        </View>
        
        {/* Shop Description Footer */}
        {shopSettings?.shopDescription2 && (
          <View style={styles.shopDescriptionFooter}>
            <Text>{shopSettings.shopDescription2}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default SaleInvoicePDF;