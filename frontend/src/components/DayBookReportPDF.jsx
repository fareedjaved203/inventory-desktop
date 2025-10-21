import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatPakistaniCurrency } from '../utils/formatCurrency';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  purchaseRow: {
    backgroundColor: '#e3f2fd',
  },
  saleRow: {
    backgroundColor: '#e8f5e8',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 3,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 3,
    fontSize: 8,
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 7,
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    border: 1,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
});

function DayBookReportPDF({ dayBookData, dateRange, shopSettings, visibleColumns = [] }) {
  const { data = [], summary = {} } = dayBookData || {};
  
  // If no visible columns provided, show all columns
  const columnsToShow = visibleColumns.length > 0 ? visibleColumns : [
    ['date', { label: 'Date' }],
    ['loadingDate', { label: 'Loading Date' }],
    ['arrivalDate', { label: 'Arrival Date' }],
    ['carNumber', { label: 'Car Number' }],
    ['productName', { label: 'Product Name' }],
    ['category', { label: 'Category' }],
    ['productDescription', { label: 'Description' }],
    ['purchaseQuantity', { label: 'Purchase Qty' }],
    ['purchasePrice', { label: 'Purchase Price' }],
    ['transportCost', { label: 'Transport Cost' }],
    ['supplierName', { label: 'Supplier' }],
    ['totalPurchaseCost', { label: 'Total Cost' }],
    ['customerName', { label: 'Customer' }],
    ['saleQuantity', { label: 'Sale Qty' }],
    ['saleUnitPrice', { label: 'Unit Price' }],
    ['totalSalePrice', { label: 'Total Price' }],
    ['profitLoss', { label: 'Profit/Loss' }]
  ];
  
  const columnWidth = `${100 / columnsToShow.length}%`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{shopSettings?.shopName || 'Day Book Report'}</Text>
          <Text style={styles.subtitle}>
            Day Book Report: {dateRange?.startDate} to {dateRange?.endDate}
          </Text>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            {columnsToShow.map(([key, col]) => (
              <View key={key} style={[styles.tableColHeader, { width: columnWidth }]}>
                <Text style={styles.tableCellHeader}>{col.label}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {data.map((item, index) => {
            const getCellValue = (key) => {
              switch (key) {
                case 'date': return new Date(item.date).toLocaleDateString();
                case 'loadingDate': return item.loadingDate ? new Date(item.loadingDate).toLocaleDateString() : '-';
                case 'arrivalDate': return item.arrivalDate ? new Date(item.arrivalDate).toLocaleDateString() : '-';
                case 'carNumber': return item.carNumber || '-';
                case 'productName': return item.productName;
                case 'category': return item.category || '-';
                case 'productDescription': return item.productDescription || '-';
                case 'purchaseQuantity': return item.purchaseQuantity || '-';
                case 'purchasePrice': return item.purchasePrice ? formatPakistaniCurrency(item.purchasePrice) : '-';
                case 'transportCost': return item.transportCost ? formatPakistaniCurrency(item.transportCost) : '-';
                case 'supplierName': return item.supplierName || '-';
                case 'totalPurchaseCost': return item.totalPurchaseCost ? formatPakistaniCurrency(item.totalPurchaseCost) : '-';
                case 'customerName': return item.customerName || '-';
                case 'saleQuantity': return item.saleQuantity || '-';
                case 'saleUnitPrice': return item.saleUnitPrice ? formatPakistaniCurrency(item.saleUnitPrice) : '-';
                case 'totalSalePrice': return item.totalSalePrice ? formatPakistaniCurrency(item.totalSalePrice) : '-';
                case 'profitLoss': return item.profitLoss ? formatPakistaniCurrency(item.profitLoss) : '-';
                default: return '-';
              }
            };
            
            return (
              <View style={[styles.tableRow, item.type === 'purchase' ? styles.purchaseRow : styles.saleRow]} key={index}>
                {columnsToShow.map(([key]) => (
                  <View key={key} style={[styles.tableCol, { width: columnWidth }]}>
                    <Text style={styles.tableCell}>{getCellValue(key)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text>Total Purchase Amount:</Text>
            <Text>{formatPakistaniCurrency(summary.totalPurchaseAmount || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Sale Amount:</Text>
            <Text>{formatPakistaniCurrency(summary.totalSaleAmount || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Profit:</Text>
            <Text>{formatPakistaniCurrency(summary.totalProfit || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Entries:</Text>
            <Text>{summary.totalEntries || 0}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default DayBookReportPDF;