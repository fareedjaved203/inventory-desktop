import express from 'express';
import { validateRequest, authenticateToken } from './middleware.js';
import { z } from 'zod';

const loanTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(['GIVEN', 'TAKEN', 'RETURNED_BY_CONTACT', 'RETURNED_TO_CONTACT']),
  description: z.string().optional(),
});

let prisma;

function createLoanRoutes(prismaInstance) {
  prisma = prismaInstance;
  const router = express.Router();
  // Get loans - all or filtered by contactId
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const { contactId } = req.query;
      
      const where = {
        userId: req.userId,
        ...(contactId && { contactId })
      };
      
      const transactions = await prisma.loanTransaction.findMany({
        where,
        include: {
          contact: {
            select: { id: true, name: true }
          }
        },
        orderBy: { date: 'desc' }
      });
      
      // If contactId is provided, calculate totals
      if (contactId) {
        const totals = transactions.reduce((acc, transaction) => {
          const amount = Number(transaction.amount);
          switch (transaction.type) {
            case 'GIVEN':
              acc.totalGiven += amount;
              break;
            case 'TAKEN':
              acc.totalTaken += amount;
              break;
            case 'RETURNED_BY_CONTACT':
              acc.totalReturnedByContact += amount;
              break;
            case 'RETURNED_TO_CONTACT':
              acc.totalReturnedToContact += amount;
              break;
          }
          return acc;
        }, {
          totalGiven: 0,
          totalTaken: 0,
          totalReturnedByContact: 0,
          totalReturnedToContact: 0
        });
        
        res.json({
          ...totals,
          transactions: transactions.map(t => ({
            ...t,
            amount: Number(t.amount)
          }))
        });
      } else {
        res.json({
          transactions: transactions.map(t => ({
            ...t,
            amount: Number(t.amount)
          }))
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new loan transaction
  router.post('/', authenticateToken, validateRequest({ body: loanTransactionSchema.extend({ contactId: z.string() }) }), async (req, res) => {
    try {
      const transaction = await prisma.loanTransaction.create({
        data: {
          ...req.body,
          date: new Date(),
          userId: req.userId
        },
        include: {
          contact: {
            select: { id: true, name: true }
          }
        }
      });
      
      res.status(201).json({
        ...transaction,
        amount: Number(transaction.amount)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a loan transaction
  router.delete('/:transactionId', authenticateToken, async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      await prisma.loanTransaction.delete({
        where: { 
          id: transactionId,
          userId: req.userId
        }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function setupLoanRoutes(app, prismaInstance) {
  app.use('/api/loans', createLoanRoutes(prismaInstance));
}

export default createLoanRoutes;