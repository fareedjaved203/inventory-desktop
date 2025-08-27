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
    width: 226, // 80mm in points
    padding: 10,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#000",
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
    borderBottom: "1px solid #000",
    paddingBottom: 5,
  },
  logo: {
    maxWidth: 40,
    maxHeight: 40,
    objectFit: 'contain',
    alignSelf: 'center',
    marginBottom: 3,
  },
  shopName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  brands: {
    fontSize: 7,
    marginBottom: 1,
  },
  contactInfo: {
    fontSize: 7,
    lineHeight: 1.2,
  },
  invoiceInfo: {
    marginBottom: 8,
    fontSize: 7,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  customer: {
    marginBottom: 8,
    fontSize: 7,
  },
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    paddingBottom: 2,
    marginBottom: 3,
    fontSize: 7,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 7,
  },
  col1: { flex: 3 }, // Product name
  col2: { flex: 1, textAlign: "right" }, // Qty
  col3: { flex: 2, textAlign: "right" }, // Price
  col4: { flex: 2, textAlign: "right" }, // Total
  summary: {
    borderTop: "1px solid #000",
    paddingTop: 5,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    fontSize: 7,
  },
  summaryTotal: {
    fontWeight: "bold",
    fontSize: 8,
    borderTop: "1px solid #000",
    marginTop: 3,
    paddingTop: 3,
  },
  footer: {
    textAlign: "center",
    fontSize: 6,
    marginTop: 10,
    borderTop: "1px solid #000",
    paddingTop: 5,
  },
  statusTag: {
    fontSize: 6,
    textAlign: "center",
    marginBottom: 3,
  },
});

function SaleReceiptPDF({ sale, shopSettings }) {
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
  
  let status = '';
  if (balance > 0) {
    status = 'PAYMENT DUE';
  } else if (balance < 0) {
    const allRefundsPaid = sale.returns?.every(ret => ret.refundPaid) || false;
    if (allRefundsPaid && totalRefunded > 0) {
      status = 'REFUNDED';
    } else {
      status = 'CREDIT BALANCE';
    }
  } else {
    status = 'FULLY PAID';
  }

  return (
    <Document>
      <Page size={[226, 'auto']} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {shopSettings?.logo && (
            <Image src={shopSettings.logo} style={styles.logo} />
          )}
          <Text style={styles.shopName}>{shopSettings?.shopName || "RECEIPT"}</Text>
          {brands.length > 0 && (
            <Text style={styles.brands}>{brands.join(" • ")}</Text>
          )}
          {shopSettings?.shopDescription && (
            <Text style={styles.contactInfo}>{shopSettings.shopDescription}</Text>
          )}
          {shopSettings?.shopDescription2 && (
            <Text style={styles.contactInfo}>{shopSettings.shopDescription2}</Text>
          )}
          {shopSettings?.userName1 && (
            <Text style={styles.contactInfo}>{shopSettings.userName1}: {shopSettings.userPhone1}</Text>
          )}
        </View>

        {/* Invoice Info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.infoRow}>
            <Text>Receipt #:</Text>
            <Text>{sale.billNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text>Date:</Text>
            <Text>{new Date(sale.saleDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text>Time:</Text>
            <Text>{new Date(sale.saleDate).toLocaleTimeString()}</Text>
          </View>
        </View>

        {/* Customer */}
        {sale.contact && (
          <View style={styles.customer}>
            <Text>Customer: {sale.contact.name}</Text>
            {sale.contact.phoneNumber && (
              <Text>Phone: {sale.contact.phoneNumber}</Text>
            )}
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>ITEM</Text>
            <Text style={styles.col2}>QTY</Text>
            <Text style={styles.col3}>PRICE</Text>
            <Text style={styles.col4}>TOTAL</Text>
          </View>

          {sale.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.col1}>{item.product.name}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatPakistaniCurrencyPDF(item.price)}</Text>
              <Text style={styles.col4}>
                {formatPakistaniCurrencyPDF(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          {Number(sale.discount) > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text>Subtotal:</Text>
                <Text>{formatPakistaniCurrencyPDF(sale.totalAmount + (sale.discount || 0))}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Discount:</Text>
                <Text>-{formatPakistaniCurrencyPDF(sale.discount || 0)}</Text>
              </View>
            </>
          )}
          <View style={styles.summaryRow}>
            <Text>Total:</Text>
            <Text>{formatPakistaniCurrencyPDF(sale.totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Paid:</Text>
            <Text>{formatPakistaniCurrencyPDF(sale.paidAmount)}</Text>
          </View>
          {balance > 0 ? (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>Balance Due:</Text>
              <Text>{formatPakistaniCurrencyPDF(balance)}</Text>
            </View>
          ) : balance < 0 ? (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>Credit:</Text>
              <Text>{formatPakistaniCurrencyPDF(Math.abs(balance))}</Text>
            </View>
          ) : (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>Status:</Text>
              <Text>Paid</Text>
            </View>
          )}
        </View>

        {/* Status */}
        <View style={styles.statusTag}>
          <Text>{status}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>System: 03145292649</Text>
        </View>
      </Page>
    </Document>
  );
}

export default SaleReceiptPDF;