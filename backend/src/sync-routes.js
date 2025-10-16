import { authenticateToken } from './middleware.js';

export function setupSyncRoutes(app, prisma) {
  // Upload offline data to server
  app.post('/api/sync/upload', authenticateToken, async (req, res) => {
    try {
      const { data, timestamp } = req.body;
      const userId = req.userId;

      // Validate data before proceeding
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // Clear existing data for user
      await clearUserData(prisma, userId);

      // Insert uploaded data as-is without processing
      for (const [storeName, items] of Object.entries(data)) {
        if (!items || !Array.isArray(items)) continue;

        const modelName = getModelName(storeName);
        if (!modelName || !prisma[modelName]) continue;

        for (const item of items) {
          try {
            // Use the data exactly as provided from IndexedDB
            const itemData = {
              ...item,
              userId, // Ensure userId is set
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
            };
            
            // Remove any undefined values that might cause issues
            Object.keys(itemData).forEach(key => {
              if (itemData[key] === undefined) {
                delete itemData[key];
              }
            });
            
            await prisma[modelName].create({ data: itemData });
          } catch (error) {
            console.error(`Failed to create ${modelName}:`, error);
          }
        }
      }

      res.json({ success: true, message: 'Data uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload data' });
    }
  });

  // Download user data from server
  app.get('/api/sync/download/:userId', authenticateToken, async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const data = {};

      // Fetch all user data (only parent models with userId)
      const models = [
        'product', 'contact', 'sale', 'bulkPurchase', 
        'branch', 'employee', 'expense', 
        'saleReturn', 'loanTransaction', 'shopSettings'
      ];

      for (const modelName of models) {
        if (!prisma[modelName]) continue;

        try {
          let queryOptions = { where: { userId } };
          
          // Add includes for models that need related data
          if (modelName === 'sale') {
            queryOptions.include = { 
              items: {
                include: {
                  product: { select: { id: true, name: true, sku: true } }
                }
              },
              contact: { select: { id: true, name: true } },
              employee: { select: { id: true, firstName: true, lastName: true } },
              returns: {
                include: {
                  items: {
                    include: {
                      product: { select: { id: true, name: true, sku: true } }
                    }
                  }
                }
              }
            };
          } else if (modelName === 'bulkPurchase') {
            queryOptions.include = { 
              items: {
                include: {
                  product: { select: { id: true, name: true, sku: true } }
                }
              },
              contact: { select: { id: true, name: true } }
            };
          } else if (modelName === 'saleReturn') {
            queryOptions.include = { 
              items: {
                include: {
                  product: { select: { id: true, name: true, sku: true } }
                }
              },
              sale: { select: { billNumber: true } }
            };
          } else if (modelName === 'employee') {
            queryOptions.include = {
              branch: { select: { id: true, name: true, code: true } }
            };
          } else if (modelName === 'expense') {
            queryOptions.include = {
              contact: { select: { id: true, name: true } },
              product: { select: { id: true, name: true } }
            };
          } else if (modelName === 'loanTransaction') {
            queryOptions.include = {
              contact: { select: { id: true, name: true } }
            };
          }
          
          const items = await prisma[modelName].findMany(queryOptions);
          
          // Debug logging for sales
          if (modelName === 'sale') {
            console.log(`Found ${items.length} sales for user ${userId}`);
            items.forEach((sale, index) => {
              console.log(`Sale ${index + 1}: ID=${sale.id}, Items=${sale.items?.length || 0}`);
              if (sale.items && sale.items.length > 0) {
                sale.items.forEach((item, itemIndex) => {
                  console.log(`  Item ${itemIndex + 1}: Product=${item.product?.name || 'Unknown'}, Qty=${item.quantity}`);
                });
              }
            });
          }
          
          data[getStoreName(modelName)] = items.map(item => {
            const processedItem = {
              ...item,
              id: item.id.toString(),
              price: item.price ? Number(item.price) : item.price,
              retailPrice: item.retailPrice ? Number(item.retailPrice) : item.retailPrice,
              wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : item.wholesalePrice,
              purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : item.purchasePrice,
              quantity: item.quantity ? Number(item.quantity) : item.quantity,
              amount: item.amount ? Number(item.amount) : item.amount,
              total: item.total ? Number(item.total) : item.total,
              totalAmount: item.totalAmount ? Number(item.totalAmount) : item.totalAmount,
              paidAmount: item.paidAmount ? Number(item.paidAmount) : item.paidAmount
            };
            
            // Preserve nested items array for sales, bulk purchases, and returns
            if (item.items && Array.isArray(item.items)) {
              processedItem.items = item.items.map(subItem => ({
                ...subItem,
                id: subItem.id?.toString(),
                productId: subItem.productId?.toString(),
                quantity: subItem.quantity ? Number(subItem.quantity) : subItem.quantity,
                price: subItem.price ? Number(subItem.price) : subItem.price,
                purchasePrice: subItem.purchasePrice ? Number(subItem.purchasePrice) : subItem.purchasePrice
              }));
            }
            
            return processedItem;
          });
          
          // Debug logging for processed sales data
          if (modelName === 'sale') {
            console.log('=== PROCESSED SALES DATA ===');
            data[getStoreName(modelName)].forEach((sale, index) => {
              console.log(`Processed Sale ${index + 1}: ID=${sale.id}, Items=${sale.items?.length || 0}`);
              if (sale.items && sale.items.length > 0) {
                console.log(`  Items array exists with ${sale.items.length} items`);
                sale.items.forEach((item, itemIndex) => {
                  console.log(`    Item ${itemIndex + 1}: ID=${item.id}, ProductID=${item.productId}, Product=${item.product?.name || 'No product'}`);
                });
              } else {
                console.log('  NO ITEMS FOUND IN PROCESSED SALE');
              }
            });
          }
        } catch (error) {
          console.error(`Failed to fetch ${modelName}:`, error);
          data[getStoreName(modelName)] = [];
        }
      }

      console.log('=== FINAL RESPONSE DATA ===');
      console.log('Sales count:', data.sales?.length || 0);
      if (data.sales && data.sales.length > 0) {
        console.log('First sale items:', data.sales[0].items?.length || 0);
        console.log('First sale full data:', JSON.stringify(data.sales[0], null, 2));
      }

      res.json({ 
        success: true, 
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download data' });
    }
  });
}

async function clearUserData(prisma, userId) {
  try {
    // Get all sales for this user first
    const userSales = await prisma.sale.findMany({
      where: { userId },
      select: { id: true }
    });
    const saleIds = userSales.map(sale => sale.id);
    
    // Get all bulk purchases for this user
    const userBulkPurchases = await prisma.bulkPurchase.findMany({
      where: { userId },
      select: { id: true }
    });
    const bulkPurchaseIds = userBulkPurchases.map(bp => bp.id);
    
    // Get all sale returns for this user
    const userSaleReturns = await prisma.saleReturn.findMany({
      where: { userId },
      select: { id: true }
    });
    const saleReturnIds = userSaleReturns.map(sr => sr.id);
    
    // Delete in correct order to handle foreign key constraints
    if (saleIds.length > 0) {
      await prisma.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
    }
    if (bulkPurchaseIds.length > 0) {
      await prisma.bulkPurchaseItem.deleteMany({ where: { bulkPurchaseId: { in: bulkPurchaseIds } } });
    }
    if (saleReturnIds.length > 0) {
      await prisma.saleReturnItem.deleteMany({ where: { saleReturnId: { in: saleReturnIds } } });
    }
    
    await prisma.sale.deleteMany({ where: { userId } });
    await prisma.bulkPurchase.deleteMany({ where: { userId } });
    await prisma.saleReturn.deleteMany({ where: { userId } });
    await prisma.loanTransaction.deleteMany({ where: { userId } });
    await prisma.expense.deleteMany({ where: { userId } });
    await prisma.employee.deleteMany({ where: { userId } });
    await prisma.branch.deleteMany({ where: { userId } });
    await prisma.contact.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { userId } });
    await prisma.shopSettings.deleteMany({ where: { userId } });
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
}

function getModelName(storeName) {
  const mapping = {
    'products': 'product',
    'contacts': 'contact',
    'sales': 'sale',
    'saleItems': 'saleItem',
    'bulkPurchases': 'bulkPurchase',
    'bulkPurchaseItems': 'bulkPurchaseItem',
    'branches': 'branch',
    'employees': 'employee',
    'expenses': 'expense',
    'saleReturns': 'saleReturn',
    'saleReturnItems': 'saleReturnItem',
    'loanTransactions': 'loanTransaction',
    'shopSettings': 'shopSettings'
  };
  return mapping[storeName];
}

function getStoreName(modelName) {
  const mapping = {
    'product': 'products',
    'contact': 'contacts',
    'sale': 'sales',
    'saleItem': 'saleItems',
    'bulkPurchase': 'bulkPurchases',
    'bulkPurchaseItem': 'bulkPurchaseItems',
    'branch': 'branches',
    'employee': 'employees',
    'expense': 'expenses',
    'saleReturn': 'saleReturns',
    'saleReturnItem': 'saleReturnItems',
    'loanTransaction': 'loanTransactions',
    'shopSettings': 'shopSettings'
  };
  return mapping[modelName] || modelName;
}