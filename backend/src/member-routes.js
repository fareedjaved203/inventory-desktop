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
    const { name, email, phone, cnic, membershipType, duration } = req.body;
    const userId = req.userId;
    
    const expiryDate = new Date();
    if (membershipType === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + duration);
    else if (membershipType === 'quarterly') expiryDate.setMonth(expiryDate.getMonth() + (duration * 3));
    else if (membershipType === 'yearly') expiryDate.setFullYear(expiryDate.getFullYear() + duration);
    
    const member = await prisma.member.create({
      data: {
        name,
        email,
        phone,
        cnic,
        membershipType,
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
    const { name, email, phone, cnic, membershipType } = req.body;
    
    const member = await prisma.member.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        cnic,
        membershipType
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
    const { duration } = req.body;
    
    const member = await prisma.member.findUnique({ where: { id } });
    const expiryDate = new Date();
    
    if (member.membershipType === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + duration);
    else if (member.membershipType === 'quarterly') expiryDate.setMonth(expiryDate.getMonth() + (duration * 3));
    else if (member.membershipType === 'yearly') expiryDate.setFullYear(expiryDate.getFullYear() + duration);
    
    const updated = await prisma.member.update({
      where: { id },
      data: { expiryDate }
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

export default router;
