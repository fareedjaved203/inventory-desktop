import { validateRequest, authenticateToken } from './middleware.js';
import { safeQuery } from './db-utils.js';
import { getAuditChangesForPeriod } from './audit-utils.js';
import { createDateWithCurrentTime } from './timezone-helper.js';

export function setupDashboardRoutes(app, prisma) {
  // Get basic dashboard data
  app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
      const [totalProducts, totalInventory, lowStock, totalSales, recentSales, pendingPayments, damagedItems, totalExpenses, totalRawMaterialExpenses, totalStockProducts] = await Promise.all([
        prisma.product.count({ where: { userId: req.userId } }),
        prisma.product.aggregate({
          where: { userId: req.userId },
          _sum: { quantity: true },
        }),
        prisma.product.findMany({ where: { userId: req.userId } }).then(products => 
          products.filter(product => 
            Number(product.quantity) <= Number(product.lowStockThreshold || 10)
          ).length
        ),
        prisma.sale.aggregate({
          where: { userId: req.userId },
          _sum: { totalAmount: true },
        }),
        prisma.sale.findMany({
          where: { userId: req.userId },
          take: 5,
          orderBy: { saleDate: 'desc' },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        }),
        prisma.bulkPurchase.findMany({
          where: { userId: req.userId },
          select: {
            totalAmount: true,
            paidAmount: true
          }
        }).then(purchases => purchases.filter(p => Number(p.totalAmount) > Number(p.paidAmount)).length),
        // Get damaged items count
        prisma.product.aggregate({
          where: { 
            userId: req.userId,
            damagedQuantity: { gt: 0 }
          },
          _sum: { damagedQuantity: true }
        }).catch(() => ({ _sum: { damagedQuantity: 0 } })),
        // Get total expenses
        prisma.expense.aggregate({
          where: { userId: req.userId },
          _sum: { amount: true }
        }),
        // Raw materials are now counted in purchases, not expenses
        Promise.resolve([{ total: 0 }]),
        // Calculate total stock value
        prisma.product.findMany({
          where: { userId: req.userId },
          select: { purchasePrice: true, perUnitPurchasePrice: true, quantity: true, unit: true, isService: true, parentProductId: true, _count: { select: { variants: true } } }
        }).catch(() => [])
      ]);

      const rawMaterialExpensesAmount = Number(totalRawMaterialExpenses[0]?.total || 0);

      // Calculate stock value — exclude parent products that have variants
      const bulkUnits = ['kg', 'ltr', 'ml', 'gram', 'dozen', 'ton', 'metre', 'ft', 'sqft', 'ohm'];
      const totalStockValue = totalStockProducts.filter(p => !p.isService && !(p._count?.variants > 0 && !p.parentProductId)).reduce((sum, p) => {
        const qty = Number(p.quantity || 0);
        if (bulkUnits.includes(p.unit?.toLowerCase())) {
          const perUnit = Number(p.perUnitPurchasePrice || p.purchasePrice || 0);
          return sum + (perUnit * qty);
        }
        return sum + (Number(p.purchasePrice || 0) * qty);
      }, 0);

      res.json({
        totalProducts,
        totalInventory: Number(totalInventory._sum.quantity || 0),
        totalStockValue: Math.round(totalStockValue),
        lowStock,
        totalSales: Number(totalSales._sum.totalAmount || 0),
        recentSales,
        pendingPayments,
        damagedItems: Number(damagedItems._sum.damagedQuantity || 0),
        totalExpenses: Number(totalExpenses._sum.amount || 0),
        rawMaterialExpenses: rawMaterialExpensesAmount
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get enhanced dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get today's date boundaries using the same timezone logic as sales creation
    // createDateWithCurrentTime() with no args = new Date() (current UTC instant)
    // For "today" we need: start of today in PKT, end of today in PKT
    const now = new Date();
    // Get today's date string in PKT (YYYY-MM-DD)
    const pktNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const todayStr = `${pktNow.getUTCFullYear()}-${String(pktNow.getUTCMonth() + 1).padStart(2, '0')}-${String(pktNow.getUTCDate()).padStart(2, '0')}`;
    // Use the same function that sales use to convert dates
    const todayLocalUTC = createDateWithCurrentTime(todayStr);
    const tomorrowStart = new Date(todayLocalUTC.getTime() + 24 * 60 * 60 * 1000);
    
    let reportStartDate, reportEndDate;
    if (startDate && endDate) {
      reportStartDate = createDateWithCurrentTime(startDate);
      reportEndDate = createDateWithCurrentTime(endDate);
      
      if (isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format provided' });
      }
      
      reportEndDate = new Date(reportEndDate.getTime() + 24 * 60 * 60 * 1000);
    } else {
      reportStartDate = todayLocalUTC;
      reportEndDate = tomorrowStart;
    }
    
    const sevenDaysAgo = new Date(todayLocalUTC.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(todayLocalUTC.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(todayLocalUTC.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Execute queries in smaller batches to avoid connection pool exhaustion
    const [salesToday, salesLast7Days, salesLast30Days, salesLast365Days,
           returnsTodayAgg, returnsLast7DaysAgg, returnsLast30DaysAgg, returnsLast365DaysAgg] = await Promise.all([
      // Sales Today
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          saleDate: {
            gte: todayLocalUTC,
            lt: tomorrowStart
          }
        }
      }),
      
      // Sales Last 7 Days
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          saleDate: {
            gte: sevenDaysAgo,
            lt: tomorrowStart
          }
        }
      }),
      
      // Sales Last 30 Days
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          saleDate: {
            gte: thirtyDaysAgo,
            lt: tomorrowStart
          }
        }
      }),
      
      // Sales Last 365 Days
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          saleDate: {
            gte: yearAgo,
            lt: tomorrowStart
          }
        }
      }),
      
      // Returns Today (non-container only, totalAmount > 0)
      prisma.saleReturn.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          totalAmount: { gt: 0 },
          returnDate: {
            gte: todayLocalUTC,
            lt: tomorrowStart
          }
        }
      }),
      
      // Returns Last 7 Days
      prisma.saleReturn.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          totalAmount: { gt: 0 },
          returnDate: {
            gte: sevenDaysAgo,
            lt: tomorrowStart
          }
        }
      }),
      
      // Returns Last 30 Days
      prisma.saleReturn.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          totalAmount: { gt: 0 },
          returnDate: {
            gte: thirtyDaysAgo,
            lt: tomorrowStart
          }
        }
      }),
      
      // Returns Last 365 Days
      prisma.saleReturn.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          totalAmount: { gt: 0 },
          returnDate: {
            gte: yearAgo,
            lt: tomorrowStart
          }
        }
      })
    ]);

    const [totalPurchaseDueAmount, totalSalesDueAmount, totalDueCredits, allLedgerEntries] = await Promise.all([
      // Total Due Amount (Bulk Purchases) - Get all and filter in JS
      prisma.bulkPurchase.findMany({
        where: { userId: req.userId },
        select: {
          totalAmount: true,
          paidAmount: true,
          contactId: true
        }
      }),
      
      // Total Due Amount (Sales) - Get all with returns and filter in JS
      prisma.sale.findMany({
        where: { userId: req.userId },
        include: {
          returns: true
        }
      }),
      
      // Total Due Credits (Sales with credit balance)
      prisma.sale.findMany({
        where: { userId: req.userId },
        include: {
          returns: true
        }
      }).catch(() => []),
      
      // All ledger entries to offset dues
      prisma.loanTransaction.findMany({
        where: { userId: req.userId },
        select: { amount: true, type: true, contactId: true }
      })
    ]);

    // Calculate net ledger credits per contact (money received from contacts via ledger)
    // These offset Sales Due
    const ledgerCreditsByContact = {};
    // Calculate net ledger debits per contact (money paid to contacts via ledger)
    // These offset Purchase Due
    const ledgerDebitsByContact = {};
    for (const entry of allLedgerEntries) {
      const amt = Number(entry.amount);
      if (entry.type === 'TAKEN' || entry.type === 'RETURNED_BY_CONTACT') {
        ledgerCreditsByContact[entry.contactId] = (ledgerCreditsByContact[entry.contactId] || 0) + amt;
      } else if (entry.type === 'GIVEN' || entry.type === 'RETURNED_TO_CONTACT') {
        ledgerDebitsByContact[entry.contactId] = (ledgerDebitsByContact[entry.contactId] || 0) + amt;
      }
    }
    
    // Total ledger credits (across all contacts) to offset total sales due
    const totalLedgerCredits = Object.values(ledgerCreditsByContact).reduce((s, v) => s + v, 0);
    // Total ledger debits (across all contacts) to offset total purchase due
    const totalLedgerDebits = Object.values(ledgerDebitsByContact).reduce((s, v) => s + v, 0);

    // Profit calculations are now done inline with the new calculateProfit function

    const [expensesToday, expensesLast7Days, expensesLast30Days, expensesLast365Days] = await Promise.all([
      // Expenses Today - Fixed to use 'date' field instead of 'createdAt'
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.userId,
          date: {
            gte: todayLocalUTC,
            lt: tomorrowStart
          }
        }
      }),
      
      // Expenses Last 7 Days
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.userId,
          date: {
            gte: sevenDaysAgo,
            lt: tomorrowStart
          }
        }
      }),
      
      // Expenses Last 30 Days
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.userId,
          date: {
            gte: thirtyDaysAgo,
            lt: tomorrowStart
          }
        }
      }),
      
      // Expenses Last 365 Days
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.userId,
          date: {
            gte: yearAgo,
            lt: tomorrowStart
          }
        }
      })
    ]);

    const [rawMaterialExpensesToday, rawMaterialExpensesLast7Days, rawMaterialExpensesLast30Days, rawMaterialExpensesLast365Days] = await Promise.all([
      // Raw Material Expenses Today (from bulk purchases)
      prisma.bulkPurchase.findMany({
        where: {
          userId: req.userId,
          purchaseDate: {
            gte: todayLocalUTC,
            lt: tomorrowStart
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { isRawMaterial: true }
              }
            }
          }
        }
      }),
      
      // Raw Material Expenses Last 7 Days
      prisma.bulkPurchase.findMany({
        where: {
          userId: req.userId,
          purchaseDate: {
            gte: sevenDaysAgo,
            lt: tomorrowStart
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { isRawMaterial: true }
              }
            }
          }
        }
      }),
      
      // Raw Material Expenses Last 30 Days
      prisma.bulkPurchase.findMany({
        where: {
          userId: req.userId,
          purchaseDate: {
            gte: thirtyDaysAgo,
            lt: tomorrowStart
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { isRawMaterial: true }
              }
            }
          }
        }
      }),
      
      // Raw Material Expenses Last 365 Days
      prisma.bulkPurchase.findMany({
        where: {
          userId: req.userId,
          purchaseDate: {
            gte: yearAgo,
            lt: tomorrowStart
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { isRawMaterial: true }
              }
            }
          }
        }
      })
    ]);

    // Calculate gross profit based on actual sale items (retail price - purchase cost per item)
    // Also subtracts profit lost from returned items
    const calculateProfit = async (startDate, endDate) => {
      const sales = await prisma.sale.findMany({
        where: {
          userId: req.userId,
          saleDate: { gte: startDate, lt: endDate }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          returns: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });
      
      let totalProfit = 0;
      
      for (const sale of sales) {
        let saleProfit = 0;
        
        for (const item of sale.items) {
          const quantity = Number(item.quantity);
          const salePrice = Number(item.price);
          const product = item.product;
          
          // Determine purchase cost per unit
          let purchaseCostPerUnit = 0;
          
          // For bulk/weighted items, use perUnitPurchasePrice
          const bulkUnits = ['kg', 'ltr', 'ml', 'gram', 'dozen', 'ton', 'metre', 'ft', 'sqft', 'ohm'];
          if (bulkUnits.includes(product?.unit?.toLowerCase())) {
            purchaseCostPerUnit = Number(product.perUnitPurchasePrice || product.purchasePrice || item.purchasePrice || 0);
          } else {
            purchaseCostPerUnit = Number(product?.purchasePrice || item.purchasePrice || 0);
          }
          
          const itemProfit = (salePrice - purchaseCostPerUnit) * quantity;
          saleProfit += itemProfit;
        }
        
        // Subtract the sale-level discount from profit
        const saleDiscount = Number(sale.discount || 0);
        saleProfit -= saleDiscount;
        
        totalProfit += saleProfit;
        
        // Subtract profit lost from non-container returns
        for (const ret of (sale.returns || [])) {
          if (Number(ret.totalAmount) === 0) continue; // Skip container returns
          for (const retItem of ret.items) {
            const retQty = Number(retItem.quantity);
            // Find the matching sale item to get the purchase cost
            const matchingSaleItem = sale.items.find(si => si.productId === retItem.productId);
            if (matchingSaleItem) {
              const salePrice = Number(retItem.price || matchingSaleItem.price);
              const product = matchingSaleItem.product;
              let purchaseCostPerUnit = 0;
              const bulkUnits = ['kg', 'ltr', 'ml', 'gram', 'dozen', 'ton', 'metre', 'ft', 'sqft', 'ohm'];
              if (bulkUnits.includes(product.unit?.toLowerCase())) {
                purchaseCostPerUnit = Number(product.perUnitPurchasePrice || product.purchasePrice || matchingSaleItem.purchasePrice || 0);
              } else {
                purchaseCostPerUnit = Number(product.purchasePrice || matchingSaleItem.purchasePrice || 0);
              }
              const lostProfit = (salePrice - purchaseCostPerUnit) * retQty;
              totalProfit -= lostProfit;
            }
          }
        }
      }
      
      return totalProfit;
    };

    // Calculate net profit by subtracting expenses from gross profit
    const calculateNetProfit = (grossProfit, expenses, rawMaterialExpenses) => {
      return grossProfit - expenses - rawMaterialExpenses;
    };

    // Add report period data if custom dates provided
    let reportPeriodData = {};
    if (startDate && endDate) {
      // Debug logging - remove after fixing
      console.log('Report Date Range:', {
        startDate: startDate,
        endDate: endDate,
        reportStartDate: reportStartDate,
        reportEndDate: reportEndDate,
        userId: req.userId
      });
      
      const [reportSales, reportPurchases, reportExpenses, reportTransactions, reportPurchaseTransactions, reportReturns, reportRawMaterialExpenses] = await Promise.all([
        prisma.sale.aggregate({
          _sum: { totalAmount: true },
          where: {
            userId: req.userId,
            saleDate: { 
              gte: reportStartDate, 
              lt: reportEndDate 
            }
          }
        }),
        prisma.bulkPurchase.aggregate({
          _sum: { totalAmount: true },
          where: {
            userId: req.userId,
            purchaseDate: { 
              gte: reportStartDate, 
              lt: reportEndDate 
            }
          }
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: {
            userId: req.userId,
            date: { 
              gte: reportStartDate, 
              lt: reportEndDate 
            }
          }
        }),
        prisma.sale.count({
          where: {
            userId: req.userId,
            saleDate: { 
              gte: reportStartDate, 
              lt: reportEndDate 
            }
          }
        }),
        prisma.bulkPurchase.count({
          where: {
            userId: req.userId,
            purchaseDate: { 
              gte: reportStartDate, 
              lt: reportEndDate 
            }
          }
        }),
        prisma.saleReturn.aggregate({
          _sum: { totalAmount: true },
          where: {
            userId: req.userId,
            returnDate: { 
              gte: reportStartDate, 
              lt: reportEndDate 
            }
          }
        }),

        prisma.bulkPurchase.findMany({
          where: {
            userId: req.userId,
            purchaseDate: { 
              gte: reportStartDate, 
              lt: reportEndDate 
            }
          },
          include: {
            items: {
              include: {
                product: {
                  select: { isRawMaterial: true }
                }
              }
            }
          }
        })
      ]);
      
      // Debug logging - remove after fixing
      console.log('Report Query Results:', {
        reportSales: reportSales._sum.totalAmount,
        reportExpenses: reportExpenses._sum.amount,
        reportPurchases: reportPurchases._sum.totalAmount,
        reportTransactions: reportTransactions,
        reportPurchaseTransactions: reportPurchaseTransactions,
        reportReturns: reportReturns._sum.totalAmount
      });
      
      // Calculate profit for report period
      const reportProfit = await calculateProfit(reportStartDate, reportEndDate);
      
      // Calculate raw material expenses from bulk purchases
      const calculateRawMaterialExpensesForReport = (purchases) => {
        return purchases.reduce((total, purchase) => {
          const rawMaterialAmount = purchase.items
            .filter(item => item.product.isRawMaterial)
            .reduce((sum, item) => sum + (Number(item.quantity) * Number(item.purchasePrice)), 0);
          return total + rawMaterialAmount;
        }, 0);
      };
      
      const reportRawMaterialExpensesAmount = calculateRawMaterialExpensesForReport(reportRawMaterialExpenses);
      
      const totalSalesAmount = Number(reportSales._sum.totalAmount || 0);
      const totalPurchasesAmount = Number(reportPurchases._sum.totalAmount || 0);
      const totalExpensesAmount = Number(reportExpenses._sum.amount || 0);
      const totalReturnsAmount = Number(reportReturns._sum.totalAmount || 0);
      
      reportPeriodData = {
        totalRevenue: totalSalesAmount - totalReturnsAmount,
        totalExpenses: totalExpensesAmount,
        totalSales: totalSalesAmount - totalReturnsAmount,
        totalPurchases: totalPurchasesAmount,
        totalTransactions: reportTransactions,
        totalPurchaseTransactions: reportPurchaseTransactions,
        totalReturns: totalReturnsAmount,
        totalProfit: reportProfit,
        averageSaleValue: reportTransactions > 0 ? Math.round((totalSalesAmount / reportTransactions) * 100) / 100 : 0,
        averagePurchaseValue: reportPurchaseTransactions > 0 ? Math.round((totalPurchasesAmount / reportPurchaseTransactions) * 100) / 100 : 0,
        totalSuppliers: await prisma.contact.count({
          where: {
            userId: req.userId,
            contactType: 'supplier'
          }
        })
      };
    }

    // Calculate raw material expenses from bulk purchases
    const calculateRawMaterialExpenses = (purchases) => {
      return purchases.reduce((total, purchase) => {
        const rawMaterialAmount = purchase.items
          .filter(item => item.product.isRawMaterial)
          .reduce((sum, item) => sum + (Number(item.quantity) * Number(item.purchasePrice)), 0);
        return total + rawMaterialAmount;
      }, 0);
    };

    const rawMaterialExpensesTodayAmount = calculateRawMaterialExpenses(rawMaterialExpensesToday);
    const rawMaterialExpensesLast7DaysAmount = calculateRawMaterialExpenses(rawMaterialExpensesLast7Days);
    const rawMaterialExpensesLast30DaysAmount = calculateRawMaterialExpenses(rawMaterialExpensesLast30Days);
    const rawMaterialExpensesLast365DaysAmount = calculateRawMaterialExpenses(rawMaterialExpensesLast365Days);

    // Get basic inventory stats
    const [totalProducts, totalInventory, lowStock, totalSales, allProductsForStockValue] = await Promise.all([
      prisma.product.count({ where: { userId: req.userId } }),
      prisma.product.aggregate({
        where: { userId: req.userId },
        _sum: { quantity: true }
      }),
      prisma.product.findMany({ where: { userId: req.userId } }).then(products => 
        products.filter(product => 
          Number(product.quantity) <= Number(product.lowStockThreshold || 10)
        ).length
      ),
      prisma.sale.aggregate({
        where: { userId: req.userId },
        _sum: { totalAmount: true }
      }),
      prisma.product.findMany({
        where: { userId: req.userId },
        select: { purchasePrice: true, perUnitPurchasePrice: true, quantity: true, unit: true, isService: true, parentProductId: true, _count: { select: { variants: true } } }
      }).catch(() => [])
    ]);

    // Calculate total stock value — exclude parent products that have variants (their value is in children)
    const bulkUnitsStats = ['kg', 'ltr', 'ml', 'gram', 'dozen', 'ton', 'metre', 'ft', 'sqft', 'ohm'];
    const totalStockValue = allProductsForStockValue.reduce((sum, p) => {
      // Skip services
      if (p.isService) return sum;
      // Skip parent products that have variants (value counted in children)
      if (!p.parentProductId && p._count?.variants > 0) return sum;
      const qty = Number(p.quantity || 0);
      if (bulkUnitsStats.includes(p.unit?.toLowerCase())) {
        const perUnit = Number(p.perUnitPurchasePrice || p.purchasePrice || 0);
        return sum + (perUnit * qty);
      }
      return sum + (Number(p.purchasePrice || 0) * qty);
    }, 0);

    // Calculate Sales Due per contact, then subtract ledger credits
    const salesDueByContact = {};
    let salesDueWalkIn = 0;
    for (const sale of totalSalesDueAmount) {
      const originalAmount = Number(sale.totalAmount);
      const returnedAmount = (sale.returns || []).reduce((sum, ret) => sum + Number(ret.totalAmount), 0);
      const totalRefunded = (sale.returns || []).reduce((sum, ret) => sum + (ret.refundPaid ? Number(ret.refundAmount || 0) : 0), 0);
      const netAmount = Math.max(originalAmount - returnedAmount, 0);
      const balance = netAmount - Number(sale.paidAmount || 0) + totalRefunded;
      if (balance > 0) {
        if (sale.contactId) {
          salesDueByContact[sale.contactId] = (salesDueByContact[sale.contactId] || 0) + balance;
        } else {
          salesDueWalkIn += balance;
        }
      }
    }
    let totalSalesDue = salesDueWalkIn;
    for (const [contactId, due] of Object.entries(salesDueByContact)) {
      const ledgerCredit = ledgerCreditsByContact[contactId] || 0;
      totalSalesDue += Math.max(0, due - ledgerCredit);
    }

    // Calculate Purchase Due per contact, then subtract ledger debits
    let totalPurchaseDue = 0;
    const purchaseDueByContact = {};
    for (const p of totalPurchaseDueAmount) {
      const due = Number(p.totalAmount) - Number(p.paidAmount);
      if (due > 0) {
        purchaseDueByContact[p.contactId] = (purchaseDueByContact[p.contactId] || 0) + due;
      }
    }
    for (const [contactId, due] of Object.entries(purchaseDueByContact)) {
      const ledgerDebit = ledgerDebitsByContact[contactId] || 0;
      totalPurchaseDue += Math.max(0, due - ledgerDebit);
    }

    res.json({
      // Basic inventory stats
      totalProducts,
      totalInventory: Number(totalInventory._sum.quantity || 0),
      totalStockValue: Math.round(totalStockValue),
      lowStock,
      totalSales: Number(totalSales._sum.totalAmount || 0),
      // Time-based sales stats (net of returns)
      salesToday: Number(salesToday._sum.totalAmount || 0) - Number(returnsTodayAgg._sum.totalAmount || 0),
      salesLast7Days: Number(salesLast7Days._sum.totalAmount || 0) - Number(returnsLast7DaysAgg._sum.totalAmount || 0),
      salesLast30Days: Number(salesLast30Days._sum.totalAmount || 0) - Number(returnsLast30DaysAgg._sum.totalAmount || 0),
      salesLast365Days: Number(salesLast365Days._sum.totalAmount || 0) - Number(returnsLast365DaysAgg._sum.totalAmount || 0),
      ...reportPeriodData,
      totalPurchaseDueAmount: totalPurchaseDue,
      totalSalesDueAmount: totalSalesDue,
      totalDueCredits: (totalDueCredits || [])
        .map(sale => {
          const originalAmount = Number(sale.totalAmount);
          const returnedAmount = (sale.returns || []).reduce((sum, ret) => sum + Number(ret.totalAmount), 0);
          const totalRefunded = (sale.returns || []).reduce((sum, ret) => sum + (ret.refundPaid ? Number(ret.refundAmount || 0) : 0), 0);
          const netAmount = Math.max(originalAmount - returnedAmount, 0);
          const balance = netAmount - Number(sale.paidAmount || 0) + totalRefunded;
          return balance < 0 ? Math.abs(balance) : 0;
        })
        .reduce((sum, credit) => sum + credit, 0),
      profitToday: await calculateProfit(todayLocalUTC, tomorrowStart),
      profitLast7Days: await calculateProfit(sevenDaysAgo, tomorrowStart),
      profitLast30Days: await calculateProfit(thirtyDaysAgo, tomorrowStart),
      profitLast365Days: await calculateProfit(yearAgo, tomorrowStart),
      expensesToday: Number(expensesToday?._sum?.amount || 0),
      expensesLast7Days: Number(expensesLast7Days?._sum?.amount || 0),
      expensesLast30Days: Number(expensesLast30Days?._sum?.amount || 0),
      expensesLast365Days: Number(expensesLast365Days?._sum?.amount || 0)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

  // Day Book Report
  app.get('/api/dashboard/day-book', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, productId, category, orderBookerId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const reportStartDate = createDateWithCurrentTime(startDate);
      const reportEndDate = createDateWithCurrentTime(endDate);
      const reportEndDateAdjusted = new Date(reportEndDate.getTime() + 24 * 60 * 60 * 1000);
      
      // Build where conditions for product filtering
      const saleWhere = {
        userId: req.userId,
        saleDate: { gte: reportStartDate, lt: reportEndDateAdjusted }
      };
      
      // Add order booker filtering if provided
      if (orderBookerId) {
        saleWhere.orderBookerId = orderBookerId;
      }
      
      const purchaseWhere = {
        userId: req.userId,
        purchaseDate: { gte: reportStartDate, lt: reportEndDateAdjusted }
      };
      
      // Add product filtering if productId is provided
      if (productId) {
        saleWhere.items = {
          some: {
            productId: productId,
            product: {
              userId: req.userId
            }
          }
        };
        
        purchaseWhere.items = {
          some: {
            productId: productId,
            product: {
              userId: req.userId
            }
          }
        };
      }
      
      // Add category filtering if category is provided
      if (category) {
        saleWhere.items = {
          some: {
            product: {
              userId: req.userId,
              category: {
                name: category
              }
            }
          }
        };
        
        purchaseWhere.items = {
          some: {
            product: {
              userId: req.userId,
              category: {
                name: category
              }
            }
          }
        };
      }
      
      // Get all sales and purchases in the date range
      const [sales, purchases] = await Promise.all([
        prisma.sale.findMany({
          where: saleWhere,
          include: {
            items: {
              where: {
                product: {
                  userId: req.userId
                }
              },
              include: { 
                product: {
                  include: {
                    category: true
                  }
                }
              }
            },
            contact: true,
            orderBooker: true
          }
        }),
        prisma.bulkPurchase.findMany({
          where: purchaseWhere,
          include: {
            items: {
              where: {
                product: {
                  userId: req.userId
                }
              },
              include: { 
                product: {
                  include: {
                    category: true
                  }
                }
              }
            },
            contact: true
          }
        })
      ]);
      
      // Detect edited transactions
      const editedSales = sales.filter(sale => {
        const created = new Date(sale.createdAt);
        const updated = new Date(sale.updatedAt);
        return Math.abs(updated - created) > 1000;
      });
      
      const editedPurchases = purchases.filter(purchase => {
        const created = new Date(purchase.createdAt);
        const updated = new Date(purchase.updatedAt);
        return Math.abs(updated - created) > 1000;
      });
      
      const dayBookEntries = [];
      
      // Get original paid amounts for purchases that have been edited
      const purchaseAudits = await Promise.all(
        purchases.map(async (purchase) => {
          const firstAudit = await prisma.auditTrail.findFirst({
            where: {
              tableName: 'BulkPurchase',
              recordId: purchase.id,
              fieldName: 'paidAmount'
            },
            orderBy: { changedAt: 'asc' }
          });
          return { purchaseId: purchase.id, originalPaidAmount: firstAudit ? parseFloat(firstAudit.oldValue) : null };
        })
      );
      
      const purchaseAuditMap = new Map(purchaseAudits.map(audit => [audit.purchaseId, audit.originalPaidAmount]));
      
      // Process purchases
      purchases.forEach(purchase => {
        purchase.items
          .filter(item => {
            if (productId && item.productId !== productId) return false;
            if (category && item.product.category?.name !== category) return false;
            return true;
          })
          .forEach(item => {
          // For weighted items (isTotalCostItem: true), purchasePrice is already the total cost
          // For regular items, multiply quantity by unit price
          const totalPurchaseCost = item.isTotalCostItem 
            ? Number(item.purchasePrice) 
            : Number(item.quantity) * Number(item.purchasePrice);
          
          const originalPaidAmount = purchaseAuditMap.get(purchase.id);
          const displayPaidAmount = originalPaidAmount !== null ? originalPaidAmount : Number(purchase.paidAmount || 0);
          
          dayBookEntries.push({
            date: purchase.purchaseDate,
            type: 'purchase',
            barcode: item.product.sku || '-',
            productDescription: item.product.description || '',
            productName: item.product.name,
            category: item.product.category?.name || '',
            purchaseQuantity: Number(item.quantity),
            purchasePrice: Number(item.purchasePrice),
            transportCost: Number(purchase.transportCost || 0),
            carNumber: purchase.carNumber || '',
            loadingDate: purchase.loadingDate || null,
            arrivalDate: purchase.arrivalDate || null,
            supplierName: purchase.contact?.name || '',
            totalPurchaseCost: totalPurchaseCost,
            paidAmount: displayPaidAmount,
            paymentDifference: 0,
            remainingAmount: Math.max(0, Number(purchase.totalAmount || 0) - displayPaidAmount),
            customerName: '',
            saleQuantity: 0,
            saleUnitPrice: 0,
            totalSalePrice: 0,
            profitLoss: 0,
            purchaseDescription: purchase.description || ''
          });
        });
      });
      
      // Get original paid amounts for sales that have been edited
      const saleAudits = await Promise.all(
        sales.map(async (sale) => {
          const firstAudit = await prisma.auditTrail.findFirst({
            where: {
              tableName: 'Sale',
              recordId: sale.id,
              fieldName: 'paidAmount'
            },
            orderBy: { changedAt: 'asc' }
          });
          return { saleId: sale.id, originalPaidAmount: firstAudit ? parseFloat(firstAudit.oldValue) : null };
        })
      );
      
      const saleAuditMap = new Map(saleAudits.map(audit => [audit.saleId, audit.originalPaidAmount]));
      
      // Process sales
      sales.forEach(sale => {
        const saleDiscount = Number(sale.discount || 0);
        // Calculate sale subtotal for proportional discount distribution
        const saleSubtotal = sale.items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
        
        sale.items
          .filter(item => {
            if (productId && item.productId !== productId) return false;
            if (category && item.product.category?.name !== category) return false;
            return true;
          })
          .forEach(item => {
          const quantity = Number(item.quantity);
          
          // Use bulk-unit-aware purchase cost
          const bulkUnits = ['kg', 'ltr', 'ml', 'gram', 'dozen', 'ton', 'metre', 'ft', 'sqft', 'ohm'];
          let purchasePrice = 0;
          if (bulkUnits.includes(item.product.unit?.toLowerCase())) {
            purchasePrice = Number(item.product.perUnitPurchasePrice || item.product.purchasePrice || item.purchasePrice || 0);
          } else {
            purchasePrice = Number(item.product.purchasePrice || item.purchasePrice || 0);
          }
          const salePrice = Number(item.price);
          const itemTotal = salePrice * quantity;
          // Proportionally distribute sale discount to this item
          const itemDiscount = saleSubtotal > 0 ? (itemTotal / saleSubtotal) * saleDiscount : 0;
          const profit = purchasePrice > 0 ? (salePrice - purchasePrice) * quantity - itemDiscount : -itemDiscount;
          
          const originalPaidAmount = saleAuditMap.get(sale.id);
          const displayPaidAmount = originalPaidAmount !== null ? originalPaidAmount : Number(sale.paidAmount || 0);
          
          dayBookEntries.push({
            date: sale.saleDate,
            type: 'sale',
            barcode: item.product.sku || '-',
            productDescription: item.product.description || '',
            productName: item.product.name,
            category: item.product.category?.name || '',
            purchaseQuantity: 0,
            purchasePrice: purchasePrice,
            transportCost: Number(sale.transportCost || 0),
            carNumber: sale.carNumber || '',
            loadingDate: sale.loadingDate || null,
            arrivalDate: sale.arrivalDate || null,
            supplierName: '',
            totalPurchaseCost: 0,
            paidAmount: displayPaidAmount,
            paymentDifference: 0,
            remainingAmount: Math.max(0, Number(sale.totalAmount || 0) - displayPaidAmount),
            customerName: sale.contact?.name || 'Walk-in Customer',
            orderBookerName: sale.orderBooker?.name || '',
            saleQuantity: quantity,
            saleUnitPrice: salePrice,
            totalSalePrice: salePrice * quantity - itemDiscount,
            profitLoss: profit,
            saleDescription: sale.description || ''
          });
        });
      });
      
      // Get audit trail changes for the period - only for records that were updated
      const auditChanges = await getAuditChangesForPeriod(prisma, reportStartDate, reportEndDate);
      
      // Process audit trail changes - only show paid amount changes for updated records
      for (const change of auditChanges) {
        const isPaidAmountChange = change.fieldName === 'paidAmount';
        if (isPaidAmountChange) {
          // Find the original sale/purchase to get quantities
          let originalRecord = null;
          if (change.tableName === 'Sale') {
            originalRecord = sales.find(s => s.id === change.recordId);
            if (!originalRecord) {
              originalRecord = await prisma.sale.findUnique({
                where: { id: change.recordId },
                include: {
                  items: { include: { product: { include: { category: true } } } },
                  contact: true
                }
              });
            }
          } else if (change.tableName === 'BulkPurchase') {
            originalRecord = purchases.find(p => p.id === change.recordId);
            if (!originalRecord) {
              originalRecord = await prisma.bulkPurchase.findUnique({
                where: { id: change.recordId },
                include: {
                  items: { include: { product: { include: { category: true } } } },
                  contact: true
                }
              });
            }
          }
          
          // Only show if the record was actually updated (not just created)
          if (originalRecord) {
            const created = new Date(originalRecord.createdAt);
            const updated = new Date(originalRecord.updatedAt);
            const wasUpdated = Math.abs(updated - created) > 1000; // More than 1 second difference
            
            if (wasUpdated) {
              const oldValue = parseFloat(change.oldValue) || 0;
              const newValue = parseFloat(change.newValue) || 0;
              const difference = newValue - oldValue;
              
              // Get quantities and product names from original record
              const totalQuantity = originalRecord.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
              const productNames = originalRecord.items?.map(item => item.product?.name).filter(Boolean).join(', ') || 'Unknown Product';
              const barcodes = originalRecord.items?.map(item => item.product?.sku).filter(Boolean).join(', ') || '-';
              
              // Calculate profit/loss for sales
              let profitLoss = 0;
              if (change.tableName === 'Sale') {
                profitLoss = originalRecord.items?.reduce((sum, item) => {
                  const salePrice = Number(item.price || 0);
                  const purchasePrice = Number(item.purchasePrice || 0);
                  const quantity = Number(item.quantity || 0);
                  return sum + (purchasePrice > 0 ? (salePrice - purchasePrice) * quantity : 0);
                }, 0) || 0;
              }
              
              // Calculate average prices for display
              const avgPurchasePrice = originalRecord.items?.length > 0 ? 
                originalRecord.items.reduce((sum, item) => {
                  if (item.isTotalCostItem) {
                    // For weighted items, divide total cost by quantity to get per unit price
                    return sum + (Number(item.purchasePrice || 0) / Number(item.quantity || 1));
                  }
                  return sum + Number(item.purchasePrice || 0);
                }, 0) / originalRecord.items.length : 0;
              
              const avgSalePrice = originalRecord.items?.length > 0 ? 
                originalRecord.items.reduce((sum, item) => sum + Number(item.price || 0), 0) / originalRecord.items.length : 0;
              
              dayBookEntries.push({
                date: change.changedAt,
                type: change.tableName === 'BulkPurchase' ? 'purchase-edit' : 'sale-edit',
                barcode: barcodes,
                productDescription: change.description || `Payment Update: ${change.fieldName} updated`,
                productName: productNames,
                category: originalRecord.items?.[0]?.product?.category?.name || '',
                purchaseQuantity: change.tableName === 'BulkPurchase' ? totalQuantity : 0,
                purchasePrice: change.tableName === 'BulkPurchase' ? avgPurchasePrice : 0,
                transportCost: Number(originalRecord.transportCost || 0),
                carNumber: originalRecord.carNumber || '',
                loadingDate: originalRecord.loadingDate || null,
                arrivalDate: originalRecord.arrivalDate || null,
                supplierName: change.tableName === 'BulkPurchase' ? (originalRecord.contact?.name || 'Unknown Supplier') : '',
                totalPurchaseCost: change.tableName === 'BulkPurchase' ? Number(originalRecord.totalAmount || 0) : 0,
                paidAmount: newValue,
                paymentDifference: difference,
                remainingAmount: Math.max(0, Number(originalRecord.totalAmount || 0) - newValue),
                customerName: change.tableName === 'Sale' ? (originalRecord.contact?.name || 'Walk-in Customer') : '',
                saleQuantity: change.tableName === 'Sale' ? totalQuantity : 0,
                saleUnitPrice: change.tableName === 'Sale' ? avgSalePrice : 0,
                totalSalePrice: change.tableName === 'Sale' ? Number(originalRecord.totalAmount || 0) : 0,
                profitLoss,
                isEdit: true,
                editedAt: change.changedAt,
                auditChange: {
                  fieldName: change.fieldName,
                  oldValue: change.oldValue,
                  newValue: change.newValue,
                  difference: difference,
                  description: change.description
                }
              });
            }
          }
        }
      }
      

      
      // Sort by date
      dayBookEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate summary totals - exclude audit entries
      const summary = {
        totalPurchaseAmount: dayBookEntries.filter(item => !item.type.includes('edit')).reduce((sum, item) => sum + item.totalPurchaseCost, 0),
        totalSaleAmount: dayBookEntries.filter(item => !item.type.includes('edit')).reduce((sum, item) => sum + item.totalSalePrice, 0),
        totalProfit: dayBookEntries.filter(item => !item.type.includes('edit')).reduce((sum, item) => sum + item.profitLoss, 0),
        totalEntries: dayBookEntries.length
      };
      
      res.json({
        data: dayBookEntries,
        summary,
        dateRange: { startDate, endDate }
      });
    } catch (error) {
      console.error('Day book report error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}