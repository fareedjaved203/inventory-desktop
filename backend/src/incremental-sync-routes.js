import { authenticateToken } from './middleware.js';

export function setupIncrementalSyncRoutes(app, prisma) {
  // Incremental upload - only sync changes
  app.post('/api/sync/incremental-upload', authenticateToken, async (req, res) => {
    try {
      const { data, lastSyncTimestamp } = req.body;
      const userId = req.userId;

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      const results = {
        created: 0,
        updated: 0,
        conflicts: []
      };

      for (const [storeName, items] of Object.entries(data)) {
        if (!items || !Array.isArray(items)) continue;

        const modelName = getModelName(storeName);
        if (!modelName || !prisma[modelName]) continue;

        for (const item of items) {
          try {
            const itemData = {
              ...item,
              userId,
              updatedAt: new Date()
            };

            // Check if record exists
            const existing = await prisma[modelName].findUnique({
              where: { id: item.id }
            });

            if (!existing) {
              // Create new record
              await prisma[modelName].create({ data: itemData });
              results.created++;
            } else {
              // Check for conflicts (server updated after last sync)
              const serverUpdated = new Date(existing.updatedAt);
              const lastSync = new Date(lastSyncTimestamp);
              
              if (serverUpdated > lastSync) {
                results.conflicts.push({
                  id: item.id,
                  type: storeName,
                  serverData: existing,
                  clientData: item
                });
              } else {
                // Safe to update
                await prisma[modelName].update({
                  where: { id: item.id },
                  data: itemData
                });
                results.updated++;
              }
            }
          } catch (error) {
            console.error(`Failed to sync ${modelName}:`, error);
          }
        }
      }

      res.json({ 
        success: true, 
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Incremental upload error:', error);
      res.status(500).json({ error: 'Failed to upload changes' });
    }
  });

  // Get changes since last sync
  app.get('/api/sync/changes/:userId/:timestamp', authenticateToken, async (req, res) => {
    try {
      const { userId, timestamp } = req.params;
      
      if (userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const since = new Date(timestamp);
      const changes = {};

      const models = [
        'product', 'contact', 'sale', 'saleItem', 'bulkPurchase', 
        'bulkPurchaseItem', 'expense', 'saleReturn', 'saleReturnItem'
      ];

      for (const modelName of models) {
        if (!prisma[modelName]) continue;

        const items = await prisma[modelName].findMany({
          where: {
            userId,
            updatedAt: { gt: since }
          }
        });

        if (items.length > 0) {
          changes[getStoreName(modelName)] = items.map(item => ({
            ...item,
            id: item.id.toString()
          }));
        }
      }

      res.json({ 
        success: true, 
        changes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Changes fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch changes' });
    }
  });
}

function getModelName(storeName) {
  const mapping = {
    'products': 'product',
    'contacts': 'contact',
    'sales': 'sale',
    'saleItems': 'saleItem',
    'bulkPurchases': 'bulkPurchase',
    'bulkPurchaseItems': 'bulkPurchaseItem',
    'expenses': 'expense',
    'saleReturns': 'saleReturn',
    'saleReturnItems': 'saleReturnItem'
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
    'expense': 'expenses',
    'saleReturn': 'saleReturns',
    'saleReturnItem': 'saleReturnItems'
  };
  return mapping[modelName] || modelName;
}