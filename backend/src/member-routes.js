import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all members with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { filter, search, page = 1, limit = 10 } = req.query;
    const now = new Date();
    
    let where = { userId };
    
    if (filter === 'expired') {
      where.expiryDate = { lt: now };
    } else if (filter === 'active') {
      where.expiryDate = { gte: now };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cnic: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [total, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    res.json({
      items: members,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create member
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, cnic, membershipType, duration, membershipPrice, totalGames, perFrameCharge } = req.body;
    const userId = req.userId;
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    const member = await prisma.member.create({
      data: {
        name,
        email,
        phone,
        cnic,
        membershipType,
        membershipPrice: membershipPrice || 0,
        totalGames: totalGames || 0,
        remainingGames: totalGames || 0,
        perFrameCharge: perFrameCharge || 0,
        expiryDate,
        userId
      }
    });
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, cnic, membershipType, membershipPrice, totalGames, perFrameCharge } = req.body;
    
    const member = await prisma.member.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        cnic,
        membershipType,
        membershipPrice,
        totalGames,
        perFrameCharge
      }
    });
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Renew membership
router.post('/:id/renew', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({ where: { id } });
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    const updated = await prisma.member.update({
      where: { id },
      data: { 
        expiryDate,
        remainingGames: member.totalGames,
        lastResetDate: new Date()
      }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete member
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.member.delete({ where: { id } });
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active members for dropdown
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { 
        userId: req.userId,
        expiryDate: { gte: new Date() },
        isActive: true
      },
      select: { id: true, name: true, phone: true, totalGames: true, remainingGames: true, membershipType: true, perFrameCharge: true },
      orderBy: { name: 'asc' }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
