import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';
import API from '../utils/api';
import DataStorageManager from '../utils/DataStorageManager';
import { STORES } from '../utils/indexedDBSchema';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FaFileAlt, 
  FaChartLine, 
  FaMoneyBillWave, 
  FaShoppingCart, 
  FaUsers, 
  FaCalendarAlt,
  FaPrint,
  FaDownload,
  FaEye,
  FaFilter
} from 'react-icons/fa';

function Reports() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedContact, setSelectedContact] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch contacts for customer statements
  const { data: contacts } = useQuery(
    ['contacts'],
    async () => {
      const result = await API.getContacts({ limit: 1000 });
      return result.items;
    }
  );

  const reportTypes = [
    {
      id: 'profit-loss',
      title: language === 'ur' ? 'منافع و نقصان کا بیان' : 'Profit & Loss Statement',
      description: language === 'ur' ? 'مخصوص مدت کے لیے منافع اور نقصان کی تفصیل' : 'Detailed profit and loss analysis for a specific period',
      icon: <FaChartLine className="text-green-600" />,
      color: 'green',
      requiresDateRange: true
    },
    {
      id: 'customer-statement-en',
      title: 'Customer Statement (English)',
      description: 'Individual customer account statement in English',
      icon: <FaUsers className="text-blue-600" />,
      color: 'blue',
      requiresDateRange: true,
      requiresContact: true
    },
    {
      id: 'customer-statement-ur',
      title: language === 'ur' ? 'کسٹمر کا بیان (اردو)' : 'Customer Statement (Urdu)',
      description: language === 'ur' ? 'اردو میں انفرادی کسٹمر اکاؤنٹ کا بیان' : 'Individual customer account statement in Urdu',
      icon: <FaUsers className="text-purple-600" />,
      color: 'purple',
      requiresDateRange: true,
      requiresContact: true
    },
    {
      id: 'sales-report',
      title: language === 'ur' ? 'فروخت کی رپورٹ' : 'Sales Report',
      description: language === 'ur' ? 'تمام فروخت کی تفصیلی رپورٹ' : 'Comprehensive sales analysis and summary',
      icon: <FaMoneyBillWave className="text-emerald-600" />,
      color: 'emerald',
      requiresDateRange: true
    },
    {
      id: 'purchase-statement',
      title: language === 'ur' ? 'خریداری کا بیان' : 'Purchase Statement',
      description: language === 'ur' ? 'تمام خریداری کی تفصیلی رپورٹ' : 'Detailed purchase transactions and summary',
      icon: <FaShoppingCart className="text-orange-600" />,
      color: 'orange',
      requiresDateRange: true
    },
    {
      id: 'day-book-en',
      title: 'Day Book (English)',
      description: 'Daily transactions summary in English',
      icon: <FaCalendarAlt className="text-indigo-600" />,
      color: 'indigo',
      requiresDateRange: true
    },
    {
      id: 'day-book-ur',
      title: language === 'ur' ? 'روزنامچہ (اردو)' : 'Day Book (Urdu)',
      description: language === 'ur' ? 'اردو میں روزانہ لین دین کا خلاصہ' : 'Daily transactions summary in Urdu',
      icon: <FaCalendarAlt className="text-pink-600" />,
      color: 'pink',
      requiresDateRange: true
    },
    {
      id: 'inventory-report',
      title: language === 'ur' ? 'انوینٹری رپورٹ' : 'Inventory Report',
      description: language === 'ur' ? 'موجودہ اسٹاک کی تفصیلی رپورٹ' : 'Current stock levels and inventory valuation',
      icon: <FaFileAlt className="text-teal-600" />,
      color: 'teal',
      requiresDateRange: false
    }
  ];

  const generateReport = async (reportType) => {
    setIsGenerating(true);
    setSelectedReport(reportType);
    
    try {
      let data = null;
      
      switch (reportType.id) {
        case 'profit-loss':
          data = await generateProfitLossReport();
          break;
        case 'customer-statement-en':
        case 'customer-statement-ur':
          if (!selectedContact) {
            alert('Please select a customer first');
            return;
          }
          data = await generateCustomerStatement();
          break;
        case 'sales-report':
          data = await generateSalesReport();
          break;
        case 'purchase-statement':
          data = await generatePurchaseStatement();
          break;
        case 'day-book-en':
        case 'day-book-ur':
          data = await generateDayBookReport();
          break;
        case 'inventory-report':
          data = await generateInventoryReport();
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error.message || 'Error generating report. Please try again.';
      alert(errorMessage);
      setReportData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProfitLossReport = async () => {
    try {
      const salesData = await API.getSales({ limit: 10000 });
      const purchasesData = await API.getBulkPurchases({ limit: 10000 });
      
      // Calculate profit from sales items (considering purchase prices)
      let totalSalesRevenue = 0;
      let totalCostOfGoodsSold = 0;
      
      salesData.items?.forEach(sale => {
        totalSalesRevenue += Number(sale.totalAmount || 0);
        
        // Calculate COGS from sale items
        sale.items?.forEach(item => {
          const quantity = Number(item.quantity || 0);
          const purchasePrice = Number(item.product?.purchasePrice || item.product?.perUnitPurchasePrice || 0);
          totalCostOfGoodsSold += quantity * purchasePrice;
        });
      });
      
      const totalPurchases = purchasesData.items?.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0) || 0;
      const totalExpenses = 0; // Simplified for now
      const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;
      const netProfit = grossProfit - totalExpenses;

      return {
        totalSales: totalSalesRevenue,
        totalPurchases,
        totalCostOfGoodsSold,
        totalExpenses,
        grossProfit,
        netProfit,
        salesData: salesData.items || [],
        purchasesData: purchasesData.items || [],
        expensesData: []
      };
    } catch (error) {
      console.error('Error generating profit loss report:', error);
      throw error;
    }
  };

  const generateCustomerStatement = async () => {
    if (!selectedContact) {
      throw new Error('Please select a customer');
    }

    try {
      const salesData = await API.getSales({ limit: 10000 });
      const customerSales = salesData.items?.filter(sale => sale.contact?.id === selectedContact.id) || [];

      const totalSales = customerSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const totalPaid = customerSales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0);
      const balance = totalSales - totalPaid;

      return {
        customer: selectedContact,
        sales: customerSales,
        totalSales,
        totalPaid,
        balance
      };
    } catch (error) {
      console.error('Error generating customer statement:', error);
      throw error;
    }
  };

  const generateSalesReport = async () => {
    try {
      const salesData = await API.getSales({ limit: 10000 });

      // Calculate totals exactly like DashboardReportModal
      const totalSales = salesData.items?.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0) || 0;
      const totalPaid = salesData.items?.reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0) || 0;
      
      // Calculate due amount properly - (totalAmount - paidAmount) for each sale
      const totalDue = salesData.items?.reduce((sum, sale) => {
        const totalAmount = Number(sale.totalAmount || 0);
        const paidAmount = Number(sale.paidAmount || 0);
        const dueAmount = Math.max(0, totalAmount - paidAmount);
        return sum + dueAmount;
      }, 0) || 0;

      return {
        sales: salesData.items || [],
        totalSales,
        totalPaid,
        totalDue,
        productSales: {}
      };
    } catch (error) {
      console.error('Error generating sales report:', error);
      throw error;
    }
  };

  const generatePurchaseStatement = async () => {
    try {
      const purchasesData = await API.getBulkPurchases({ limit: 10000 });

      const totalPurchases = purchasesData.items?.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0) || 0;
      const totalPaid = purchasesData.items?.reduce((sum, purchase) => sum + (purchase.paidAmount || 0), 0) || 0;
      const totalDue = totalPurchases - totalPaid;

      return {
        purchases: purchasesData.items || [],
        totalPurchases,
        totalPaid,
        totalDue
      };
    } catch (error) {
      console.error('Error generating purchase statement:', error);
      throw error;
    }
  };

  const generateDayBookReport = async () => {
    try {
      const salesData = await API.getSales({ limit: 10000 });
      const purchasesData = await API.getBulkPurchases({ limit: 10000 });

      const dailyTransactions = {};
      
      salesData.items?.forEach(sale => {
        const date = new Date(sale.saleDate).toDateString();
        if (!dailyTransactions[date]) {
          dailyTransactions[date] = { sales: [], purchases: [], expenses: [] };
        }
        dailyTransactions[date].sales.push(sale);
      });

      purchasesData.items?.forEach(purchase => {
        const date = new Date(purchase.purchaseDate).toDateString();
        if (!dailyTransactions[date]) {
          dailyTransactions[date] = { sales: [], purchases: [], expenses: [] };
        }
        dailyTransactions[date].purchases.push(purchase);
      });

      return {
        dailyTransactions,
        totalSales: salesData.items?.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) || 0,
        totalPurchases: purchasesData.items?.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0) || 0,
        totalExpenses: 0
      };
    } catch (error) {
      console.error('Error generating day book report:', error);
      throw error;
    }
  };

  const generateInventoryReport = async () => {
    const productsData = await DataStorageManager.read(STORES.products, { limit: 10000 });
    
    const totalValue = productsData.items?.reduce((sum, product) => {
      const price = product.purchasePrice || product.retailPrice || product.price || 0;
      return sum + (price * product.quantity);
    }, 0) || 0;

    const lowStockItems = productsData.items?.filter(product => 
      product.quantity <= (product.lowStockThreshold || 10)
    ) || [];

    return {
      products: productsData.items || [],
      totalValue,
      lowStockItems,
      totalProducts: productsData.items?.length || 0
    };
  };

  const printReport = () => {
    if (!reportData || !selectedReport) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const reportHtml = generateReportHTML();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const downloadReport = () => {
    if (!reportData || !selectedReport) return;
    
    const reportHtml = generateReportHTML();
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.id}-${dateRange.startDate}-to-${dateRange.endDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportHTML = () => {
    const isUrdu = selectedReport.id.includes('-ur');
    const title = selectedReport.title;
    
    return `
      <!DOCTYPE html>
      <html ${isUrdu ? 'dir="rtl"' : ''}>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { 
            font-family: ${isUrdu ? 'Noto Nastaliq Urdu, Arial' : 'Arial, sans-serif'}; 
            margin: 20px; 
            ${isUrdu ? 'direction: rtl;' : ''}
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 10px; 
          }
          .company { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .report-title { font-size: 18px; color: #666; }
          .date-range { font-size: 12px; color: #888; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: ${isUrdu ? 'right' : 'left'}; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .number { text-align: right; }
          .total-row { background-color: #f0f8ff; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">HISAB GHAR</div>
          <div class="report-title">${title}</div>
          <div class="date-range">
            ${isUrdu ? 'تاریخ:' : 'Period:'} ${new Date(dateRange.startDate).toLocaleDateString()} ${isUrdu ? 'سے' : 'to'} ${new Date(dateRange.endDate).toLocaleDateString()}
          </div>
          <div class="date-range">
            ${isUrdu ? 'تیار کردہ:' : 'Generated on:'} ${new Date().toLocaleDateString('en-PK', { 
              year: 'numeric', month: 'long', day: 'numeric', 
              hour: '2-digit', minute: '2-digit' 
            })}
          </div>
        </div>
        ${generateReportContent(isUrdu)}
        <div class="footer">
          <p>${isUrdu ? 'حساب گھر انوینٹری مینجمنٹ سسٹم' : 'Hisab Ghar Inventory Management System'}</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateReportContent = (isUrdu) => {
    if (!reportData || !selectedReport) return '';

    switch (selectedReport.id) {
      case 'profit-loss':
        return `
          <table>
            <thead>
              <tr>
                <th>${isUrdu ? 'تفصیل' : 'Description'}</th>
                <th class="number">${isUrdu ? 'رقم' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${isUrdu ? 'کل فروخت' : 'Total Sales'}</td>
                <td class="number">${formatPakistaniCurrency(reportData.totalSales)}</td>
              </tr>
              <tr>
                <td>${isUrdu ? 'کل خریداری' : 'Total Purchases'}</td>
                <td class="number">${formatPakistaniCurrency(reportData.totalPurchases)}</td>
              </tr>
              <tr>
                <td>${isUrdu ? 'مجموعی منافع' : 'Gross Profit'}</td>
                <td class="number">${formatPakistaniCurrency(reportData.grossProfit)}</td>
              </tr>
              <tr>
                <td>${isUrdu ? 'کل اخراجات' : 'Total Expenses'}</td>
                <td class="number">${formatPakistaniCurrency(reportData.totalExpenses)}</td>
              </tr>
              <tr class="total-row">
                <td>${isUrdu ? 'خالص منافع' : 'Net Profit'}</td>
                <td class="number">${formatPakistaniCurrency(reportData.netProfit)}</td>
              </tr>
            </tbody>
          </table>
        `;
      
      case 'sales-report':
        return `
          <div style="margin-bottom: 20px;">
            <h3>${isUrdu ? 'خلاصہ' : 'Summary'}</h3>
            <p>${isUrdu ? 'کل فروخت:' : 'Total Sales:'} <strong>${formatPakistaniCurrency(reportData.totalSales)}</strong></p>
            <p>${isUrdu ? 'کل ادائیگی:' : 'Total Paid:'} <strong>${formatPakistaniCurrency(reportData.totalPaid)}</strong></p>
            <p>${isUrdu ? 'باقی رقم:' : 'Total Due:'} <strong>${formatPakistaniCurrency(reportData.totalDue)}</strong></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>${isUrdu ? 'بل نمبر' : 'Bill No.'}</th>
                <th>${isUrdu ? 'تاریخ' : 'Date'}</th>
                <th>${isUrdu ? 'کسٹمر' : 'Customer'}</th>
                <th class="number">${isUrdu ? 'کل رقم' : 'Total Amount'}</th>
                <th class="number">${isUrdu ? 'ادا شدہ' : 'Paid'}</th>
                <th class="number">${isUrdu ? 'باقی' : 'Due'}</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.sales.map(sale => `
                <tr>
                  <td>#${sale.billNumber}</td>
                  <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td>${sale.contact?.name || '-'}</td>
                  <td class="number">${formatPakistaniCurrency(sale.totalAmount)}</td>
                  <td class="number">${formatPakistaniCurrency(sale.paidAmount)}</td>
                  <td class="number">${formatPakistaniCurrency(sale.totalAmount - sale.paidAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case 'customer-statement-en':
      case 'customer-statement-ur':
        return `
          <div style="margin-bottom: 20px;">
            <h3>${isUrdu ? 'کسٹمر کی تفصیل' : 'Customer Details'}</h3>
            <p><strong>${isUrdu ? 'نام:' : 'Name:'}</strong> ${reportData.customer.name}</p>
            <p><strong>${isUrdu ? 'فون:' : 'Phone:'}</strong> ${reportData.customer.phoneNumber || '-'}</p>
            <p><strong>${isUrdu ? 'پتہ:' : 'Address:'}</strong> ${reportData.customer.address || '-'}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h3>${isUrdu ? 'خلاصہ' : 'Summary'}</h3>
            <p>${isUrdu ? 'کل فروخت:' : 'Total Sales:'} <strong>${formatPakistaniCurrency(reportData.totalSales)}</strong></p>
            <p>${isUrdu ? 'کل ادائیگی:' : 'Total Paid:'} <strong>${formatPakistaniCurrency(reportData.totalPaid)}</strong></p>
            <p>${isUrdu ? 'باقی رقم:' : 'Balance:'} <strong>${formatPakistaniCurrency(reportData.balance)}</strong></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>${isUrdu ? 'بل نمبر' : 'Bill No.'}</th>
                <th>${isUrdu ? 'تاریخ' : 'Date'}</th>
                <th class="number">${isUrdu ? 'کل رقم' : 'Total Amount'}</th>
                <th class="number">${isUrdu ? 'ادا شدہ' : 'Paid'}</th>
                <th class="number">${isUrdu ? 'باقی' : 'Balance'}</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.sales.map(sale => `
                <tr>
                  <td>#${sale.billNumber}</td>
                  <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td class="number">${formatPakistaniCurrency(sale.totalAmount)}</td>
                  <td class="number">${formatPakistaniCurrency(sale.paidAmount)}</td>
                  <td class="number">${formatPakistaniCurrency(sale.totalAmount - sale.paidAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      default:
        return '<p>Report content not available</p>';
    }
  };

  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">
          {language === 'ur' ? 'رپورٹس' : 'Reports'}
        </h1>
      </div>

      {!selectedReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-${report.color}-500`}
              onClick={() => {
                if (report.requiresContact) {
                  setSelectedReport(report);
                } else {
                  generateReport(report);
                }
              }}
            >
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">{report.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">{report.description}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full bg-${report.color}-100 text-${report.color}-800`}>
                  {report.requiresDateRange ? (language === 'ur' ? 'تاریخ درکار' : 'Date Range') : (language === 'ur' ? 'فوری' : 'Instant')}
                </span>
                <FaEye className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setReportData(null);
                  }}
                  className="mr-4 text-gray-600 hover:text-gray-800"
                >
                  ← {language === 'ur' ? 'واپس' : 'Back'}
                </button>
                <h2 className="text-xl font-bold text-gray-800">{selectedReport.title}</h2>
              </div>
              {reportData && (
                <div className="flex gap-2">
                  <button
                    onClick={printReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FaPrint /> {language === 'ur' ? 'پرنٹ' : 'Print'}
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FaDownload /> {language === 'ur' ? 'ڈاؤن لوڈ' : 'Download'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Report Filters */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedReport.requiresDateRange && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ur' ? 'شروع کی تاریخ' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ur' ? 'اختتام کی تاریخ' : 'End Date'}
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}
              {selectedReport.requiresContact && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ur' ? 'کسٹمر' : 'Customer'}
                  </label>
                  <select
                    value={selectedContact?.id || ''}
                    onChange={(e) => {
                      const contact = contacts?.find(c => c.id === e.target.value);
                      setSelectedContact(contact);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{language === 'ur' ? 'کسٹمر منتخب کریں' : 'Select Customer'}</option>
                    {contacts?.map(contact => (
                      <option key={contact.id} value={contact.id}>{contact.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={() => generateReport(selectedReport)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isGenerating ? <LoadingSpinner size="w-4 h-4" /> : <FaFilter />}
                {isGenerating ? (language === 'ur' ? 'تیار کر رہے ہیں...' : 'Generating...') : (language === 'ur' ? 'رپورٹ تیار کریں' : 'Generate Report')}
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-6">
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="w-8 h-8" />
                <span className="ml-3 text-gray-600">
                  {language === 'ur' ? 'رپورٹ تیار کی جا رہی ہے...' : 'Generating report...'}
                </span>
              </div>
            ) : reportData ? (
              <div className="report-content">
                {/* Report content will be rendered here based on report type */}
                <div dangerouslySetInnerHTML={{ __html: generateReportContent(selectedReport.id.includes('-ur')) }} />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {language === 'ur' ? 'رپورٹ تیار کرنے کے لیے اوپر کے فلٹرز استعمال کریں' : 'Use the filters above to generate the report'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;