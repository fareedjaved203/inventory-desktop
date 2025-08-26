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
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 10,
  },
  logo: {
    maxWidth: 100,
    maxHeight: 100,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: "right",
    fontSize: 10,
    lineHeight: 1.4,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brands: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  recipientBox: {
    marginTop: 20,
    marginBottom: 15,
  },
  recipientTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 12,
    fontWeight: "bold",
  },
  invoiceBox: {
    backgroundColor: "white",
    color: "black",
    padding: 12,
    borderRadius: 4,
    width: 200,
    marginLeft: "auto",
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    marginBottom: 4,
  },
  invoiceTotal: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 4,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    padding: 6,
    borderBottom: "1px solid #ccc",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #eee",
  },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1, textAlign: "right" },
  col4: { flex: 1, textAlign: "right" },
  summary: {
    marginTop: 15,
    marginLeft: "auto",
    width: 200,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryTotal: {
    fontWeight: "bold",
    fontSize: 12,
    borderTop: "1px solid #000",
    marginTop: 6,
    paddingTop: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: "#666",
  },
  statusTag: {
    padding: '3 6',
    borderRadius: 4,
    fontSize: 10,
    marginLeft: 5,
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusDue: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusCredit: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusRefunded: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  returnsSection: {
    marginTop: 20,
    marginBottom: 15,
  },
  returnsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    backgroundColor: "#fef2f2",
    padding: 6,
  },
});

function SaleInvoicePDF({ sale, shopSettings }) {
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
        {/* Header */}
        <View style={styles.header}>
          {shopSettings?.logo && (
            <Image src={shopSettings.logo} style={styles.logo} />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.shopName}>{shopSettings?.shopName || "INVOICE"}</Text>
            {brands.length > 0 && (
              <Text style={styles.brands}>{brands.join(" • ")}</Text>
            )}
            {shopSettings?.shopDescription && (
              <Text>{shopSettings.shopDescription}</Text>
            )}
            {shopSettings?.shopDescription2 && (
              <Text>{shopSettings.shopDescription2}</Text>
            )}
            <Text> </Text>
            {shopSettings?.userName1 && (
              <Text>{shopSettings.userName1}: {shopSettings.userPhone1}</Text>
            )}
            {shopSettings?.userName2 && (
              <Text>{shopSettings.userName2}: {shopSettings.userPhone2}</Text>
            )}
            {shopSettings?.userName3 && (
              <Text>{shopSettings.userName3}: {shopSettings.userPhone3}</Text>
            )}
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.recipientBox}>
          <Text style={styles.recipientTitle}>RECIPIENT:</Text>
          <Text style={styles.recipientName}>
            {sale.contact?.name || "Walk-in Customer"}
          </Text>
          {Number(sale.contact?.phoneNumber) && (
            <Text>Phone: {sale.contact.phoneNumber}</Text>
          )}
          {sale.contact?.address && (
            <Text>{sale.contact.address}</Text>
          )}
        </View>

        {/* Invoice Box */}
        <View style={styles.invoiceBox}>
          <Text>Invoice #{sale.billNumber}</Text>
          <View style={styles.invoiceRow}>
            <Text>Issued</Text>
            <Text>{new Date(sale.saleDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text>Time</Text>
            <Text>{new Date(sale.saleDate).toLocaleTimeString()}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text>Status</Text>
            <Text style={[styles.statusTag, statusStyle]}>{status}</Text>
          </View>
          <Text style={styles.invoiceTotal}>
            {formatPakistaniCurrencyPDF(sale.totalAmount)}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>PRODUCT</Text>
            <Text style={styles.col2}>UNIT PRICE</Text>
            <Text style={styles.col3}>QTY</Text>
            <Text style={styles.col4}>TOTAL</Text>
          </View>

          {sale.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.col1}>{item.product.name}</Text>
              <Text style={styles.col2}>{formatPakistaniCurrencyPDF(item.price)}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>
                {formatPakistaniCurrencyPDF(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Returns Section */}
        {sale.returns && sale.returns.length > 0 && (
          <View style={styles.returnsSection}>
            <Text style={styles.returnsTitle}>RETURNED ITEMS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Return #</Text>
                <Text style={styles.col2}>Date</Text>
                <Text style={styles.col3}>Items</Text>
                <Text style={styles.col4}>Amount</Text>
              </View>
              {sale.returns.map((returnRecord, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.col1}>{returnRecord.returnNumber}</Text>
                  <Text style={styles.col2}>
                    {new Date(returnRecord.returnDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.col3}>
                    {returnRecord.items
                      .map(
                        (item) =>
                          `${item.product?.name || "Unknown Product"} x${
                            item.quantity
                          }`
                      )
                      .join(", ")}
                  </Text>
                  <Text style={styles.col4}>
                    {formatPakistaniCurrencyPDF(returnRecord.totalAmount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          {Number(sale.discount) > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text>Subtotal</Text>
                <Text>{formatPakistaniCurrencyPDF(sale.totalAmount + (sale.discount || 0))}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Discount</Text>
                <Text>-{formatPakistaniCurrencyPDF(sale.discount || 0)}</Text>
              </View>
            </>
          )}
          <View style={styles.summaryRow}>
            <Text>Total Amount</Text>
            <Text>{formatPakistaniCurrencyPDF(sale.totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Paid Amount</Text>
            <Text>{formatPakistaniCurrencyPDF(sale.paidAmount)}</Text>
          </View>
          {sale.returns && sale.returns.length > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text>Total Returned</Text>
                <Text>{formatPakistaniCurrencyPDF(sale.returns.reduce((sum, ret) => sum + ret.totalAmount, 0))}</Text>
              </View>
              {totalRefunded > 0 && (
                <View style={styles.summaryRow}>
                  <Text>Total Refunded</Text>
                  <Text>{formatPakistaniCurrencyPDF(totalRefunded)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text>Net Total After Returns</Text>
                <Text>{formatPakistaniCurrencyPDF(netAmount > 0 ? netAmount : 0)}</Text>
              </View>
            </>
          )}
          {balance > 0 ? (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>Balance Due</Text>
              <Text>{formatPakistaniCurrencyPDF(balance)}</Text>
            </View>
          ) : balance < 0 ? (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>Credit Balance</Text>
              <Text>{formatPakistaniCurrencyPDF(Math.abs(balance) <= sale.paidAmount ? Math.abs(balance) : 0)}</Text>
            </View>
          ) : (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>Status</Text>
              <Text>Fully Paid</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 8 }}>
            Need system like this? Contact: 03145292649
          </Text>
          <View style={{ border: '1px solid #666', padding: 5, borderRadius: 3 }}>
            <Text style={{ fontSize: 8 }}>
              Goods will not be returned or exchanged after use.
            </Text>
            <Text style={{ fontSize: 8 }}>
              No Return / Exchange after use.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default SaleInvoicePDF;