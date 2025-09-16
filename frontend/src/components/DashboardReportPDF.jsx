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
  col1: { flex: 2 }, // Date/Type
  col2: { flex: 4 }, // Description
  col3: { flex: 2, textAlign: "right" }, // Debit
  col4: { flex: 2, textAlign: "right" }, // Credit
  col5: { flex: 2, textAlign: "right" }, // Balance
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    color: "#2d3748",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
  },
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
  summaryLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  summaryAmount: {
    fontSize: 11,
    fontWeight: "bold",
  },
  netProfitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #718096",
  },
  netProfitLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  netProfitAmount: {
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
  noData: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    marginTop: 20,
    marginBottom: 20,
    fontStyle: "italic",
  },
});

function DashboardReportPDF({ reportData, dateRange, shopSettings }) {
  const { startDate, endDate } = dateRange;
  const { dashboardData, salesStats } = reportData;

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
      return `Report Period: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    } else if (startDate) {
      return `Report from: ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Report up to: ${formatDate(endDate)}`;
    }
    return "Complete Business Report";
  };

  // Calculate totals
  const totalSales = salesStats?.totalSales || 0;
  const totalPurchases = salesStats?.totalPurchases || 0;
  const totalExpenses = salesStats?.totalExpenses || 0;
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;

  // Create ledger entries
  const ledgerEntries = [];
  
  // Add sales entries
  if (totalSales > 0) {
    ledgerEntries.push({
      type: 'SALES',
      description: '💰 Total Sales Revenue',
      debit: totalSales,
      credit: 0,
      icon: '💰'
    });
  }

  // Add purchase entries
  if (totalPurchases > 0) {
    ledgerEntries.push({
      type: 'PURCHASE',
      description: '📦 Total Purchases',
      debit: 0,
      credit: totalPurchases,
      icon: '📦'
    });
  }

  // Add expense entries
  if (totalExpenses > 0) {
    ledgerEntries.push({
      type: 'EXPENSE',
      description: '💸 Total Expenses',
      debit: 0,
      credit: totalExpenses,
      icon: '💸'
    });
  }

  // Calculate running balance
  let runningBalance = 0;
  ledgerEntries.forEach(entry => {
    runningBalance += entry.debit - entry.credit;
    entry.runningBalance = runningBalance;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {shopSettings?.logo && (
            <Image src={shopSettings.logo} style={styles.logo} />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.shopName}>{shopSettings?.shopName || "BUSINESS LEDGER"}</Text>
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
        <Text style={styles.title}>BUSINESS LEDGER REPORT</Text>

        {/* Period */}
        <View style={styles.periodBox}>
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{formatPeriod()}</Text>
        </View>

        {/* Financial Ledger Table */}
        {ledgerEntries && ledgerEntries.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>TYPE</Text>
              <Text style={styles.col2}>DESCRIPTION</Text>
              <Text style={styles.col3}>DEBIT</Text>
              <Text style={styles.col4}>CREDIT</Text>
              <Text style={styles.col5}>BALANCE</Text>
            </View>

            {ledgerEntries.map((entry, index) => (
              <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={index}>
                <Text style={styles.col1}>{entry.type}</Text>
                <Text style={styles.col2}>{entry.description}</Text>
                <Text style={styles.col3}>
                  {entry.debit > 0 ? formatPakistaniCurrencyPDF(entry.debit) : '-'}
                </Text>
                <Text style={styles.col4}>
                  {entry.credit > 0 ? formatPakistaniCurrencyPDF(entry.credit) : '-'}
                </Text>
                <Text style={[styles.col5, { 
                  color: entry.runningBalance >= 0 ? "#2d3748" : "#4a5568",
                  fontWeight: "bold"
                }]}>
                  {formatPakistaniCurrencyPDF(Math.abs(entry.runningBalance))}
                  {entry.runningBalance >= 0 ? " Dr" : " Cr"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>No financial data found for the selected period.</Text>
        )}

        {/* Transaction Legend */}
        {ledgerEntries && ledgerEntries.length > 0 && (
          <View style={{
            marginTop: 10,
            padding: 8,
            backgroundColor: "#f8f9fa",
            borderRadius: 4,
            fontSize: 8
          }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Transaction Types:</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Text>💰 Sales Revenue • 📦 Purchases • 💸 Expenses</Text>
            </View>
          </View>
        )}

        {/* Summary Section */}
        <Text style={styles.sectionTitle}>📊 FINANCIAL SUMMARY</Text>
        
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Sales Revenue:</Text>
            <Text style={styles.summaryAmount}>{formatPakistaniCurrencyPDF(totalSales)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Purchases:</Text>
            <Text style={styles.summaryAmount}>{formatPakistaniCurrencyPDF(totalPurchases)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Profit (Sales - Purchases):</Text>
            <Text style={[styles.summaryAmount, { color: grossProfit >= 0 ? "#68d391" : "#fc8181" }]}>
              {formatPakistaniCurrencyPDF(grossProfit)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses:</Text>
            <Text style={styles.summaryAmount}>{formatPakistaniCurrencyPDF(totalExpenses)}</Text>
          </View>
          
          <View style={styles.netProfitRow}>
            <Text style={styles.netProfitLabel}>Net Profit (After Expenses):</Text>
            <Text style={[styles.netProfitAmount, { color: netProfit >= 0 ? "#68d391" : "#fc8181" }]}>
              {formatPakistaniCurrencyPDF(netProfit)}
            </Text>
          </View>
        </View>

        {/* Business Metrics */}
        <Text style={styles.sectionTitle}>📈 BUSINESS METRICS</Text>
        
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>METRIC</Text>
            <Text style={styles.col2}>DESCRIPTION</Text>
            <Text style={styles.col3}>VALUE</Text>
            <Text style={styles.col4}>COUNT</Text>
            <Text style={styles.col5}>AVERAGE</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.col1}>SALES</Text>
            <Text style={styles.col2}>📊 Sales Performance</Text>
            <Text style={styles.col3}>{formatPakistaniCurrencyPDF(totalSales)}</Text>
            <Text style={styles.col4}>{salesStats?.totalTransactions || 0}</Text>
            <Text style={styles.col5}>{formatPakistaniCurrencyPDF(salesStats?.averageSaleValue || 0)}</Text>
          </View>

          <View style={styles.tableRowAlt}>
            <Text style={styles.col1}>PURCHASE</Text>
            <Text style={styles.col2}>🛒 Purchase Activity</Text>
            <Text style={styles.col3}>{formatPakistaniCurrencyPDF(totalPurchases)}</Text>
            <Text style={styles.col4}>{salesStats?.totalPurchaseTransactions || 0}</Text>
            <Text style={styles.col5}>{formatPakistaniCurrencyPDF(salesStats?.averagePurchaseValue || 0)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.col1}>INVENTORY</Text>
            <Text style={styles.col2}>📦 Stock Overview</Text>
            <Text style={styles.col3}>{dashboardData?.totalProducts || 0} Products</Text>
            <Text style={styles.col4}>{dashboardData?.totalInventory || 0} Units</Text>
            <Text style={styles.col5}>{dashboardData?.lowStock || 0} Low Stock</Text>
          </View>

          <View style={styles.tableRowAlt}>
            <Text style={styles.col1}>PROFIT</Text>
            <Text style={styles.col2}>💹 Profitability</Text>
            <Text style={styles.col3}>
              {totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) + '%' : '0%'} Margin
            </Text>
            <Text style={styles.col4}>
              {formatPakistaniCurrencyPDF(grossProfit)} Gross
            </Text>
            <Text style={styles.col5}>
              {formatPakistaniCurrencyPDF(netProfit)} Net
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

export default DashboardReportPDF;