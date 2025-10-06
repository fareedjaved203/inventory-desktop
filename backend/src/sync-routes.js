import { authenticateToken } from './middleware.js';

export function setupSyncRoutes(app, prisma) {
  // Upload offline data to server
  app.post('/api/sync/upload', authenticateToken, async (req, res) => {
    try {
      const { data, timestamp } = req.body;
      const userId = req.userId;

      // Clear existing data for user
      await clearUserData(prisma, userId);

      // Insert uploaded data
      for (const [storeName, items] of Object.entries(data)) {
        if (!items || !Array.isArray(items)) continue;

        const modelName = getModelName(storeName);
        if (!modelName || !prisma[modelName]) continue;

        for (const item of items) {
          try {
            await prisma[modelName].create({
              data: {
                ...item,
                userId,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt)
              }
            });
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

      // Fetch all user data
      const models = [
        'product', 'contact', 'sale', 'saleItem', 'bulkPurchase', 
        'bulkPurchaseItem', 'branch', 'employee', 'expense', 
        'saleReturn', 'saleReturnItem', 'loanTransaction', 'shopSettings'
      ];

      for (const modelName of models) {
        if (!prisma[modelName]) continue;

        try {
          const items = await prisma[modelName].findMany({
            where: { userId }
          });
          
          data[getStoreName(modelName)] = items.map(item => ({
            ...item,
            id: item.id.toString(),
            price: item.price ? Number(item.price) : item.price,
            retailPrice: item.retailPrice ? Number(item.retailPrice) : item.retailPrice,
            wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : item.wholesalePrice,
            purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : item.purchasePrice,
            quantity: item.quantity ? Number(item.quantity) : item.quantity,
            amount: item.amount ? Number(item.amount) : item.amount,
            total: item.total ? Number(item.total) : item.total
          }));
        } catch (error) {
          console.error(`Failed to fetch ${modelName}:`, error);
          data[getStoreName(modelName)] = [];
        }
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
    // Delete in correct order to handle foreign key constraints
    await prisma.saleItem.deleteMany({ where: { sale: { userId } } });
    await prisma.sale.deleteMany({ where: { userId } });
    await prisma.bulkPurchaseItem.deleteMany({ where: { bulkPurchase: { userId } } });
    await prisma.bulkPurchase.deleteMany({ where: { userId } });
    await prisma.saleReturnItem.deleteMany({ where: { saleReturn: { userId } } });
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