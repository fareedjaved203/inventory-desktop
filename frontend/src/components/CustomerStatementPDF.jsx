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
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "2px solid #4a5568",
    paddingBottom: 10,
  },
  logo: {
    maxWidth: 80,
    maxHeight: 80,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: "right",
    fontSize: 9,
    lineHeight: 1.4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brands: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2d3748",
  },
  customerBox: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  customerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#2d3748",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  periodBox: {
    marginBottom: 15,
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 4,
    textAlign: "center",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  balanceAmount: {
    fontSize: 11,
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4a5568",
    color: "white",
    fontWeight: "bold",
    padding: 6,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #eee",
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #eee",
    backgroundColor: "#f8f9fa",
    fontSize: 9,
  },
  col1: { flex: 2 }, // Date
  col2: { flex: 4 }, // Description
  col3: { flex: 2, textAlign: "right" }, // Debit
  col4: { flex: 2, textAlign: "right" }, // Credit
  col5: { flex: 2, textAlign: "right" }, // Balance
  closingBalance: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#4a5568",
    color: "white",
    borderRadius: 4,
  },
  closingBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closingBalanceLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  closingBalanceAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: "#666",
    borderTop: "1px solid #ccc",
    paddingTop: 10,
  },
  contactInfo: {
    fontSize: 8,
    color: "#666",
    textAlign: "center",
    fontWeight: "bold",
  },
  noTransactions: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    marginTop: 20,
    marginBottom: 20,
    fontStyle: "italic",
  },
});

function CustomerStatementPDF({ statementData, shopSettings, startDate, endDate }) {
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
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatPeriod = () => {
    if (startDate && endDate) {
      return `Statement Period: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    } else if (startDate) {
      return `Statement from: ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Statement up to: ${formatDate(endDate)}`;
    }
    return "Complete Statement";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {shopSettings?.logo && (
            <Image src={shopSettings.logo} style={styles.logo} />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.shopName}>{shopSettings?.shopName || "CUSTOMER STATEMENT"}</Text>
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

        {/* Title */}
        <Text style={styles.title}>CUSTOMER STATEMENT</Text>

        {/* Customer Details */}
        <View style={styles.customerBox}>
          <Text style={styles.customerTitle}>CUSTOMER DETAILS:</Text>
          <Text style={styles.customerName}>{contact.name}</Text>
          {Number(contact.phoneNumber) && (
            <Text>Phone: {contact.phoneNumber}</Text>
          )}
          {contact.address && (
            <Text>Address: {contact.address}</Text>
          )}
        </View>

        {/* Period */}
        <View style={styles.periodBox}>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{formatPeriod()}</Text>
        </View>

        {/* Opening Balance */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Opening Balance:</Text>
          <Text style={[styles.balanceAmount, { color: openingBalance >= 0 ? "#2d3748" : "#4a5568" }]}>
            {formatPakistaniCurrencyPDF(Math.abs(openingBalance))} {openingBalance >= 0 ? "(Receivable)" : "(Payable)"}
          </Text>
        </View>

        {/* Transactions Table */}
        {transactions && transactions.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>DATE</Text>
              <Text style={styles.col2}>DESCRIPTION</Text>
              <Text style={styles.col3}>DEBIT</Text>
              <Text style={styles.col4}>CREDIT</Text>
              <Text style={styles.col5}>BALANCE</Text>
            </View>

            {transactions.map((transaction, index) => {
              const getTransactionIcon = (type) => {
                switch(type) {
                  case 'SALE': return '📄';
                  case 'PURCHASE': return '📦';
                  case 'PURCHASE_PAYMENT': return '💳';
                  case 'LOAN': return '💰';
                  case 'RETURN': return '↩️';
                  default: return '📋';
                }
              };
              
              return (
                <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={index}>
                  <Text style={styles.col1}>{formatDate(transaction.date)}</Text>
                  <Text style={styles.col2}>
                    {getTransactionIcon(transaction.type)} {transaction.description}
                  </Text>
                  <Text style={styles.col3}>
                    {transaction.debit > 0 ? formatPakistaniCurrencyPDF(transaction.debit) : '-'}
                  </Text>
                  <Text style={styles.col4}>
                    {transaction.credit > 0 ? formatPakistaniCurrencyPDF(transaction.credit) : '-'}
                  </Text>
                  <Text style={[styles.col5, { 
                    color: transaction.runningBalance >= 0 ? "#2d3748" : "#4a5568",
                    fontWeight: "bold"
                  }]}>
                    {formatPakistaniCurrencyPDF(Math.abs(transaction.runningBalance))}
                    {transaction.runningBalance >= 0 ? " Dr" : " Cr"}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noTransactions}>No transactions found for the selected period.</Text>
        )}

        {/* Transaction Legend */}
        {transactions && transactions.length > 0 && (
          <View style={{
            marginTop: 10,
            padding: 8,
            backgroundColor: "#f8f9fa",
            borderRadius: 4,
            fontSize: 8
          }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Transaction Types:</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Text>📄 Sales • 📦 Purchases • 💳 Payments • 💰 Loans • ↩️ Returns</Text>
            </View>
          </View>
        )}

        {/* Closing Balance */}
        <View style={styles.closingBalance}>
          <View style={styles.closingBalanceRow}>
            <Text style={styles.closingBalanceLabel}>Closing Balance:</Text>
            <Text style={styles.closingBalanceAmount}>
              {formatPakistaniCurrencyPDF(Math.abs(closingBalance))} {closingBalance >= 0 ? "(Customer Owes)" : "(We Owe Customer)"}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString()}</Text>
          <Text style={styles.contactInfo}>
            Need system like this? Contact: 03145292649
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default CustomerStatementPDF;