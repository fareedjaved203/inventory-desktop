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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2d3748",
  },
  periodBox: {
    marginBottom: 15,
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 4,
    textAlign: "center",
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
  col1: { flex: 2 },
  col2: { flex: 4 },
  col3: { flex: 2, textAlign: "right" },
  col4: { flex: 2, textAlign: "right" },
  col5: { flex: 2, textAlign: "right" },
  summaryBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#4a5568",
    color: "white",
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  netProfitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #718096",
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
});

function ProfitLossStatementPDF({ reportData, dateRange, shopSettings }) {
  const { startDate, endDate } = dateRange;
  const { salesStats } = reportData;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatPeriod = () => {
    if (startDate && endDate) {
      return `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    }
    return "Complete Profit & Loss Statement";
  };

  const totalSales = Number(salesStats?.totalSales || 0);
  const totalPurchases = Number(salesStats?.totalPurchases || 0);
  const totalExpenses = Number(salesStats?.totalExpenses || 0);
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;

  const profitLossEntries = [
    {
      type: 'REVENUE',
      description: '💰 Total Sales Revenue',
      amount: totalSales,
      isCredit: false
    },
    {
      type: 'COGS',
      description: '📦 Cost of Goods Sold (Purchases)',
      amount: totalPurchases,
      isCredit: true
    },
    {
      type: 'GROSS',
      description: '📊 Gross Profit',
      amount: grossProfit,
      isCredit: false,
      isCalculated: true
    },
    {
      type: 'EXPENSE',
      description: '💸 Operating Expenses',
      amount: totalExpenses,
      isCredit: true
    },
    {
      type: 'NET',
      description: '🎯 Net Profit',
      amount: netProfit,
      isCredit: false,
      isCalculated: true
    }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {shopSettings?.logo && (
            <Image src={shopSettings.logo} style={styles.logo} />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.shopName}>{shopSettings?.shopName || "PROFIT & LOSS STATEMENT"}</Text>
            {shopSettings?.shopDescription && (
              <Text>{shopSettings.shopDescription}</Text>
            )}
            {shopSettings?.userName1 && (
              <Text>{shopSettings.userName1}: {shopSettings.userPhone1}</Text>
            )}
          </View>
        </View>

        <Text style={styles.title}>PROFIT & LOSS STATEMENT</Text>

        <View style={styles.periodBox}>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{formatPeriod()}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>TYPE</Text>
            <Text style={styles.col2}>DESCRIPTION</Text>
            <Text style={styles.col3}>DEBIT</Text>
            <Text style={styles.col4}>CREDIT</Text>
            <Text style={styles.col5}>AMOUNT</Text>
          </View>

          {profitLossEntries.map((entry, index) => (
            <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={index}>
              <Text style={styles.col1}>{entry.type}</Text>
              <Text style={styles.col2}>{entry.description}</Text>
              <Text style={styles.col3}>
                {!entry.isCredit && !entry.isCalculated ? formatPakistaniCurrencyPDF(entry.amount) : '-'}
              </Text>
              <Text style={styles.col4}>
                {entry.isCredit && !entry.isCalculated ? formatPakistaniCurrencyPDF(entry.amount) : '-'}
              </Text>
              <Text style={[styles.col5, { 
                fontWeight: "bold",
                color: entry.isCalculated ? (entry.amount >= 0 ? "#2d3748" : "#e53e3e") : "#2d3748"
              }]}>
                {formatPakistaniCurrencyPDF(Math.abs(entry.amount))}
                {entry.isCalculated && (entry.amount >= 0 ? " Profit" : " Loss")}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>Total Revenue:</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{formatPakistaniCurrencyPDF(totalSales)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>Total Costs:</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{formatPakistaniCurrencyPDF(totalPurchases + totalExpenses)}</Text>
          </View>
          
          <View style={styles.netProfitRow}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>Net Profit/Loss:</Text>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: "bold",
              color: netProfit >= 0 ? "#68d391" : "#fc8181"
            }}>
              {formatPakistaniCurrencyPDF(Math.abs(netProfit))} {netProfit >= 0 ? "PROFIT" : "LOSS"}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated on: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString()}</Text>
          <Text style={{ fontWeight: "bold" }}>Need system like this? Contact: 03145292649</Text>
        </View>
      </Page>
    </Document>
  );
}

export default ProfitLossStatementPDF;