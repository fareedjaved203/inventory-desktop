import { validateRequest, authenticateToken } from './middleware.js';
import { bulkPurchaseSchema, querySchema } from './schemas.js';
import { withTransaction } from './db-utils.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export function setupBulkPurchaseRoutes(app, prisma) {
  // Get bulk purchases with pending payments
  app.get('/api/bulk-purchases/pending-payments', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      // For SQLite, we need to use raw comparison
      const allPurchases = await prisma.bulkPurchase.findMany({
        where: { userId: req.userId },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true
        }
      });
      
      const pendingPurchaseIds = allPurchases
        .filter(purchase => purchase.totalAmount > purchase.paidAmount)
        .map(purchase => purchase.id);
      
      const where = {
        userId: req.userId,
        id: {
          in: pendingPurchaseIds
        }
      };
      
      // Add search filter for ID, invoice number and contact name
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { contact: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [total, items] = await Promise.all([
        prisma.bulkPurchase.count({ where }),
        prisma.bulkPurchase.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { purchaseDate: 'desc' },
          include: {
            contact: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        }),
      ]);

      res.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all bulk purchases with search and pagination
  app.get('/api/bulk-purchases', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', contactId = '' } = req.query;

      const where = { userId: req.userId };
      
      // Add search filter for ID, invoice number and contact name
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { contact: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }
      
      // Add contact filter
      if (contactId) {
        where.contactId = contactId;
      }

      const [total, items] = await Promise.all([
        prisma.bulkPurchase.count({ where }),
        prisma.bulkPurchase.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { purchaseDate: 'desc' },
          include: {
            contact: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        }),
      ]);

      res.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching bulk purchases:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single bulk purchase
  app.get('/api/bulk-purchases/:id', authenticateToken, async (req, res) => {
    try {
      const purchase = await prisma.bulkPurchase.findUnique({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
        include: {
          contact: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      if (!purchase) {
        return res.status(404).json({ error: 'Bulk purchase not found' });
      }
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a bulk purchase
  app.post(
    '/api/bulk-purchases',
    authenticateToken,
    validateRequest({ body: bulkPurchaseSchema }),
    async (req, res) => {
      try {
        console.log('=== BULK PURCHASE REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Start a transaction
        const purchase = await withTransaction(prisma, async (prisma) => {
          // Generate a unique invoice number if not provided
          let invoiceNumber = req.body.invoiceNumber;
          if (!invoiceNumber) {
            invoiceNumber = `BP-${Date.now().toString().slice(-6)}`;
          }

          // Create the bulk purchase using raw SQL
          const purchaseId = crypto.randomUUID();
          await prisma.$executeRaw`
            INSERT INTO "BulkPurchase" (id, "invoiceNumber", "totalAmount", discount, "paidAmount", "purchaseDate", "carNumber", "transportCost", "loadingDate", "arrivalDate", "contactId", "userId", "createdAt", "updatedAt")
            VALUES (${purchaseId}, ${invoiceNumber}, ${req.body.totalAmount}::decimal, ${req.body.discount || 0}::decimal, ${req.body.paidAmount}::decimal, ${req.body.purchaseDate ? new Date(req.body.purchaseDate) : new Date()}, ${req.body.carNumber || null}, ${req.body.transportCost || null}, ${req.body.loadingDate ? new Date(req.body.loadingDate) : null}, ${req.body.arrivalDate ? new Date(req.body.arrivalDate) : null}, ${req.body.contactId}, ${req.userId}, NOW(), NOW())
          `;
          
          // Create purchase items
          for (const item of req.body.items) {
            const itemId = crypto.randomUUID();
            const isTotalCostItem = item.perUnitCost ? true : false;
            
            await prisma.$executeRaw`
              INSERT INTO "BulkPurchaseItem" (id, quantity, "purchasePrice", "isTotalCostItem", "bulkPurchaseId", "productId", "createdAt", "updatedAt")
              VALUES (${itemId}, ${item.quantity}::decimal, ${item.purchasePrice}::decimal, ${isTotalCostItem}, ${purchaseId}, ${item.productId}, NOW(), NOW())
            `;
          }
          
          // Get the created purchase with relations
          const purchase = await prisma.bulkPurchase.findUnique({
            where: { id: purchaseId },
            include: {
              contact: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          });
          
          if (!purchase) {
            throw new Error('Failed to retrieve created purchase');
          }

          // Update product quantities and purchase prices
          for (const item of req.body.items) {
            console.log('Updating product:', item.productId, 'perUnitCost:', item.perUnitCost);
            
            if (item.perUnitCost) {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: { increment: item.quantity },
                  purchasePrice: item.purchasePrice,
                  perUnitPurchasePrice: item.perUnitCost
                }
              });
            } else {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: { increment: item.quantity },
                  purchasePrice: item.purchasePrice
                }
              });
            }
          }

          return purchase;
        });

        // Convert Decimal fields to numbers for JSON response
        const responseData = {
          ...purchase,
          totalAmount: Number(purchase.totalAmount),
          discount: Number(purchase.discount || 0),
          paidAmount: Number(purchase.paidAmount),
          items: purchase.items?.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            purchasePrice: Number(item.purchasePrice)
          })) || []
        };
        
        res.status(201).json(responseData);
      } catch (error) {
        console.error('Error creating bulk purchase:', error);
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Update a bulk purchase
  app.put(
    '/api/bulk-purchases/:id',
    authenticateToken,
    validateRequest({ body: bulkPurchaseSchema }),
    async (req, res) => {
      console.log(bulkPurchaseSchema)
      console.log("body is",req.body);
      try {
        const purchase = await withTransaction(prisma, async (prisma) => {
          // Get the existing purchase
          const existingPurchase = await prisma.bulkPurchase.findUnique({
            where: { 
              id: req.params.id,
              userId: req.userId
            },
            include: {
              items: true
            }
          });

          console.log(existingPurchase)

          if (!existingPurchase) {
            throw new Error('Bulk purchase not found');
          }

          // Revert quantities from old purchase items
          for (const item of existingPurchase.items) {
            console.log('Updating product:', item.productId, 'perUnitCost:', item.perUnitCost);

            await prisma.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  decrement: item.quantity
                }
              }
            });
          }

          // Delete old purchase items
          await prisma.bulkPurchaseItem.deleteMany({
            where: { bulkPurchaseId: req.params.id }
          });

          // Update the purchase using raw SQL
          await prisma.$executeRaw`
            UPDATE "BulkPurchase" 
            SET "totalAmount" = ${req.body.totalAmount}::decimal,
                discount = ${req.body.discount || 0}::decimal,
                "paidAmount" = ${req.body.paidAmount}::decimal,
                "purchaseDate" = ${req.body.purchaseDate ? new Date(req.body.purchaseDate) : new Date()},
                "carNumber" = ${req.body.carNumber || null},
                "transportCost" = ${req.body.transportCost || null},
                "loadingDate" = ${req.body.loadingDate ? new Date(req.body.loadingDate) : null},
                "arrivalDate" = ${req.body.arrivalDate ? new Date(req.body.arrivalDate) : null},
                "contactId" = ${req.body.contactId},
                "updatedAt" = NOW()
            WHERE id = ${req.params.id} AND "userId" = ${req.userId}
          `;
          
          // Create new purchase items
          for (const item of req.body.items) {
            const itemId = crypto.randomUUID();
            const isTotalCostItem = item.perUnitCost ? true : false;
            await prisma.$executeRaw`
              INSERT INTO "BulkPurchaseItem" (id, quantity, "purchasePrice", "isTotalCostItem", "bulkPurchaseId", "productId", "createdAt", "updatedAt")
              VALUES (${itemId}, ${item.quantity}::decimal, ${item.purchasePrice}::decimal, ${isTotalCostItem}, ${req.params.id}, ${item.productId}, NOW(), NOW())
            `;
          }
          
          const updatedPurchase = await prisma.bulkPurchase.findUnique({
            where: { id: req.params.id },
            include: {
              contact: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          });

          // Update product quantities and purchase prices for new items
          for (const item of req.body.items) {
            console.log("real culprit:", item)
            if (item.perUnitCost) {
              const data = await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: { increment: item.quantity },
                  purchasePrice: item.purchasePrice,
                  perUnitPurchasePrice: item.perUnitCost
                }

              });
              console.log("data is", data);
            } else {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: { increment: item.quantity },
                  purchasePrice: item.purchasePrice
                }
              });
            }
          }

          return updatedPurchase;
        });

        res.json(purchase);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Delete a bulk purchase
  app.delete('/api/bulk-purchases/:id', authenticateToken, async (req, res) => {
    try {
      await withTransaction(prisma, async (prisma) => {
        // Get the purchase with its items
        const purchase = await prisma.bulkPurchase.findUnique({
          where: { 
            id: req.params.id,
            userId: req.userId
          },
          include: {
            items: true
          }
        });

        if (!purchase) {
          throw new Error('Bulk purchase not found');
        }

        // Revert quantities to products
        for (const item of purchase.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          });
        }

        // First delete all purchase items
        await prisma.bulkPurchaseItem.deleteMany({
          where: { bulkPurchaseId: req.params.id }
        });

        // Then delete the purchase
        await prisma.bulkPurchase.delete({
          where: { 
            id: req.params.id,
            userId: req.userId
          }
        });
      });

      res.status(204).send();
    } catch (error) {
      if (error.message === 'Bulk purchase not found') {
        return res.status(404).json({ error: 'Bulk purchase not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });
}