import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register font for Urdu text
Font.register({
  family: 'NotoSansUrdu',
  src: 'https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2'
});

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
    fontFamily: "NotoSansUrdu",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 10,
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
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  recipientBox: {
    marginTop: 20,
    marginBottom: 15,
    textAlign: "right",
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
    marginRight: "auto",
    textAlign: "right",
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    marginBottom: 4,
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
  col1: { flex: 2, textAlign: "right" },
  col2: { flex: 1, textAlign: "center" },
  col3: { flex: 1, textAlign: "center" },
  col4: { flex: 1, textAlign: "center" },
  summary: {
    marginTop: 15,
    marginRight: "auto",
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
    textAlign: "center",
  },
  transportSection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  transportTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  transportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 10,
  },
});

function UrduInvoicePDF({ sale, shopSettings, preferences = {} }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.shopName}>{shopSettings?.shopName || "رانا قدیر صاحب"}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Raseed</Text>

        {/* Recipient */}
        <View style={styles.recipientBox}>
          <Text style={styles.recipientTitle}>Grahak:</Text>
          <Text style={styles.recipientName}>
            {sale.contact?.name || "Walk-in Customer"}
          </Text>
          {sale.contact?.phoneNumber && preferences.showContactPhone !== false && (
            <Text>Phone: {sale.contact.phoneNumber}</Text>
          )}
          {sale.contact?.address && preferences.showContactAddress !== false && (
            <Text>Pata: {sale.contact.address}</Text>
          )}
        </View>

        {/* Invoice Info */}
        <View style={styles.invoiceBox}>
          <View style={styles.invoiceRow}>
            <Text>Tareekh</Text>
            <Text>{new Date(sale.saleDate).toLocaleDateString('ur-PK')}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text>Bill Number</Text>
            <Text>#{sale.billNumber}</Text>
          </View>
        </View>

        {/* Transport Section */}
        {preferences.showTransportDetails !== false && (sale.transport || sale.transportCost || sale.loadingDate || sale.arrivalDate) && (
          <View style={styles.transportSection}>
            <Text style={styles.transportTitle}>Transport Ki Tafseelatت</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                {preferences.showCarNumber !== false && <Text style={styles.col1}>Gaari Number</Text>}
                {preferences.showLoadingDate !== false && <Text style={styles.col2}>Loading Ki Tareekh</Text>}
                {preferences.showArrivalDate !== false && <Text style={styles.col3}>Pahunchne Ki Tareekh</Text>}
                {preferences.showTransportCost !== false && <Text style={styles.col4}>Transport Ki Lagat</Text>}
              </View>
              <View style={styles.tableRow}>
                {preferences.showCarNumber !== false && <Text style={styles.col1}>{sale.transport?.carNumber || '-'}</Text>}
                {preferences.showLoadingDate !== false && <Text style={styles.col2}>{sale.loadingDate ? new Date(sale.loadingDate).toLocaleDateString() : '-'}</Text>}
                {preferences.showArrivalDate !== false && <Text style={styles.col3}>{sale.arrivalDate ? new Date(sale.arrivalDate).toLocaleDateString() : '-'}</Text>}
                {preferences.showTransportCost !== false && <Text style={styles.col4}>{sale.transportCost ? formatPakistaniCurrencyPDF(sale.transportCost) : '-'}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        {preferences.showDescription !== false && sale.description && (
          <View style={{ marginTop: 15, marginBottom: 15 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>Tafseel:</Text>
            <Text style={{ fontSize: 10 }}>{sale.description}</Text>
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Product</Text>
            <Text style={styles.col2}>Rate</Text>
            <Text style={styles.col3}>Miqdaar</Text>
            <Text style={styles.col4}>Kul</Text>
          </View>

          {sale.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.col1}>{item.product.name}</Text>
              <Text style={styles.col2}>{formatPakistaniCurrencyPDF(item.price, false)}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>{formatPakistaniCurrencyPDF(item.price * item.quantity, false)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Kul Raqam</Text>
            <Text>{formatPakistaniCurrencyPDF(sale.totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Ada Shuda Raqam</Text>
            <Text>{formatPakistaniCurrencyPDF(sale.paidAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text>Baqi Raqam</Text>
            <Text>{formatPakistaniCurrencyPDF(Math.max(sale.totalAmount - sale.paidAmount, 0))}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 8, textAlign: "center" }}>
            Istemal ke baad wapsi ya tabdeeli nahin
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default UrduInvoicePDF;