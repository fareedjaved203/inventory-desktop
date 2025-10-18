import { validateRequest, authenticateToken } from './middleware.js';
import { safeQuery } from './db-utils.js';

export function setupDashboardRoutes(app, prisma) {
  // Get basic dashboard data
  app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
      const [totalProducts, totalInventory, lowStock, totalSales, recentSales, pendingPayments, damagedItems, totalExpenses, totalRawMaterialExpenses] = await Promise.all([
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
        Promise.resolve([{ total: 0 }])
      ]);

      const rawMaterialExpensesAmount = Number(totalRawMaterialExpenses[0]?.total || 0);

      res.json({
        totalProducts,
        totalInventory: Number(totalInventory._sum.quantity || 0),
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
    
    // Get current Pakistan time (UTC+5) more reliably
    const now = new Date();
    const pakistanOffset = 5 * 60; // Pakistan is UTC+5 (in minutes)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const pakistanTime = new Date(utc + (pakistanOffset * 60000));
    
    // Create start of day in Pakistan timezone
    const todayPakistan = new Date(
      pakistanTime.getFullYear(), 
      pakistanTime.getMonth(), 
      pakistanTime.getDate(), 
      0, 0, 0, 0
    );
    
    // Use provided dates or default periods
    let reportStartDate, reportEndDate;
    if (startDate && endDate) {
      // Parse dates and ensure they're in the correct format
      reportStartDate = new Date(startDate);
      reportEndDate = new Date(endDate);
      
      // Ensure we have valid dates
      if (isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format provided' });
      }
      
      // Set to start and end of day
      reportStartDate.setHours(0, 0, 0, 0);
      reportEndDate.setHours(23, 59, 59, 999);
    } else {
      reportStartDate = todayPakistan;
      reportEndDate = new Date(todayPakistan.getTime() + 24 * 60 * 60 * 1000 - 1);
    }
    
    const sevenDaysAgo = new Date(todayPakistan.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(todayPakistan.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(todayPakistan.getTime() - 365 * 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(todayPakistan.getTime() + 24 * 60 * 60 * 1000);

    // Execute queries in smaller batches to avoid connection pool exhaustion
    const [salesToday, salesLast7Days, salesLast30Days, salesLast365Days] = await Promise.all([
      // Sales Today
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          userId: req.userId,
          saleDate: {
            gte: todayPakistan,
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
      })
    ]);

    const [totalPurchaseDueAmount, totalSalesDueAmount, totalDueCredits] = await Promise.all([
      // Total Due Amount (Bulk Purchases) - Get all and filter in JS
      prisma.bulkPurchase.findMany({
        where: { userId: req.userId },
        select: {
          totalAmount: true,
          paidAmount: true
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
      }).catch(() => [])
    ]);

    const [profitToday, profitLast7Days, profitLast30Days, profitLast365Days] = await Promise.all([
      // Profit Today
      prisma.sale.findMany({
        where: {
          userId: req.userId,
          saleDate: {
            gte: todayPakistan,
            lt: tomorrowStart
          }
        },
        include: {
          items: true
        }
      }),
      
      // Profit Last 7 Days
      prisma.sale.findMany({
        where: {
          userId: req.userId,
          saleDate: {
            gte: sevenDaysAgo,
            lt: tomorrowStart
          }
        },
        include: {
          items: true
        }
      }),
      
      // Profit Last 30 Days
      prisma.sale.findMany({
        where: {
          userId: req.userId,
          saleDate: {
            gte: thirtyDaysAgo,
            lt: tomorrowStart
          }
        },
        include: {
          items: true
        }
      }),
      
      // Profit Last 365 Days
      prisma.sale.findMany({
        where: {
          userId: req.userId,
          saleDate: {
            gte: yearAgo,
            lt: tomorrowStart
          }
        },
        include: {
          items: true
        }
      })
    ]);

    const [expensesToday, expensesLast7Days, expensesLast30Days, expensesLast365Days] = await Promise.all([
      // Expenses Today - Fixed to use 'date' field instead of 'createdAt'
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.userId,
          date: {
            gte: todayPakistan,
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
            gte: todayPakistan,
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

    // Calculate profit for each period using stored purchase prices
    const calculateProfit = (sales) => {
      if (!Array.isArray(sales)) return 0;
      return sales.reduce((totalProfit, sale) => {
        const saleProfit = sale.items.reduce((itemProfit, item) => {
          const sellPrice = Number(item.price);
          const purchasePrice = Number(item.purchasePrice || 0);
          const quantity = Number(item.quantity);
          
          // Only calculate profit if purchase price is set (> 0)
          if (purchasePrice > 0) {
            return itemProfit + ((sellPrice - purchasePrice) * quantity);
          }
          return itemProfit;
        }, 0);
        return totalProfit + saleProfit;
      }, 0);
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
      
      const [reportSales, reportPurchases, reportExpenses, reportTransactions, reportPurchaseTransactions, reportReturns, reportProfitSales, reportRawMaterialExpenses] = await Promise.all([
        prisma.sale.aggregate({
          _sum: { totalAmount: true },
          where: {
            userId: req.userId,
            saleDate: { 
              gte: reportStartDate, 
              lte: reportEndDate 
            }
          }
        }),
        prisma.bulkPurchase.aggregate({
          _sum: { totalAmount: true },
          where: {
            userId: req.userId,
            purchaseDate: { 
              gte: reportStartDate, 
              lte: reportEndDate 
            }
          }
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: {
            userId: req.userId,
            date: { 
              gte: reportStartDate, 
              lte: reportEndDate 
            }
          }
        }),
        prisma.sale.count({
          where: {
            userId: req.userId,
            saleDate: { 
              gte: reportStartDate, 
              lte: reportEndDate 
            }
          }
        }),
        prisma.bulkPurchase.count({
          where: {
            userId: req.userId,
            purchaseDate: { 
              gte: reportStartDate, 
              lte: reportEndDate 
            }
          }
        }),
        prisma.saleReturn.aggregate({
          _sum: { totalAmount: true },
          where: {
            userId: req.userId,
            returnDate: { 
              gte: reportStartDate, 
              lte: reportEndDate 
            }
          }
        }),
        prisma.sale.findMany({
          where: {
            userId: req.userId,
            saleDate: { 
              gte: reportStartDate, 
              lte: reportEndDate 
            }
          },
          include: { items: true }
        }),
        prisma.bulkPurchase.findMany({
          where: {
            userId: req.userId,
            purchaseDate: { 
              gte: reportStartDate, 
              lte: reportEndDate 
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
        reportReturns: reportReturns._sum.totalAmount,
        reportProfitSales: reportProfitSales.length
      });
      
      // Calculate profit for report period
      const reportProfit = calculateProfit(reportProfitSales);
      
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
      
      reportPeriodData = {
        totalRevenue: Number(reportSales._sum.totalAmount || 0),
        totalExpenses: Number(reportExpenses._sum.amount || 0),
        totalSales: Number(reportSales._sum.totalAmount || 0),
        totalPurchases: Number(reportPurchases._sum.totalAmount || 0),
        totalTransactions: reportTransactions,
        totalPurchaseTransactions: reportPurchaseTransactions,
        totalReturns: Number(reportReturns._sum.totalAmount || 0),
        totalProfit: reportProfit,
        averageSaleValue: reportTransactions > 0 ? Number(reportSales._sum.totalAmount || 0) / reportTransactions : 0,
        averagePurchaseValue: reportPurchaseTransactions > 0 ? Number(reportPurchases._sum.totalAmount || 0) / reportPurchaseTransactions : 0,
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
    const [totalProducts, totalInventory, lowStock, totalSales] = await Promise.all([
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
      })
    ]);

    res.json({
      // Basic inventory stats
      totalProducts,
      totalInventory: Number(totalInventory._sum.quantity || 0),
      lowStock,
      totalSales: Number(totalSales._sum.totalAmount || 0),
      // Time-based sales stats
      salesToday: Number(salesToday._sum.totalAmount || 0),
      salesLast7Days: Number(salesLast7Days._sum.totalAmount || 0),
      salesLast30Days: Number(salesLast30Days._sum.totalAmount || 0),
      salesLast365Days: Number(salesLast365Days._sum.totalAmount || 0),
      ...reportPeriodData,
      totalPurchaseDueAmount: totalPurchaseDueAmount
        .filter(p => Number(p.totalAmount) > Number(p.paidAmount))
        .reduce((sum, p) => sum + Number(p.totalAmount - p.paidAmount), 0),
      totalSalesDueAmount: totalSalesDueAmount
        .map(sale => {
          const originalAmount = Number(sale.totalAmount);
          const returnedAmount = (sale.returns || []).reduce((sum, ret) => sum + Number(ret.totalAmount), 0);
          const totalRefunded = (sale.returns || []).reduce((sum, ret) => sum + (ret.refundPaid ? Number(ret.refundAmount || 0) : 0), 0);
          const netAmount = Math.max(originalAmount - returnedAmount, 0);
          const balance = netAmount - Number(sale.paidAmount || 0) + totalRefunded;
          return balance > 0 ? balance : 0;
        })
        .reduce((sum, due) => sum + due, 0),
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
      profitToday: calculateProfit(profitToday),
      profitLast7Days: calculateProfit(profitLast7Days),
      profitLast30Days: calculateProfit(profitLast30Days),
      profitLast365Days: calculateProfit(profitLast365Days),
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
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const reportStartDate = new Date(startDate);
      const reportEndDate = new Date(endDate);
      reportStartDate.setHours(0, 0, 0, 0);
      reportEndDate.setHours(23, 59, 59, 999);
      
      // Get all sales and purchases in the date range
      const [sales, purchases] = await Promise.all([
        prisma.sale.findMany({
          where: {
            userId: req.userId,
            saleDate: { gte: reportStartDate, lte: reportEndDate }
          },
          include: {
            items: {
              include: { product: true }
            },
            contact: true
          }
        }),
        prisma.bulkPurchase.findMany({
          where: {
            userId: req.userId,
            purchaseDate: { gte: reportStartDate, lte: reportEndDate }
          },
          include: {
            items: {
              include: { product: true }
            },
            contact: true
          }
        })
      ]);
      
      const dayBookEntries = [];
      
      // Process purchases
      purchases.forEach(purchase => {
        purchase.items.forEach(item => {
          dayBookEntries.push({
            date: purchase.purchaseDate,
            type: 'purchase',
            productDescription: item.product.description || '',
            productName: item.product.name,
            purchaseQuantity: Number(item.quantity),
            purchasePrice: Number(item.purchasePrice),
            transportCost: Number(purchase.transportCost || 0),
            supplierName: purchase.contact?.name || '',
            totalPurchaseCost: Number(item.quantity) * Number(item.purchasePrice),
            customerName: '',
            saleQuantity: 0,
            saleUnitPrice: 0,
            totalSalePrice: 0,
            profitLoss: 0
          });
        });
      });
      
      // Process sales
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const purchasePrice = Number(item.purchasePrice || 0);
          const salePrice = Number(item.price);
          const quantity = Number(item.quantity);
          const profit = purchasePrice > 0 ? (salePrice - purchasePrice) * quantity : 0;
          
          dayBookEntries.push({
            date: sale.saleDate,
            type: 'sale',
            productDescription: item.product.description || '',
            productName: item.product.name,
            purchaseQuantity: 0,
            purchasePrice: purchasePrice,
            transportCost: 0,
            supplierName: '',
            totalPurchaseCost: 0,
            customerName: sale.contact?.name || 'Walk-in Customer',
            saleQuantity: quantity,
            saleUnitPrice: salePrice,
            totalSalePrice: salePrice * quantity,
            profitLoss: profit
          });
        });
      });
      
      // Sort by date
      dayBookEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate summary totals
      const summary = {
        totalPurchaseAmount: dayBookEntries.reduce((sum, item) => sum + item.totalPurchaseCost, 0),
        totalSaleAmount: dayBookEntries.reduce((sum, item) => sum + item.totalSalePrice, 0),
        totalProfit: dayBookEntries.reduce((sum, item) => sum + item.profitLoss, 0),
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