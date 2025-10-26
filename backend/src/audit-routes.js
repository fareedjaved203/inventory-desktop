import { authenticateToken } from './middleware.js';
import { getAuditTrail, getAuditChangesForPeriod } from './audit-utils.js';

export function setupAuditRoutes(app, prisma) {
  console.log('Setting up audit routes...');
  
  // Get audit trail for a specific record
  app.get('/api/audit-trail/:tableName/:recordId', authenticateToken, async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const auditTrail = await getAuditTrail(prisma, tableName, recordId);
      res.json(auditTrail);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get audit changes for a contact (sales and purchases)
  console.log('Registering contact audit route: /api/audit/contact/:contactId');
  app.get('/api/audit/contact/:contactId', authenticateToken, async (req, res) => {
    try {
      console.log("at correct place")
      const { contactId } = req.params;
      console.log('Fetching audit trail for contact:', contactId, 'user:', req.userId);
      
      // Get sales and purchases for this contact
      const [sales, purchases] = await Promise.all([
        prisma.sale.findMany({
          where: { contactId, userId: req.userId },
          select: { id: true }
        }),
        prisma.bulkPurchase.findMany({
          where: { contactId, userId: req.userId },
          select: { id: true }
        })
      ]);
      
      console.log('Found sales:', sales.length, 'purchases:', purchases.length);
      
      const saleIds = sales.map(s => s.id);
      const purchaseIds = purchases.map(p => p.id);
      
      // Get audit changes for these records
      let auditChanges = [];
      if (saleIds.length > 0 || purchaseIds.length > 0) {
        const whereConditions = [];
        if (saleIds.length > 0) {
          whereConditions.push({
            tableName: 'Sale',
            recordId: { in: saleIds }
          });
        }
        if (purchaseIds.length > 0) {
          whereConditions.push({
            tableName: 'BulkPurchase',
            recordId: { in: purchaseIds }
          });
        }
        
        auditChanges = await prisma.auditTrail.findMany({
          where: {
            OR: whereConditions
          },
          orderBy: {
            changedAt: 'desc'
          }
        });
        
        console.log('Found audit changes:', auditChanges.length);
      }
      
      res.json(auditChanges);
    } catch (error) {
      console.error('Error fetching contact audit trail:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get audit changes for a date range
  app.get('/api/audit-trail/period', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const auditChanges = await getAuditChangesForPeriod(prisma, startDate, endDate);
      res.json(auditChanges);
    } catch (error) {
      console.error('Error fetching audit changes for period:', error);
      res.status(500).json({ error: error.message });
    }
  });
}