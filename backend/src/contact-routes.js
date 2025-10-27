import { validateRequest, authenticateToken } from './middleware.js';
import { contactSchema, contactUpdateSchema, querySchema } from './schemas.js';
import { withTransaction } from './db-utils.js';

export function setupContactRoutes(app, prisma) {
  // Get all contacts with search and pagination
  app.get('/api/contacts', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', contactType = '' } = req.query;

      const where = {
        userId: req.userId,
        ...(contactType && contactType !== 'both' && { contactType }),
        ...(contactType === 'both' && { contactType: 'both' }),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search, mode: 'insensitive' } },
          ],
        } : {})
      };

      const [total, items] = await Promise.all([
        prisma.contact.count({ where }),
        prisma.contact.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.json({
        items: items.map(item => ({
          ...item,
          id: item.id.toString(),
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single contact
  app.get('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      const contact = await prisma.contact.findUnique({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json({
        ...contact,
        id: contact.id.toString(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new contact
  app.post(
    '/api/contacts',
    authenticateToken,
    validateRequest({ body: contactSchema }),
    async (req, res) => {
      try {
        // Check if contact with same name exists
        const existingContact = await prisma.contact.findFirst({
          where: { 
            name: req.body.name,
            userId: req.userId
          }
        });

        if (existingContact) {
          return res.status(400).json({ error: 'A contact with this name already exists' });
        }

        const contact = await prisma.contact.create({
          data: {
            ...req.body,
            userId: req.userId
          },
        });

        res.status(201).json({
          ...contact,
          id: contact.id.toString(),
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Update a contact
  app.put(
    '/api/contacts/:id',
    authenticateToken,
    validateRequest({ body: contactUpdateSchema }),
    async (req, res) => {
      try {
        // Check if contact with same name exists (excluding current contact)
        if (req.body.name) {
          const existingContact = await prisma.contact.findFirst({
            where: {
              name: req.body.name,
              userId: req.userId,
              NOT: {
                id: req.params.id
              }
            }
          });

          if (existingContact) {
            return res.status(400).json({ error: 'A contact with this name already exists' });
          }
        }

        const contact = await prisma.contact.update({
          where: { 
            id: req.params.id,
            userId: req.userId
          },
          data: req.body,
        });

        res.json({
          ...contact,
          id: contact.id.toString(),
        });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Contact not found' });
        }
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Get customer statement data
  app.get('/api/contacts/:id/statement', authenticateToken, async (req, res) => {
    try {
      const { id: contactId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Get contact details
      const contact = await prisma.contact.findUnique({
        where: { 
          id: contactId,
          userId: req.userId
        }
      });
      
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      // Date range filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
      }
      
      const saleDateFilter = {};
      if (startDate || endDate) {
        saleDateFilter.saleDate = {};
        if (startDate) saleDateFilter.saleDate.gte = new Date(startDate);
        if (endDate) saleDateFilter.saleDate.lte = new Date(endDate);
      }
      
      const returnDateFilter = {};
      if (startDate || endDate) {
        returnDateFilter.returnDate = {};
        if (startDate) returnDateFilter.returnDate.gte = new Date(startDate);
        if (endDate) returnDateFilter.returnDate.lte = new Date(endDate);
      }
      
      const purchaseDateFilter = {};
      if (startDate || endDate) {
        purchaseDateFilter.purchaseDate = {};
        if (startDate) purchaseDateFilter.purchaseDate.gte = new Date(startDate);
        if (endDate) purchaseDateFilter.purchaseDate.lte = new Date(endDate);
      }
      
      // Get all transactions
      const [sales, loanTransactions, returns, bulkPurchases] = await Promise.all([
        prisma.sale.findMany({
          where: {
            contactId,
            userId: req.userId,
            ...saleDateFilter
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { saleDate: 'asc' }
        }),
        prisma.loanTransaction.findMany({
          where: {
            contactId,
            userId: req.userId,
            ...dateFilter
          },
          orderBy: { date: 'asc' }
        }),
        prisma.saleReturn.findMany({
          where: {
            sale: {
              contactId,
              userId: req.userId
            },
            ...returnDateFilter
          },
          include: {
            sale: true,
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { returnDate: 'asc' }
        }),
        prisma.bulkPurchase.findMany({
          where: {
            contactId,
            userId: req.userId,
            ...purchaseDateFilter
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { purchaseDate: 'asc' }
        })
      ]);
      
      // Calculate opening balance (transactions before start date)
      let openingBalance = 0;
      if (startDate) {
        const beforeStartDate = new Date(startDate);
        
        const [salesBefore, loansBefore, returnsBefore, purchasesBefore] = await Promise.all([
          prisma.sale.findMany({
            where: {
              contactId,
              userId: req.userId,
              saleDate: { lt: beforeStartDate }
            }
          }),
          prisma.loanTransaction.findMany({
            where: {
              contactId,
              userId: req.userId,
              date: { lt: beforeStartDate }
            }
          }),
          prisma.saleReturn.findMany({
            where: {
              sale: { 
                contactId,
                userId: req.userId
              },
              returnDate: { lt: beforeStartDate }
            }
          }),
          prisma.bulkPurchase.findMany({
            where: {
              contactId,
              userId: req.userId,
              purchaseDate: { lt: beforeStartDate }
            }
          })
        ]);
        
        // Calculate opening balance
        salesBefore.forEach(sale => {
          openingBalance += Number(sale.totalAmount) - Number(sale.paidAmount);
        });
        
        purchasesBefore.forEach(purchase => {
          openingBalance -= Number(purchase.totalAmount) - Number(purchase.paidAmount);
        });
        
        loansBefore.forEach(loan => {
          const amount = Number(loan.amount);
          if (loan.type === 'GIVEN' || loan.type === 'RETURNED_TO_CONTACT') {
            openingBalance += amount;
          } else if (loan.type === 'TAKEN' || loan.type === 'RETURNED_BY_CONTACT') {
            openingBalance -= amount;
          }
        });
        
        returnsBefore.forEach(returnItem => {
          if (returnItem.refundPaid) {
            openingBalance -= Number(returnItem.refundAmount || 0);
          }
        });
      }
      
      // Combine and sort all transactions by date
      const allTransactions = [];
      
      // Add sales
      sales.forEach(sale => {
        allTransactions.push({
          type: 'SALE',
          date: sale.saleDate,
          sortDate: sale.createdAt, // Use creation timestamp for sorting
          description: `Sale Invoice #${sale.billNumber}`,
          debit: Number(sale.totalAmount),
          credit: Number(sale.paidAmount),
          reference: sale.billNumber,
          data: sale
        });
      });
      
      // Add bulk purchases
      bulkPurchases.forEach(purchase => {
        allTransactions.push({
          type: 'PURCHASE',
          date: purchase.purchaseDate,
          sortDate: purchase.createdAt, // Use creation timestamp for sorting
          description: `Purchase Invoice #${purchase.invoiceNumber || purchase.id.slice(-6)}`,
          debit: 0,
          credit: Number(purchase.totalAmount) - Number(purchase.paidAmount),
          reference: purchase.invoiceNumber || purchase.id,
          data: purchase
        });
        
        // Add payment if any
        if (Number(purchase.paidAmount) > 0) {
          allTransactions.push({
            type: 'PURCHASE_PAYMENT',
            date: purchase.purchaseDate,
            sortDate: purchase.createdAt, // Use creation timestamp for sorting
            description: `Purchase Payment #${purchase.invoiceNumber || purchase.id.slice(-6)}`,
            debit: Number(purchase.paidAmount),
            credit: 0,
            reference: purchase.invoiceNumber || purchase.id,
            data: purchase
          });
        }
      });
      
      // Add loan transactions
      loanTransactions.forEach(loan => {
        const amount = Number(loan.amount);
        let debit = 0, credit = 0;
        let description = '';
        
        if (loan.type === 'GIVEN') {
          debit = amount;
          description = `Loan Given${loan.description ? ` - ${loan.description}` : ''}`;
        } else if (loan.type === 'TAKEN') {
          credit = amount;
          description = `Loan Taken${loan.description ? ` - ${loan.description}` : ''}`;
        } else if (loan.type === 'RETURNED_BY_CONTACT') {
          credit = amount;
          description = `Loan Returned by Customer${loan.description ? ` - ${loan.description}` : ''}`;
        } else if (loan.type === 'RETURNED_TO_CONTACT') {
          debit = amount;
          description = `Loan Returned to Customer${loan.description ? ` - ${loan.description}` : ''}`;
        }
        
        allTransactions.push({
          type: 'LOAN',
          date: loan.date,
          sortDate: loan.createdAt || loan.date, // Use creation timestamp for sorting
          description,
          debit,
          credit,
          reference: loan.id,
          data: loan
        });
      });
      
      // Add returns
      returns.forEach(returnItem => {
        if (returnItem.refundPaid && returnItem.refundAmount > 0) {
          allTransactions.push({
            type: 'RETURN',
            date: returnItem.returnDate,
            sortDate: returnItem.createdAt || returnItem.returnDate, // Use creation timestamp for sorting
            description: `Return Refund #${returnItem.returnNumber}`,
            debit: 0,
            credit: Number(returnItem.refundAmount),
            reference: returnItem.returnNumber,
            data: returnItem
          });
        }
      });
      
      // Sort by creation timestamp for proper chronological order
      allTransactions.sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));
      
      // Calculate running balance
      let runningBalance = openingBalance;
      const transactionsWithBalance = allTransactions.map(transaction => {
        runningBalance += transaction.debit - transaction.credit;
        return {
          ...transaction,
          runningBalance
        };
      });
      
      res.json({
        contact,
        openingBalance,
        closingBalance: runningBalance,
        transactions: transactionsWithBalance
      });
    } catch (error) {
      console.error('Error fetching customer statement:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a contact
  app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      const contactId = req.params.id;
      
      // Check what's preventing deletion
      const [sales, purchases, loans] = await Promise.all([
        prisma.sale.count({ where: { contactId, userId: req.userId } }),
        prisma.bulkPurchase.count({ where: { contactId, userId: req.userId } }),
        prisma.loanTransaction.count({ where: { contactId, userId: req.userId } })
      ]);
      
      if (sales > 0 || purchases > 0) {
        const references = [];
        if (sales > 0) references.push(`${sales} sale(s)`);
        if (purchases > 0) references.push(`${purchases} purchase(s)`);
        
        return res.status(400).json({ 
          error: `Cannot delete contact. It is linked to ${references.join(' and ')}.` 
        });
      }
      
      // Delete loan transactions first, then contact
      await withTransaction(prisma, async (prisma) => {
        if (loans > 0) {
          await prisma.loanTransaction.deleteMany({
            where: { 
              contactId,
              userId: req.userId
            }
          });
        }
        
        await prisma.contact.delete({
          where: { 
            id: contactId,
            userId: req.userId
          }
        });
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Contact deletion error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.status(500).json({ error: 'Failed to delete contact. Please try again.' });
    }
  });
}