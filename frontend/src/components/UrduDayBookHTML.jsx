import React from 'react';
import { formatPakistaniCurrency } from '../utils/formatCurrency';

function UrduDayBookHTML({ dayBookData, dateRange, shopSettings, visibleColumns = [] }) {
  const { data = [], summary = {} } = dayBookData || {};
  
  const columnsToShow = visibleColumns.length > 0 ? visibleColumns : [
    ['date', { label: 'تاریخ' }],
    ['barcode', { label: 'بار کوڈ' }],
    ['productName', { label: 'پروڈکٹ کا نام' }],
    ['category', { label: 'قسم' }],
    ['purchaseQuantity', { label: 'خریداری مقدار' }],
    ['purchasePrice', { label: 'خریداری قیمت' }],
    ['supplierName', { label: 'سپلائر' }],
    ['paidAmount', { label: 'اداشدہ رقم' }],
    ['paymentDifference', { label: 'ادائیگی فرق' }],
    ['remainingAmount', { label: 'باقی رقم' }],
    ['customerName', { label: 'کسٹمر' }],
    ['saleQuantity', { label: 'فروخت مقدار' }],
    ['saleUnitPrice', { label: 'یونٹ قیمت' }],
    ['totalSalePrice', { label: 'کل قیمت' }],
    ['profitLoss', { label: 'منافع/نقصان' }]
  ];

  const URDU_COLUMN_LABELS = {
    date: 'تاریخ',
    barcode: 'بار کوڈ',
    productName: 'پروڈکٹ کا نام',
    category: 'قسم',
    purchaseQuantity: 'خریداری مقدار',
    purchasePrice: 'خریداری قیمت',
    supplierName: 'سپلائر',
    paidAmount: 'اداشدہ رقم',
    paymentDifference: 'ادائیگی فرق',
    remainingAmount: 'باقی رقم',
    customerName: 'کسٹمر',
    saleQuantity: 'فروخت مقدار',
    saleUnitPrice: 'یونٹ قیمت',
    totalSalePrice: 'کل قیمت',
    profitLoss: 'منافع/نقصان'
  };

  const getCellValue = (item, key) => {
    switch (key) {
      case 'date': return `${new Date(item.date).toLocaleDateString()} ${new Date(item.date).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit', hour12: true})}`;
      case 'barcode': return item.barcode || '-';
      case 'productName': return item.productName || '-';
      case 'category': return item.category || '-';
      case 'purchaseQuantity': return item.purchaseQuantity || '-';
      case 'purchasePrice': return item.purchasePrice ? formatPakistaniCurrency(item.purchasePrice) : '-';
      case 'supplierName': return item.supplierName || '-';
      case 'paidAmount': return item.paidAmount ? formatPakistaniCurrency(item.paidAmount) : '-';
      case 'paymentDifference': return item.paymentDifference ? formatPakistaniCurrency(item.paymentDifference) : '-';
      case 'remainingAmount': return item.remainingAmount ? formatPakistaniCurrency(item.remainingAmount) : '-';
      case 'customerName': return item.customerName || '-';
      case 'saleQuantity': return item.saleQuantity || '-';
      case 'saleUnitPrice': return item.saleUnitPrice ? formatPakistaniCurrency(item.saleUnitPrice) : '-';
      case 'totalSalePrice': return item.totalSalePrice ? formatPakistaniCurrency(item.totalSalePrice) : '-';
      case 'profitLoss': return formatPakistaniCurrency(item.profitLoss || 0);
      default: return '-';
    }
  };

  return (
    <div style={{
      fontFamily: 'Noto Nastaliq Urdu, serif',
      direction: 'rtl',
      padding: '20px',
      backgroundColor: 'white',
      minHeight: '100vh'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
        `}
      </style>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          {shopSettings?.shopName || 'روزنامچہ رپورٹ'}
        </h1>
        <h2 style={{ fontSize: '18px', margin: '0' }}>
          روزنامچہ رپورٹ: {dateRange?.startDate} سے {dateRange?.endDate} تک
        </h2>
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #000',
        fontSize: '12px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            {columnsToShow.map(([key, col]) => (
              <th key={key} style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                {URDU_COLUMN_LABELS[key] || col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} style={{
              backgroundColor: item.type === 'purchase' || item.type === 'purchase-edit' ? '#e3f2fd' : '#e8f5e8'
            }}>
              {columnsToShow.map(([key]) => (
                <td key={key} style={{
                  border: '1px solid #000',
                  padding: '6px',
                  textAlign: 'right'
                }}>
                  {getCellValue(item, key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #000'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'right' }}>
          خلاصہ
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <span>کل خریداری: </span>
            <strong>{formatPakistaniCurrency(summary.totalPurchaseAmount || 0)}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span>کل فروخت: </span>
            <strong>{formatPakistaniCurrency(summary.totalSaleAmount || 0)}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span>کل منافع: </span>
            <strong style={{ color: '#16a34a' }}>{formatPakistaniCurrency(summary.totalProfit || 0)}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span>کل اندراجات: </span>
            <strong>{summary.totalEntries || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UrduDayBookHTML;