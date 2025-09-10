import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware.js';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptNumber: z.string().optional(),
  contactId: z.string().optional(),
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

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          contact: {
            select: { id: true, name: true }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.expense.count({ where })
    ]);

    // Convert BigInt amounts to numbers for JSON serialization
    const serializedExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount)
    }));

    res.json({
      items: serializedExpenses,
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

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        contactId: validatedData.contactId || null,
        userId,
      },
      include: {
        contact: {
          select: { id: true, name: true }
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

    const expense = await prisma.expense.update({
      where: { id, userId },
      data: {
        ...validatedData,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        contactId: validatedData.contactId || null,
      },
      include: {
        contact: {
          select: { id: true, name: true }
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

export default router;