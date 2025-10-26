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
    padding: 20,
    fontSize: 10,
    fontFamily: "NotoSansUrdu",
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
  // Column widths (RTL)
  colSr: { width: "8%", textAlign: "center", borderLeft: "1px solid #ccc" },
  colDescription: { width: "35%", paddingRight: 3, borderLeft: "1px solid #ccc", textAlign: "right" },
  colUom: { width: "12%", textAlign: "center", borderLeft: "1px solid #ccc" },
  colQty: { width: "10%", textAlign: "center", borderLeft: "1px solid #ccc" },
  colPrice: { width: "15%", textAlign: "right", paddingLeft: 3, borderLeft: "1px solid #ccc" },
  colAmount: { width: "20%", textAlign: "right", paddingLeft: 3 },
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
    borderRight: "none",
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

function UrduInvoicePDF({ sale, shopSettings, preferences = {} }) {
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
  
  // Determine status in Urdu
  let status = '';
  
  if (balance > 0) {
    status = 'ادائیگی باقی';
  } else if (balance < 0) {
    const allRefundsPaid = sale.returns?.every(ret => ret.refundPaid) || false;
    if (allRefundsPaid && totalRefunded > 0) {
      status = 'واپس کیا گیا';
    } else {
      status = 'کریڈٹ بیلنس';
    }
  } else {
    status = 'مکمل ادا شدہ';
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>{shopSettings?.shopName || "کمپنی کا نام"}</Text>
          {brands.length > 0 && (
            <Text style={styles.companySubtitle}>{brands.join(" • ")}</Text>
          )}
          {shopSettings?.shopDescription && (
            <Text style={styles.companySubtitle}>{shopSettings.shopDescription}</Text>
          )}
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>رسید</Text>

        {/* Date and Invoice Number */}
        <View style={styles.invoiceInfo}>
          <Text style={styles.dateSection}>تاریخ: {new Date(sale.saleDate).toLocaleDateString('ur-PK')}</Text>
          <Text style={styles.invoiceNumber}>رسید نمبر: {sale.billNumber}</Text>
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <Text style={styles.billToTitle}>بل کی تفصیلات:</Text>
          <Text style={styles.customerInfo}>گاہک کا نام: {sale.contact?.name || "واک ان کسٹمر"}</Text>
          {sale.contact?.phoneNumber && preferences.showContactPhone !== false && (
            <Text style={styles.customerInfo}>رابطہ نمبر: {sale.contact.phoneNumber}</Text>
          )}
          {sale.contact?.address && preferences.showContactAddress !== false && (
            <Text style={styles.customerInfo}>پتہ: {sale.contact.address}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colAmount}>رقم</Text>
            <Text style={styles.colPrice}>فی یونٹ ریٹ</Text>
            <Text style={styles.colQty}>مقدار</Text>
            <Text style={styles.colUom}>یونٹ</Text>
            <Text style={styles.colDescription}>اشیاء کی تفصیل</Text>
            <Text style={styles.colSr}>سیریل</Text>
          </View>

          {sale.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colAmount}>{formatPakistaniCurrencyPDF(item.price * item.quantity, false)}</Text>
              <Text style={styles.colPrice}>{formatPakistaniCurrencyPDF(item.price, false)}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUom}>{item.product.unit || 'عدد'}</Text>
              <Text style={styles.colDescription}>{item.product.name}</Text>
              <Text style={styles.colSr}>{i + 1}</Text>
            </View>
          ))}
          
          {/* Empty rows to fill space */}
          {Array.from({ length: Math.max(0, 20 - sale.items.length) }).map((_, i) => (
            <View style={styles.tableRow} key={`empty-${i}`}>
              <Text style={styles.colAmount}></Text>
              <Text style={styles.colPrice}></Text>
              <Text style={styles.colQty}></Text>
              <Text style={styles.colUom}></Text>
              <Text style={styles.colDescription}></Text>
              <Text style={styles.colSr}>{sale.items.length + i + 1}</Text>
            </View>
          ))}
          
          {/* TOTAL Row in table */}
          <View style={[styles.tableRow, { backgroundColor: "#fff", fontWeight: "bold", borderTop: "2px solid #000" }]}>
            <Text style={[styles.colAmount, { fontWeight: "bold" }]}>{formatPakistaniCurrencyPDF(sale.totalAmount, false)}</Text>
            <Text style={styles.colPrice}></Text>
            <Text style={styles.colQty}></Text>
            <Text style={styles.colUom}></Text>
            <Text style={[styles.colDescription, { fontWeight: "bold" }]}>کل</Text>
            <Text style={styles.colSr}></Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRight}>
            <Text style={{ fontWeight: "bold", fontSize: 9 }}>آرڈر کے ساتھ:</Text>
            <Text style={{ fontSize: 8, marginTop: 3 }}>{sale.description || ''}</Text>
            <Text> </Text>
            <Text> </Text>
            <Text style={{ fontWeight: "bold", fontSize: 9 }}>وصول کنندہ:</Text>
          </View>
          <View style={styles.summaryLeft}>
            {Number(sale.discount) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(sale.discount || 0, false)}</Text>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>رعایت</Text>
              </View>
            )}
            {sale.returns && sale.returns.length > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(sale.returns.reduce((sum, ret) => sum + ret.totalAmount, 0), false)}</Text>
                <Text style={{ fontWeight: "bold", fontSize: 9 }}>واپسی</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(balance > 0 ? balance : 0, false)}</Text>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>بقایا</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(sale.paidAmount, false)}</Text>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>نقد ادائیگی</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>{formatPakistaniCurrencyPDF(balance < 0 ? Math.abs(balance) : 0, false)}</Text>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>کریڈٹ</Text>
            </View>
          </View>
        </View>

        {/* Payment Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>ادائیگی کی صورتحال: {status}</Text>
          <View style={styles.statusRow}>
            <Text>{formatPakistaniCurrencyPDF(netAmount > 0 ? netAmount : 0)}</Text>
            <Text>خالص رقم (واپسی کے بعد):</Text>
          </View>
          <View style={styles.statusRow}>
            <Text>{formatPakistaniCurrencyPDF(sale.paidAmount)}</Text>
            <Text>ادا شدہ رقم:</Text>
          </View>
          {totalRefunded > 0 && (
            <View style={styles.statusRow}>
              <Text>{formatPakistaniCurrencyPDF(totalRefunded)}</Text>
              <Text>واپس شدہ رقم:</Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <Text style={styles.summaryLabel}>
              {balance > 0 ? formatPakistaniCurrencyPDF(balance) : balance < 0 ? formatPakistaniCurrencyPDF(Math.abs(balance)) : 'مکمل ادا شدہ'}
            </Text>
            <Text style={styles.summaryLabel}>
              {balance > 0 ? 'باقی رقم:' : balance < 0 ? 'کریڈٹ بیلنس:' : 'صورتحال:'}
            </Text>
          </View>
        </View>

        {/* Returns Section */}
        {sale.returns && sale.returns.length > 0 && (
          <View style={styles.returnsSection}>
            <Text style={styles.returnsTitle}>واپس شدہ اشیاء:</Text>
            {sale.returns.map((returnRecord, index) => (
              <Text key={index} style={{ fontSize: 8, marginBottom: 2 }}>
                واپسی #{returnRecord.returnNumber} ({new Date(returnRecord.returnDate).toLocaleDateString('ur-PK')}): 
                {returnRecord.items.map(item => `${item.product?.name || "نامعلوم"} x${item.quantity}`).join(", ")} 
                - {formatPakistaniCurrencyPDF(returnRecord.totalAmount)}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>چیک اور منظور شدہ: _________________________</Text>
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

export default UrduInvoicePDF;