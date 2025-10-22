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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
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
    flexDirection: 'row-reverse',
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
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 3,
    fontSize: 8,
    textAlign: 'right',
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 8,
    textAlign: 'right',
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    border: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 10,
    textAlign: 'left',
  },
});

const URDU_COLUMN_LABELS = {
  date: 'تاریخ',
  productName: 'پروڈکٹ کا نام',
  category: 'قسم',
  purchaseQuantity: 'خریداری مقدار',
  purchasePrice: 'خریداری قیمت',
  supplierName: 'سپلائر',
  customerName: 'کسٹمر',
  saleQuantity: 'فروخت مقدار',
  saleUnitPrice: 'یونٹ قیمت',
  totalSalePrice: 'کل قیمت',
  profitLoss: 'منافع/نقصان'
};

function UrduDayBookReportPDF({ dayBookData, dateRange, shopSettings, visibleColumns = [] }) {
  const { data = [], summary = {} } = dayBookData || {};
  
  const columnsToShow = visibleColumns.length > 0 ? visibleColumns : [
    ['date', { label: 'تاریخ' }],
    ['productName', { label: 'پروڈکٹ کا نام' }],
    ['category', { label: 'قسم' }],
    ['purchaseQuantity', { label: 'خریداری مقدار' }],
    ['purchasePrice', { label: 'خریداری قیمت' }],
    ['supplierName', { label: 'سپلائر' }],
    ['customerName', { label: 'کسٹمر' }],
    ['saleQuantity', { label: 'فروخت مقدار' }],
    ['saleUnitPrice', { label: 'یونٹ قیمت' }],
    ['totalSalePrice', { label: 'کل قیمت' }],
    ['profitLoss', { label: 'منافع/نقصان' }]
  ];
  
  const columnWidth = `${100 / columnsToShow.length}%`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{shopSettings?.shopName || 'روزنامچہ رپورٹ'}</Text>
          <Text style={styles.subtitle}>
            روزنامچہ رپورٹ: {dateRange?.startDate} سے {dateRange?.endDate} تک
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            {columnsToShow.map(([key, col]) => (
              <View key={key} style={[styles.tableColHeader, { width: columnWidth }]}>
                <Text style={styles.tableCellHeader}>{URDU_COLUMN_LABELS[key] || col.label}</Text>
              </View>
            ))}
          </View>

          {data.map((item, index) => {
            const getCellValue = (key) => {
              switch (key) {
                case 'date': return new Date(item.date).toLocaleDateString();
                case 'productName': return item.productName || '-';
                case 'category': return item.category || '-';
                case 'purchaseQuantity': return item.purchaseQuantity || '-';
                case 'purchasePrice': return item.purchasePrice ? formatPakistaniCurrency(item.purchasePrice) : '-';
                case 'supplierName': return item.supplierName || '-';
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

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>خلاصہ</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>کل خریداری:</Text>
            <Text style={styles.summaryValue}>{formatPakistaniCurrency(summary.totalPurchaseAmount || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>کل فروخت:</Text>
            <Text style={styles.summaryValue}>{formatPakistaniCurrency(summary.totalSaleAmount || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>کل منافع:</Text>
            <Text style={styles.summaryValue}>{formatPakistaniCurrency(summary.totalProfit || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>کل اندراجات:</Text>
            <Text style={styles.summaryValue}>{summary.totalEntries || 0}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default UrduDayBookReportPDF;