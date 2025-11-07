import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all tables
router.get('/tables', authenticateToken, async (req, res) => {
  try {
    const tables = await prisma.gameTable.findMany({
      where: { userId: req.userId },
      include: { bookings: { where: { checkOutTime: null }, orderBy: { checkInTime: 'desc' } } }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create table
router.post('/tables', authenticateToken, async (req, res) => {
  try {
    const { name, tableType } = req.body;
    const table = await prisma.gameTable.create({
      data: { name, tableType, userId: req.userId }
    });
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update table
router.put('/tables/:id', authenticateToken, async (req, res) => {
  try {
    const { name, tableType } = req.body;
    const table = await prisma.gameTable.update({
      where: { id: req.params.id },
      data: { name, tableType }
    });
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete table
router.delete('/tables/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.gameTable.delete({ where: { id: req.params.id } });
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-in booking
router.post('/bookings/checkin', authenticateToken, async (req, res) => {
  try {
    const { tableId, player1Name, player1Phone, player2Name, player2Phone, chargeType, charges, expectedDuration } = req.body;
    const booking = await prisma.gameBooking.create({
      data: { tableId, player1Name, player1Phone, player2Name, player2Phone, chargeType, charges, expectedDuration, userId: req.userId }
    });
    await prisma.gameTable.update({ where: { id: tableId }, data: { isAvailable: false } });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking
router.put('/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { expectedDuration } = req.body;
    const booking = await prisma.gameBooking.update({
      where: { id: req.params.id },
      data: { expectedDuration }
    });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out booking
router.post('/bookings/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const { gamesPlayed, totalAmount } = req.body;
    const booking = await prisma.gameBooking.update({
      where: { id: req.params.id },
      data: { checkOutTime: new Date(), gamesPlayed, totalAmount, isPaid: true }
    });
    await prisma.gameTable.update({ where: { id: booking.tableId }, data: { isAvailable: true } });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bookings
router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const [total, bookings] = await Promise.all([
      prisma.gameBooking.count({ where: { userId: req.userId } }),
      prisma.gameBooking.findMany({
        where: { userId: req.userId },
        include: { table: true },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { checkInTime: 'desc' }
      })
    ]);
    res.json({ items: bookings, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
