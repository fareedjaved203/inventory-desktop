import express from 'express';
import { authenticateToken } from './middleware.js';
import { z } from 'zod';
import crypto from 'crypto';

let prisma;

function createExpenseRoutes(prismaInstance) {
  prisma = prismaInstance;
  const router = express.Router();

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptNumber: z.string().optional(),
  contactId: z.union([z.string(), z.null(), z.undefined()]).optional(),
  productId: z.union([z.string(), z.null(), z.undefined()]).optional(),
});

// Get expenses with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const userId = req.userId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId,
      ...(search && {
        OR: [
          { category: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { receiptNumber: { contains: search, mode: 'insensitive' } },
          { paymentMethod: { contains: search, mode: 'insensitive' } },
        ]
      })
    };

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        contact: {
          select: { id: true, name: true }
        },
        product: {
          select: { id: true, name: true, isRawMaterial: true }
        }
      },
      orderBy: { date: 'desc' },
    });

    // Only show manual expenses, not raw material purchases
    const allExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount)
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Apply search filter to combined results
    const filteredExpenses = search ? allExpenses.filter(expense => 
      expense.category.toLowerCase().includes(search.toLowerCase()) ||
      (expense.description && expense.description.toLowerCase().includes(search.toLowerCase())) ||
      (expense.receiptNumber && expense.receiptNumber.toLowerCase().includes(search.toLowerCase())) ||
      (expense.paymentMethod && expense.paymentMethod.toLowerCase().includes(search.toLowerCase()))
    ) : allExpenses;

    // Apply pagination
    const total = filteredExpenses.length;
    const paginatedExpenses = filteredExpenses.slice(skip, skip + parseInt(limit));

    res.json({
      items: paginatedExpenses,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create expense
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const validatedData = expenseSchema.parse(req.body);

    const expenseId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Expense" (id, amount, date, category, description, "paymentMethod", "receiptNumber", "contactId", "productId", "userId", "createdAt", "updatedAt")
      VALUES (${expenseId}, ${validatedData.amount}::decimal, ${new Date(validatedData.date)}, ${validatedData.category}, ${validatedData.description}, ${validatedData.paymentMethod}, ${validatedData.receiptNumber}, ${validatedData.contactId}, ${validatedData.productId}, ${userId}, NOW(), NOW())
    `;
    
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        contact: {
          select: { id: true, name: true }
        },
        product: {
          select: { id: true, name: true, isRawMaterial: true }
        }
      }
    });

    // Convert BigInt to number for JSON serialization
    const responseExpense = {
      ...expense,
      amount: Number(expense.amount)
    };

    res.json(responseExpense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const validatedData = expenseSchema.parse(req.body);

    await prisma.$executeRaw`
      UPDATE "Expense" 
      SET amount = ${validatedData.amount}::decimal,
          date = ${new Date(validatedData.date)},
          category = ${validatedData.category},
          description = ${validatedData.description},
          "paymentMethod" = ${validatedData.paymentMethod},
          "receiptNumber" = ${validatedData.receiptNumber},
          "contactId" = ${validatedData.contactId},
          "productId" = ${validatedData.productId},
          "updatedAt" = NOW()
      WHERE id = ${id} AND "userId" = ${userId}
    `;
    
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        contact: {
          select: { id: true, name: true }
        },
        product: {
          select: { id: true, name: true, isRawMaterial: true }
        }
      }
    });

    // Convert BigInt to number for JSON serialization
    const responseExpense = {
      ...expense,
      amount: Number(expense.amount)
    };

    res.json(responseExpense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await prisma.expense.delete({
      where: { id, userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

  return router;
}

export default createExpenseRoutes;