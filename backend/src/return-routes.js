import { validateRequest, authenticateToken } from './middleware.js';
import { z } from 'zod';
import { withTransaction } from './db-utils.js';
import crypto from 'crypto';

const returnItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  price: z.union([z.number(), z.string()]).transform(val => Number(val)).refine(val => val > 0, "Price must be positive"),
});

const returnSchema = z.object({
  saleId: z.string().min(1, "Sale is required"),
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
  reason: z.string().optional(),
  removeFromStock: z.boolean().optional(),
  refundAmount: z.number().min(0).optional(),
  isContainerReturn: z.boolean().optional(),
}).refine(data => data.items.some(item => item.quantity > 0), {
  message: "At least one item must have a positive quantity",
  path: ["items"]
});

export function setupReturnRoutes(app, prisma) {
  // Create a return
  app.post('/api/returns', authenticateToken, validateRequest({ body: returnSchema }), async (req, res) => {
    try {
      const returnData = await withTransaction(prisma, async (prisma) => {
        // Generate return number
        const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
        
        // Calculate total amount (0 for container returns, actual amount for regular returns)
        const totalAmount = req.body.isContainerReturn ? 0 : req.body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Filter out items with zero quantity
        const validItems = req.body.items.filter(item => item.quantity > 0);
        
        // Create return using raw SQL
        const returnId = crypto.randomUUID();
        const refundAmount = req.body.isContainerReturn ? 0 : totalAmount;
        const returnReason = req.body.isContainerReturn ? 'Empty container return' : (req.body.reason || null);
        
        await prisma.$executeRaw`
          INSERT INTO "SaleReturn" (id, "returnNumber", "totalAmount", reason, "refundAmount", "saleId", "userId", "createdAt", "updatedAt")
          VALUES (${returnId}, ${returnNumber}, ${totalAmount}::decimal, ${returnReason}, ${refundAmount}::decimal, ${req.body.saleId}, ${req.userId}, NOW(), NOW())
        `;
        
        // Create return items using raw SQL
        for (const item of validItems) {
          const itemId = crypto.randomUUID();
          const itemPrice = req.body.isContainerReturn ? 0 : item.price;
          await prisma.$executeRaw`
            INSERT INTO "SaleReturnItem" (id, quantity, price, "saleReturnId", "productId", "createdAt", "updatedAt")
            VALUES (${itemId}, ${item.quantity}::decimal, ${itemPrice}::decimal, ${returnId}, ${item.productId}, NOW(), NOW())
          `;
        }
        
        // Get the created return with relations
        const saleReturn = await prisma.saleReturn.findUnique({
          where: { id: returnId },
          include: {
            items: {
              include: {
                product: true
              }
            },
            sale: true
          }
        });

        // Update product quantities based on return type
        for (const item of validItems) {
          if (req.body.isContainerReturn) {
            // For container returns, always add back to stock (empty containers returned)
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  increment: item.quantity
                }
              }
            });
          } else if (req.body.removeFromStock) {
            // Remove from stock (decrement) - ensure quantity doesn't go below 0
            const product = await prisma.product.findUnique({
              where: { id: item.productId }
            });
            
            if (product && product.quantity >= item.quantity) {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: {
                    decrement: item.quantity
                  }
                }
              });
            } else {
              // Set to 0 if would go negative
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: 0
                }
              });
            }
          } else {
            // Add back to stock (increment)
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  increment: item.quantity
                }
              }
            });
          }
        }

        // Note: We don't modify the original sale total amount
        // The original sale amount remains unchanged for record keeping

        return saleReturn;
      });

      res.status(201).json(returnData);
    } catch (error) {
      console.error('Return creation error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get all returns
  app.get('/api/returns', authenticateToken, async (req, res) => {
    try {
      const { search = '', page = 1, limit = 10 } = req.query;
      
      const where = {
        userId: req.userId,
        ...(search ? {
          OR: [
            { returnNumber: { contains: search } },
            { sale: { billNumber: { contains: search } } }
          ]
        } : {})
      };
      
      const [total, returns] = await Promise.all([
        prisma.saleReturn.count({ where }),
        prisma.saleReturn.findMany({
          where,
          skip: (page - 1) * limit,
          take: parseInt(limit),
          include: {
            items: {
              include: {
                product: true
              }
            },
            sale: true
          },
          orderBy: { returnDate: 'desc' }
        })
      ]);

      res.json({ 
        items: returns,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark refund as paid
  app.post('/api/returns/:returnId/pay-credit', authenticateToken, async (req, res) => {
    try {
      const { returnId } = req.params;
      const { amount } = req.body;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(returnId)) {
        return res.status(400).json({ error: 'Invalid return ID format' });
      }
      
      // Update using raw SQL to avoid binary data format issues
      await prisma.$executeRaw`
        UPDATE "SaleReturn" 
        SET "refundPaid" = true, 
            "refundAmount" = ${amount ? Number(amount) : 0}::decimal, 
            "refundDate" = NOW(),
            "updatedAt" = NOW()
        WHERE id = ${returnId} AND "userId" = ${req.userId}
      `;
      
      // Get the updated return
      const updatedReturn = await prisma.saleReturn.findUnique({
        where: { id: returnId }
      });
      
      if (!updatedReturn) {
        return res.status(404).json({ error: 'Return not found' });
      }
      
      res.json(updatedReturn);
    } catch (error) {
      console.error('Error marking refund as paid:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Pay direct credit refund
  app.post('/api/sales/:saleId/pay-credit', authenticateToken, async (req, res) => {
    try {
      const { saleId } = req.params;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid refund amount is required' });
      }
      
      // Mark all unpaid returns for this sale as paid
      await prisma.$executeRaw`
        UPDATE "SaleReturn" 
        SET "refundPaid" = true, 
            "refundDate" = NOW(),
            "updatedAt" = NOW()
        WHERE "saleId" = ${saleId} 
          AND "userId" = ${req.userId} 
          AND "refundPaid" = false 
          AND "refundAmount" > 0
      `;
      
      res.json({ success: true, message: 'All returns marked as paid' });
    } catch (error) {
      console.error('Error processing credit refund:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get returns for a specific sale
  app.get('/api/sales/:saleId/returns', authenticateToken, async (req, res) => {
    try {
      const returns = await prisma.saleReturn.findMany({
        where: { 
          saleId: req.params.saleId,
          userId: req.userId
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { returnDate: 'desc' }
      });

      res.json({ items: returns });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


}