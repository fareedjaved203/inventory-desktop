// Utility functions for audit trail
export async function logAuditChange(prisma, tableName, recordId, fieldName, oldValue, newValue) {
  if (oldValue === newValue) return; // No change
  
  try {
    const data = {
      tableName,
      recordId,
      fieldName,
      oldValue: oldValue?.toString() || null,
      newValue: newValue?.toString() || null
    };
    
    // Set proper foreign key based on table
    if (tableName === 'Sale') {
      data.saleId = recordId;
    } else if (tableName === 'BulkPurchase') {
      data.purchaseId = recordId;
    }
    
    await prisma.auditTrail.create({ data });
  } catch (error) {
    console.warn('Failed to log audit change:', error.message);
  }
}

export async function getAuditTrail(prisma, tableName, recordId) {
  try {
    return await prisma.auditTrail.findMany({
      where: {
        tableName,
        recordId
      },
      orderBy: {
        changedAt: 'desc'
      }
    });
  } catch (error) {
    console.warn('Failed to get audit trail:', error.message);
    return [];
  }
}

export async function getAuditChangesForPeriod(prisma, startDate, endDate) {
  try {
    return await prisma.auditTrail.findMany({
      where: {
        changedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: {
        changedAt: 'desc'
      }
    });
  } catch (error) {
    console.warn('Failed to get audit changes:', error.message);
    return [];
  }
}