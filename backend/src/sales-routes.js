import { validateRequest, authenticateToken } from './middleware.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { saleSchema, querySchema } from './schemas.js';
import { withTransaction, safeQuery } from './db-utils.js';
import { logAuditChange } from './audit-utils.js';
import { createDateWithCurrentTime } from './timezone-helper.js';



// Helper function to adjust date for display (no adjustment needed now)
function adjustDateForDisplay(date) {
  if (!date) return date;
  return date;
}

function parseDateDDMMYYYY(dateString) {
  if (!dateString) {
    return null;
  }
  
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (day >= 1 && day <= 31 && 
        month >= 0 && month <= 11 && 
        year >= 1900 && year <= 9999) {
      
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

      if (date.getUTCFullYear() === year && 
          date.getUTCMonth() === month && 
          date.getUTCDate() === day) {
        
        return date;
      }
    }
  }
  
  return null;
}

export function setupSalesRoutes(app, prisma) {
  // Create a sale
  app.post(
    '/api/sales',
    authenticateToken,
    validateRequest({ body: saleSchema }),
    async (req, res) => {
      try {
        const sale = await withTransaction(prisma, async (prisma) => {
          // Generate bill number based on total sale count + 1
          const saleCount = await prisma.sale.count({ where: { userId: req.userId } });
          const billNumber = (saleCount + 1).toString();

          // Use custom sale date if provided, otherwise use current Pakistan time
          const saleDate = req.body.saleDate ? createDateWithCurrentTime(req.body.saleDate) : createDateWithCurrentTime();
          // Get product details including purchase prices
          const productDetails = await Promise.all(
            req.body.items.map(item => 
              prisma.product.findUnique({
                where: { id: item.productId },
                select: { id: true, purchasePrice: true, perUnitPurchasePrice: true, unit: true, name: true, quantity: true, isService: true }
              })
            )
          );

          // Create sale using raw SQL
          const saleId = crypto.randomUUID();
          await prisma.$executeRaw`
            INSERT INTO "Sale" (id, "billNumber", "totalAmount", "originalTotalAmount", discount, "paidAmount", "saleDate", "contactId", "orderBookerId", "employeeId", "carNumber", "transportCost", "loadingDate", "arrivalDate", description, "userId", "createdAt", "updatedAt")
            VALUES (${saleId}, ${billNumber}, ${req.body.totalAmount}, ${req.body.originalTotalAmount || req.body.totalAmount + (req.body.discount || 0)}, ${req.body.discount || 0}, ${req.body.paidAmount || 0}, ${saleDate.getTime()}, ${req.body.contactId}, ${req.body.orderBookerId}, ${req.body.employeeId}, ${req.body.carNumber}, ${req.body.transportCost}, ${req.body.loadingDate ? createDateWithCurrentTime(req.body.loadingDate).getTime() : null}, ${req.body.arrivalDate ? createDateWithCurrentTime(req.body.arrivalDate).getTime() : null}, ${req.body.description}, ${req.userId}, ${new Date().getTime()}, ${new Date().getTime()})
          `;
          
          // Create sale items
          for (const [index, item] of req.body.items.entries()) {
            const product = productDetails[index];
            const bulkUnits = ['kg', 'ltr', 'ml', 'gram', 'dozen', 'ton', 'metre', 'ft', 'sqft', 'ohm'];
            const perUnitCost = bulkUnits.includes(product?.unit?.toLowerCase())
              ? (product?.perUnitPurchasePrice || 0)
              : (product?.purchasePrice || 0);
            const itemId = crypto.randomUUID();
            await prisma.$executeRaw`
              INSERT INTO "SaleItem" (id, quantity, price, "priceType", "purchasePrice", "saleId", "productId", "createdAt", "updatedAt")
              VALUES (${itemId}, ${item.quantity}, ${item.price}, ${item.priceType || "retail"}, ${perUnitCost}, ${saleId}, ${item.productId}, ${new Date().getTime()}, ${new Date().getTime()})
            `;
          }
          
          // Get the created sale with relations
          const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: {
              items: {
                include: {
                  product: true
                }
              },
              contact: true,
              orderBooker: true
            }
          });

          for (const item of req.body.items) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              include: {
                parentProduct: { select: { isService: true } },
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        rawMaterial: true
                      }
                    }
                  }
                }
              }
            });

            if (!product) {
              throw new Error(`Product with ID ${item.productId} not found`);
            }

            const isServiceProduct = product.isService || product.parentProduct?.isService || false;
            console.log(`[CREATE] ${product.name}: SaleQty=${item.quantity}, Stock=${product.quantity}, isService=${isServiceProduct}`);

            // Services skip stock deduction entirely
            if (isServiceProduct) {
              console.log(`[CREATE] Service — no stock deduction`);
            } else {
              // Convert piece quantity to primary unit quantity if selling by piece
              const stockDeduction = item.sellingByPiece && item.piecesPerUnit
                ? item.quantity / item.piecesPerUnit
                : item.quantity;
              
              if (product.quantity >= stockDeduction) {
              console.log(`[CREATE] Direct deduction: ${stockDeduction}${item.sellingByPiece ? ` (${item.quantity} pcs)` : ''}`);
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: {
                    decrement: stockDeduction
                  }
                }
              });
            } else if (product.recipe) {
              const quantityNeeded = stockDeduction - product.quantity;
              console.log(`[CREATE] Auto-mfg: Need=${quantityNeeded}`);
              
              // Calculate max quantity we can make with available materials
              let maxCanMake = quantityNeeded;
              for (const ingredient of product.recipe.ingredients) {
                const canMakeWithThis = Math.floor(ingredient.rawMaterial.quantity / ingredient.quantity);
                maxCanMake = Math.min(maxCanMake, canMakeWithThis);
              }
              
              console.log(`[CREATE] Can make ${maxCanMake} units with available materials`);
              
              if (maxCanMake > 0) {
                for (const ingredient of product.recipe.ingredients) {
                  const needed = ingredient.quantity * maxCanMake;
                  console.log(`[CREATE] Deduct ${ingredient.rawMaterial.name}: ${needed}`);
                  await prisma.product.update({
                    where: { id: ingredient.rawMaterialId },
                    data: {
                      quantity: {
                        decrement: needed
                      }
                    }
                  });
                }
                
                if (product.quantity > 0) {
                  console.log(`[CREATE] Set product to 0 (was ${product.quantity})`);
                  await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                      quantity: 0
                    }
                  });
                }
              }
            } else {
              throw new Error(`Insufficient stock for product ${product.name}`);
            }
            }
          }

          return sale;
        });

        res.status(201).json(sale);
      } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Get sales with credit balance (overpaid)
  app.get('/api/sales/credit-balance', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      // Get all sales with returns to calculate credit balance
      const allSales = await prisma.sale.findMany({
        where: { userId: req.userId },
        include: {
          returns: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          },
          items: {
            include: {
              product: true,
            },
          },
          contact: true,
        }
      });
      
      // Filter sales with credit balance (overpaid)
      const creditSales = allSales.filter(sale => {
        const originalAmount = Number(sale.totalAmount);
        const returnedAmount = (sale.returns || []).reduce((sum, ret) => sum + Number(ret.totalAmount), 0);
        const totalRefunded = (sale.returns || []).reduce((sum, ret) => sum + (ret.refundPaid ? Number(ret.refundAmount || 0) : 0), 0);
        const netAmount = originalAmount - returnedAmount;
        const balance = netAmount - Number(sale.paidAmount) + totalRefunded;
        return balance < 0; // Credit balance (overpaid)
      });
      
      // Apply search filter
      const filteredSales = search ? 
        creditSales.filter(sale => sale.billNumber.includes(search)) : 
        creditSales;
      
      // Apply pagination
      const total = filteredSales.length;
      const items = filteredSales
        .slice((page - 1) * limit, page * limit)
        .map(sale => {
          const returnedQuantities = {};
          (sale.returns || []).forEach(returnRecord => {
            (returnRecord.items || []).forEach(returnItem => {
              if (!returnedQuantities[returnItem.productId]) {
                returnedQuantities[returnItem.productId] = 0;
              }
              returnedQuantities[returnItem.productId] += Number(returnItem.quantity);
            });
          });
          
          return {
            ...sale,
            saleDate: adjustDateForDisplay(sale.saleDate),
            items: sale.items.map(item => ({
              ...item,
              returnedQuantity: returnedQuantities[item.productId] || 0,
              remainingQuantity: Number(item.quantity) - (returnedQuantities[item.productId] || 0)
            }))
          };
        });

      res.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching credit balance sales:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get sales with pending payments
  app.get('/api/sales/pending-payments', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      // Get all sales with returns to calculate net amounts
      const allSales = await prisma.sale.findMany({
        where: { userId: req.userId },
        include: {
          returns: true
        }
      });
      
      // Filter sales with pending payments based on net amounts after returns
      const pendingSales = allSales.filter(sale => {
        const originalAmount = Number(sale.totalAmount);
        const returnedAmount = (sale.returns || []).reduce((sum, ret) => sum + Number(ret.totalAmount), 0);
        const netAmount = originalAmount - returnedAmount;
        const balance = netAmount - Number(sale.paidAmount);
        return balance > 0; // Has pending payment
      });
      
      // Apply search filter
      const filteredSales = search ? 
        pendingSales.filter(sale => sale.billNumber.includes(search)) : 
        pendingSales;
      
      // Apply pagination
      const total = filteredSales.length;
      const items = filteredSales
        .slice((page - 1) * limit, page * limit)
        .map(sale => {
          const returnedQuantities = {};
          if (sale.returns && Array.isArray(sale.returns)) {
            sale.returns.forEach(returnRecord => {
              if (returnRecord && returnRecord.items && Array.isArray(returnRecord.items)) {
                returnRecord.items.forEach(returnItem => {
                  if (returnItem && returnItem.productId) {
                    if (!returnedQuantities[returnItem.productId]) {
                      returnedQuantities[returnItem.productId] = 0;
                    }
                    returnedQuantities[returnItem.productId] += Number(returnItem.quantity || 0);
                  }
                });
              }
            });
          }
          
          return {
            ...sale,
            saleDate: adjustDateForDisplay(sale.saleDate),
            items: sale.items?.map(item => ({
              ...item,
              returnedQuantity: returnedQuantities[item.productId] || 0,
              remainingQuantity: Number(item.quantity) - (returnedQuantities[item.productId] || 0)
            })) || []
          };
        });

      // Get full sale data for the filtered items
      const saleIds = items.map(sale => sale.id);
      const fullSales = await prisma.sale.findMany({
        where: {
          userId: req.userId,
          id: {
            in: saleIds
          }
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          contact: true,
          
          returns: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: [{ createdAt: 'desc' }, { saleDate: 'desc' }]
      });

      // Add returned quantities to full sales data
      const finalItems = fullSales.map(sale => {
        const returnedQuantities = {};
        if (sale.returns && Array.isArray(sale.returns)) {
          sale.returns.forEach(returnRecord => {
            if (returnRecord && returnRecord.items && Array.isArray(returnRecord.items)) {
              returnRecord.items.forEach(returnItem => {
                if (returnItem && returnItem.productId) {
                  if (!returnedQuantities[returnItem.productId]) {
                    returnedQuantities[returnItem.productId] = 0;
                  }
                  returnedQuantities[returnItem.productId] += Number(returnItem.quantity || 0);
                }
              });
            }
          });
        }
        
        return {
          ...sale,
          saleDate: adjustDateForDisplay(sale.saleDate),
          items: sale.items?.map(item => ({
            ...item,
            returnedQuantity: returnedQuantities[item.productId] || 0,
            remainingQuantity: Number(item.quantity) - (returnedQuantities[item.productId] || 0)
          })) || []
        };
      });

      res.json({
        items: finalItems,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all sales with search and pagination
  app.get('/api/sales', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const contactId = req.query.contactId || '';
      let date = decodeURIComponent(req.query.date || '');
      
      // Force extract date from URL if not in query
      if (!date && req.url.includes('date=')) {
        const urlMatch = req.url.match(/date=([^&]+)/);
        if (urlMatch) {
          const extractedDate = decodeURIComponent(urlMatch[1]);
          date = extractedDate;
        }
      }

      let where = { userId: req.userId };
      let conditions = [];

      // Handle date filter (from date picker)
      if (date && date.trim() !== '') {
        const parsedDate = parseDateDDMMYYYY(date);
        if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
          const startOfDay = new Date(Date.UTC(
            parsedDate.getUTCFullYear(),
            parsedDate.getUTCMonth(),
            parsedDate.getUTCDate(),
            0, 0, 0, 0
          ));
          
          const endOfDay = new Date(Date.UTC(
            parsedDate.getUTCFullYear(),
            parsedDate.getUTCMonth(),
            parsedDate.getUTCDate(),
            23, 59, 59, 999
          ));

          conditions.push({
            saleDate: {
              gte: startOfDay,
              lt: new Date(endOfDay.getTime() + 1),
            }
          });
        }
      }

      // Handle contact filter
      if (contactId && contactId.trim() !== '') {
        conditions.push({ contactId });
      }

      // Handle search (bill number or contact name)
      if (search && search.trim() !== '') {
        console.log('Processing search parameter:', search);
        // Check if search looks like a date (DD/MM/YYYY) - if so, treat as date filter
        const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        const isDateFormat = datePattern.test(search);
        
        if (isDateFormat && (!date || date.trim() === '')) {
          // Only use search as date if no separate date filter is provided
          const parsedSearchDate = parseDateDDMMYYYY(search);
          
          if (parsedSearchDate instanceof Date && !isNaN(parsedSearchDate.getTime())) {
            const startOfDay = new Date(Date.UTC(
              parsedSearchDate.getUTCFullYear(),
              parsedSearchDate.getUTCMonth(),
              parsedSearchDate.getUTCDate(),
              0, 0, 0, 0
            ));
            
            const endOfDay = new Date(Date.UTC(
              parsedSearchDate.getUTCFullYear(),
              parsedSearchDate.getUTCMonth(),
              parsedSearchDate.getUTCDate(),
              23, 59, 59, 999
            ));

            conditions.push({
              saleDate: {
                gte: startOfDay,
                lt: new Date(endOfDay.getTime() + 1),
              }
            });
          } else {
            // If date parsing failed, search by bill number, contact name, and order booker name
            conditions.push({
              OR: [
                {
                  billNumber: {
                    contains: search
                  }
                },
                {
                  contact: {
                    name: {
                      contains: search
                    }
                  }
                },
                {
                  orderBooker: {
                    name: {
                      contains: search
                    }
                  }
                }
              ]
            });
            console.log('Added bill/contact/order booker search for:', search);
          }
        } else {
          // Always search by bill number, contact name, and order booker name when not a date format or when date param exists
          conditions.push({
            OR: [
              {
                billNumber: {
                  contains: search
                }
              },
              {
                contact: {
                  name: {
                    contains: search
                  }
                }
              },
              {
                orderBooker: {
                  name: {
                    contains: search
                  }
                }
              }
            ]
          });
          console.log('Added bill/contact/order booker search for:', search);
        }
      }

      // Combine all conditions with AND logic
      if (conditions.length > 0) {
        where = {
          userId: req.userId,
          ...(conditions.length === 1 ? conditions[0] : { AND: conditions })
        };
      }

      const [total, salesData] = await Promise.all([
        prisma.sale.count({ where }),
        prisma.sale.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { saleDate: 'desc' }],
          include: {
            items: {
              include: {
                product: true,
              },
            },
            contact: true,
            orderBooker: true,
            returns: {
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            }
          },
        }),
      ]);
      
      // Add returned quantities to each sale and adjust dates for display
      const items = salesData.map(sale => {
        console.log('Sale items for sale', sale.id, ':', sale.items?.length || 0);
        
        const returnedQuantities = {};
        if (sale.returns && Array.isArray(sale.returns)) {
          sale.returns.forEach(returnRecord => {
            if (returnRecord && returnRecord.items && Array.isArray(returnRecord.items)) {
              returnRecord.items.forEach(returnItem => {
                if (returnItem && returnItem.productId) {
                  if (!returnedQuantities[returnItem.productId]) {
                    returnedQuantities[returnItem.productId] = 0;
                  }
                  returnedQuantities[returnItem.productId] += Number(returnItem.quantity || 0);
                }
              });
            }
          });
        }
        
        return {
          ...sale,
          saleDate: adjustDateForDisplay(sale.saleDate),
          items: sale.items?.map(item => ({
            ...item,
            id: item.id?.toString(),
            productId: item.productId?.toString(),
            returnedQuantity: returnedQuantities[item.productId] || 0,
            remainingQuantity: Number(item.quantity) - (returnedQuantities[item.productId] || 0)
          })) || []
        };
      });

      res.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: 'An internal server error occurred.' });
    }
  });

  // Get a single sale
  app.get('/api/sales/:id', authenticateToken, async (req, res) => {
    try {
      const sale = await prisma.sale.findUnique({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          contact: true,
          orderBooker: true,
          returns: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        },
      });
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }
      
      // Calculate returned quantities for each product
      const returnedQuantities = {};
      if (sale.returns && Array.isArray(sale.returns)) {
        sale.returns.forEach(returnRecord => {
          if (returnRecord && returnRecord.items && Array.isArray(returnRecord.items)) {
            returnRecord.items.forEach(returnItem => {
              if (returnItem && returnItem.productId) {
                if (!returnedQuantities[returnItem.productId]) {
                  returnedQuantities[returnItem.productId] = 0;
                }
                returnedQuantities[returnItem.productId] += Number(returnItem.quantity || 0);
              }
            });
          }
        });
      }
      
      // Add returned quantities to sale items and adjust date for display
      const saleWithReturns = {
        ...sale,
        saleDate: adjustDateForDisplay(sale.saleDate),
        items: sale.items.map(item => ({
          ...item,
          returnedQuantity: returnedQuantities[item.productId] || 0,
          remainingQuantity: Number(item.quantity) - (returnedQuantities[item.productId] || 0)
        }))
      };
      
      res.json(saleWithReturns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update a sale
  app.put(
    '/api/sales/:id',
    authenticateToken,
    validateRequest({ body: saleSchema }),
    async (req, res) => {
      try {
        const sale = await withTransaction(prisma, async (prisma) => {
          const existingSale = await prisma.sale.findUnique({
            where: { 
              id: req.params.id,
              userId: req.userId
            },
            include: {
              items: true
            }
          });

          if (!existingSale) {
            throw new Error('Sale not found');
          }

          // Log audit changes only for paidAmount when it actually changes
          if (Number(existingSale.paidAmount) !== Number(req.body.paidAmount)) {
            await logAuditChange(prisma, 'Sale', req.params.id, 'paidAmount', existingSale.paidAmount, req.body.paidAmount, req.body.paymentDescription || 'Payment amount updated', req.body.changeDate);
          }



          for (const item of existingSale.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  increment: item.quantity
                }
              }
            });
          }

          await prisma.saleItem.deleteMany({
            where: { saleId: req.params.id }
          });
          
          // Get product details including purchase prices for update
          const productDetails = await Promise.all(
            req.body.items.map(item => 
              prisma.product.findUnique({
                where: { id: item.productId },
                select: { id: true, purchasePrice: true, perUnitPurchasePrice: true, unit: true, name: true, quantity: true, isService: true }
              })
            )
          );

          // Update sale using raw SQL - update saleDate if provided
          const saleDate = req.body.saleDate ? createDateWithCurrentTime(req.body.saleDate) : existingSale.saleDate;
          await prisma.$executeRaw`
            UPDATE "Sale" 
            SET "totalAmount" = ${req.body.totalAmount},
                "originalTotalAmount" = ${req.body.originalTotalAmount || req.body.totalAmount + (req.body.discount || 0)},
                discount = ${req.body.discount || 0},
                "paidAmount" = ${req.body.paidAmount || 0},
                "saleDate" = ${saleDate.getTime()},
                "contactId" = ${req.body.contactId},
                "orderBookerId" = ${req.body.orderBookerId},
                "employeeId" = ${req.body.employeeId},
                "carNumber" = ${req.body.carNumber},
                "transportCost" = ${req.body.transportCost},
                "loadingDate" = ${req.body.loadingDate ? createDateWithCurrentTime(req.body.loadingDate).getTime() : null},
                "arrivalDate" = ${req.body.arrivalDate ? createDateWithCurrentTime(req.body.arrivalDate).getTime() : null},
                description = ${req.body.description},
                "updatedAt" = ${new Date().getTime()}
            WHERE id = ${req.params.id} AND "userId" = ${req.userId}
          `;
          
          // Create new sale items
          for (const [index, item] of req.body.items.entries()) {
            const product = productDetails[index];
            const bulkUnits = ['kg', 'ltr', 'ml', 'gram', 'dozen', 'ton', 'metre', 'ft', 'sqft', 'ohm'];
            const perUnitCost = bulkUnits.includes(product?.unit?.toLowerCase())
              ? (product?.perUnitPurchasePrice || 0)
              : (product?.purchasePrice || 0);
            const itemId = crypto.randomUUID();
            await prisma.$executeRaw`
              INSERT INTO "SaleItem" (id, quantity, price, "priceType", "purchasePrice", "saleId", "productId", "createdAt", "updatedAt")
              VALUES (${itemId}, ${item.quantity}, ${item.price}, ${item.priceType || "retail"}, ${perUnitCost}, ${req.params.id}, ${item.productId}, ${new Date().getTime()}, ${new Date().getTime()})
            `;
          }
          
          // Get the updated sale with relations
          const updatedSale = await prisma.sale.findUnique({
            where: { id: req.params.id },
            include: {
              items: {
                include: {
                  product: true
                }
              },
              contact: true,
              orderBooker: true
            }
          });

          for (const item of req.body.items) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              include: {
                parentProduct: { select: { isService: true } },
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        rawMaterial: true
                      }
                    }
                  }
                }
              }
            });

            if (!product) {
              throw new Error(`Product with ID ${item.productId} not found`);
            }

            const isServiceProduct = product.isService || product.parentProduct?.isService || false;
            console.log(`[UPDATE] ${product.name}: SaleQty=${item.quantity}, Stock=${product.quantity}, isService=${isServiceProduct}`);

            // Services skip stock deduction entirely
            if (isServiceProduct) {
              console.log(`[UPDATE] Service — no stock deduction`);
            } else if (product.quantity >= item.quantity) {
              console.log(`[UPDATE] Direct deduction: ${item.quantity}`);
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  quantity: {
                    decrement: item.quantity
                  }
                }
              });
            } else if (product.recipe) {
              const quantityNeeded = item.quantity - product.quantity;
              console.log(`[UPDATE] Auto-mfg: Need=${quantityNeeded}`);
              
              // Calculate max quantity we can make with available materials
              let maxCanMake = quantityNeeded;
              for (const ingredient of product.recipe.ingredients) {
                const canMakeWithThis = Math.floor(ingredient.rawMaterial.quantity / ingredient.quantity);
                maxCanMake = Math.min(maxCanMake, canMakeWithThis);
              }
              
              console.log(`[UPDATE] Can make ${maxCanMake} units with available materials`);
              
              if (maxCanMake > 0) {
                for (const ingredient of product.recipe.ingredients) {
                  const needed = ingredient.quantity * maxCanMake;
                  console.log(`[UPDATE] Deduct ${ingredient.rawMaterial.name}: ${needed}`);
                  await prisma.product.update({
                    where: { id: ingredient.rawMaterialId },
                    data: {
                      quantity: {
                        decrement: needed
                      }
                    }
                  });
                }
                
                if (product.quantity > 0) {
                  console.log(`[UPDATE] Set product to 0 (was ${product.quantity})`);
                  await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                      quantity: 0
                    }
                  });
                }
              }
            } else {
              throw new Error(`Insufficient stock for product ${product.name}`);
            }
          }

          return updatedSale;
        });

        res.json({
          ...sale,
          saleDate: sale.saleDate
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Delete a sale
  app.delete('/api/sales/:id', authenticateToken, async (req, res) => {
    try {
      await withTransaction(prisma, async (prisma) => {
        const sale = await prisma.sale.findUnique({
          where: { 
            id: req.params.id,
            userId: req.userId
          },
          include: {
            items: true,
            returns: {
              include: {
                items: true
              }
            }
          }
        });

        if (!sale) {
          throw new Error('Sale not found');
        }

        // Restore product quantities and raw materials from sale items
        for (const item of sale.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: {
              recipe: {
                include: {
                  ingredients: true
                }
              }
            }
          });

          if (product && product.recipe) {
            // If product has recipe, restore raw materials instead of final product
            for (const ingredient of product.recipe.ingredients) {
              const usedQuantity = ingredient.quantity * item.quantity;
              await prisma.product.update({
                where: { id: ingredient.rawMaterialId },
                data: {
                  quantity: {
                    increment: usedQuantity
                  }
                }
              });
            }
          } else {
            // No recipe, restore final product directly
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

        // Adjust product quantities for returned items (remove them from stock if they were added back)
        if (sale.returns && Array.isArray(sale.returns)) {
          for (const returnRecord of sale.returns) {
            if (returnRecord && returnRecord.items && Array.isArray(returnRecord.items)) {
              for (const returnItem of returnRecord.items) {
                if (returnItem && returnItem.productId) {
                  await prisma.product.update({
                    where: { id: returnItem.productId },
                    data: {
                      quantity: {
                        decrement: returnItem.quantity
                      }
                    }
                  });
                }
              }
            }
          }

          // Delete return items first
          for (const returnRecord of sale.returns) {
            if (returnRecord && returnRecord.id) {
              await prisma.saleReturnItem.deleteMany({
                where: { saleReturnId: returnRecord.id }
              });
            }
          }
        }

        // Delete returns
        await prisma.saleReturn.deleteMany({
          where: { saleId: req.params.id }
        });

        // Delete sale items
        await prisma.saleItem.deleteMany({
          where: { saleId: req.params.id }
        });

        // Delete the sale
        await prisma.sale.delete({
          where: { 
            id: req.params.id,
            userId: req.userId
          }
        });
      });

      res.status(204).send();
    } catch (error) {
      if (error.message === 'Sale not found') {
        return res.status(404).json({ error: 'Sale not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });

const analyticsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

app.get('/api/sales-analytics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, interval = 'daily' } = req.query;

    const validIntervals = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval. Must be one of: daily, weekly, monthly, yearly' });
    }

    let start, end;
    if (!startDate || !endDate) {
      end = new Date();
      switch (interval) {
        case 'daily':
          start = new Date(new Date().setDate(end.getDate() - 30));
          break;
        case 'weekly':
          start = new Date(new Date().setDate(end.getDate() - 90));
          break;
        case 'monthly':
          start = new Date(new Date().setMonth(end.getMonth() - 12));
          break;
        case 'yearly':
          start = new Date(new Date().setFullYear(end.getFullYear() - 5));
          break;
      }
    } else {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const cacheKey = `${interval}-${start.getTime()}-${end.getTime()}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
      return res.json(cached.data);
    }

    const sales = await prisma.sale.findMany({
      where: {
        userId: req.userId,
        saleDate: {
          gte: start,
          lte: end
        }
      },
      select: {
        saleDate: true,
        totalAmount: true
      }
    });

    const salesByDate = new Map();
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.saleDate);
      let groupKey;
      
      switch(interval) {
        case 'daily':
          groupKey = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate()).toISOString().split('T')[0];
          break;
        case 'weekly':
          const firstDayOfWeek = new Date(saleDate);
          const day = saleDate.getDay();
          firstDayOfWeek.setDate(saleDate.getDate() - day);
          groupKey = firstDayOfWeek.toISOString().split('T')[0];
          break;
        case 'monthly':
          groupKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          groupKey = `${saleDate.getFullYear()}`;
          break;
      }
      
      if (!salesByDate.has(groupKey)) {
        salesByDate.set(groupKey, { total: 0, count: 0 });
      }
      
      const current = salesByDate.get(groupKey);
      current.total += Number(sale.totalAmount);
      current.count += 1;
    });
    
    const allDates = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      let groupKey;
      
      switch(interval) {
        case 'daily':
          groupKey = currentDate.toISOString().split('T')[0];
          allDates.push(groupKey);
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          groupKey = new Date(currentDate).toISOString().split('T')[0];
          allDates.push(groupKey);
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          groupKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          allDates.push(groupKey);
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          groupKey = `${currentDate.getFullYear()}`;
          allDates.push(groupKey);
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
    
    const formatted = allDates.map(date => ({
      date: interval === 'daily' || interval === 'weekly' ? `${date}T00:00:00.000Z` : 
           interval === 'monthly' ? `${date}-01T00:00:00.000Z` : 
           `${date}-01-01T00:00:00.000Z`,
      total: salesByDate.has(date) ? salesByDate.get(date).total : 0,
      count: salesByDate.has(date) ? salesByDate.get(date).count : 0
    }));

    analyticsCache.set(cacheKey, {
      timestamp: Date.now(),
      data: formatted
    });

    res.json(formatted);
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});
}
