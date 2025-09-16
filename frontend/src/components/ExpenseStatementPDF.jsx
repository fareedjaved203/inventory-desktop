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
  noData: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    marginTop: 20,
    marginBottom: 20,
    fontStyle: "italic",
  },
});

function ExpenseStatementPDF({ expenseData, dateRange, shopSettings }) {
  const { startDate, endDate } = dateRange;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatPeriod = () => {
    if (startDate && endDate) {
      return `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    }
    return "Complete Expense Statement";
  };

  // Sort expenses by date and calculate running totals
  const sortedExpenses = (expenseData || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let runningTotal = 0;
  const expensesWithRunningTotal = sortedExpenses.map(expense => {
    runningTotal += expense.amount;
    return {
      ...expense,
      runningTotal
    };
  });

  const totalExpenses = runningTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {shopSettings?.logo && (
            <Image src={shopSettings.logo} style={styles.logo} />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.shopName}>{shopSettings?.shopName || "EXPENSE STATEMENT"}</Text>
            {shopSettings?.shopDescription && (
              <Text>{shopSettings.shopDescription}</Text>
            )}
            {shopSettings?.userName1 && (
              <Text>{shopSettings.userName1}: {shopSettings.userPhone1}</Text>
            )}
          </View>
        </View>

        <Text style={styles.title}>EXPENSE STATEMENT</Text>

        <View style={styles.periodBox}>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{formatPeriod()}</Text>
        </View>

        {expensesWithRunningTotal && expensesWithRunningTotal.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>DATE</Text>
              <Text style={styles.col2}>DESCRIPTION</Text>
              <Text style={styles.col3}>CATEGORY</Text>
              <Text style={styles.col4}>AMOUNT</Text>
              <Text style={styles.col5}>TOTAL</Text>
            </View>

            {expensesWithRunningTotal.map((expense, index) => {
              const isRawMaterial = expense.category === 'Raw Materials';
              return (
                <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={expense.id || index}>
                  <Text style={styles.col1}>{formatDate(expense.date)}</Text>
                  <Text style={styles.col2}>
                    {isRawMaterial ? '🌿' : '💸'} {expense.description || 'Expense'}
                  </Text>
                  <Text style={styles.col3}>{expense.category || 'General'}</Text>
                  <Text style={styles.col4}>{formatPakistaniCurrencyPDF(expense.amount)}</Text>
                  <Text style={[styles.col5, { fontWeight: "bold" }]}>
                    {formatPakistaniCurrencyPDF(expense.runningTotal)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noData}>No expenses found for the selected period.</Text>
        )}

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>Total Expense Count:</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{expensesWithRunningTotal?.length || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>Average Expense Value:</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>
              {formatPakistaniCurrencyPDF(expensesWithRunningTotal?.length > 0 ? totalExpenses / expensesWithRunningTotal.length : 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>Total Expenses:</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#fc8181" }}>
              {formatPakistaniCurrencyPDF(totalExpenses)}
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

export default ExpenseStatementPDF;