import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware.js';
import crypto from 'crypto';

const prisma = new PrismaClient();
const router = express.Router();

// Get all tables
router.get('/tables', authenticateToken, async (req, res) => {
  try {
    const tables = await prisma.gameTable.findMany({
      where: { userId: req.userId },
      include: { bookings: { where: { checkOutTime: null }, include: { refreshments: true }, orderBy: { checkInTime: 'desc' } } }
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
      data: { tableId, player1Name, player1Phone, player2Name, player2Phone, chargeType, charges, expectedDuration, userId: req.userId },
      include: { refreshments: true }
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
      data: { expectedDuration },
      include: { refreshments: true }
    });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add refreshment to booking
router.post('/bookings/:id/refreshments', authenticateToken, async (req, res) => {
  try {
    const { playerName, productId, quantity } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });
    
    const refreshment = await prisma.bookingRefreshment.create({
      data: {
        bookingId: req.params.id,
        playerName,
        productId,
        productName: product.name,
        quantity,
        price: product.retailPrice || product.price,
        totalAmount: (product.retailPrice || product.price) * quantity
      }
    });
    
    await prisma.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantity } }
    });
    
    res.json(refreshment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove refreshment from booking
router.delete('/bookings/:bookingId/refreshments/:id', authenticateToken, async (req, res) => {
  try {
    const refreshment = await prisma.bookingRefreshment.findUnique({ where: { id: req.params.id } });
    if (!refreshment) return res.status(404).json({ error: 'Refreshment not found' });
    
    await prisma.product.update({
      where: { id: refreshment.productId },
      data: { quantity: { increment: refreshment.quantity } }
    });
    
    await prisma.bookingRefreshment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Refreshment removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking refreshments
router.get('/bookings/:id/refreshments', authenticateToken, async (req, res) => {
  try {
    const refreshments = await prisma.bookingRefreshment.findMany({
      where: { bookingId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(refreshments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out booking
router.post('/bookings/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const { gamesPlayed, totalAmount } = req.body;
    
    const booking = await prisma.gameBooking.findUnique({
      where: { id: req.params.id },
      include: { refreshments: true, table: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Create sale for refreshments if any
    if (booking.refreshments.length > 0) {
      const lastSale = await prisma.sale.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
      
      let newBillNumber;
      if (lastSale?.billNumber) {
        const match = lastSale.billNumber.match(/\d+/);
        const lastNum = match ? parseInt(match[0]) : 0;
        newBillNumber = (lastNum + 1).toString();
      } else {
        newBillNumber = '1000000';
      }
      
      const refreshmentsTotal = booking.refreshments.reduce((sum, r) => sum + Number(r.totalAmount), 0);
      const saleId = crypto.randomUUID();
      const description = `Refreshments - ${booking.table.name} (${booking.player1Name}${booking.player2Name ? ` vs ${booking.player2Name}` : ''})`;
      
      // Create sale using raw SQL
      await prisma.$executeRaw`
        INSERT INTO "Sale" (id, "billNumber", "totalAmount", discount, "paidAmount", "saleDate", "userId", description, "createdAt", "updatedAt")
        VALUES (${saleId}, ${newBillNumber}, ${refreshmentsTotal}::decimal, ${0}::decimal, ${refreshmentsTotal}::decimal, NOW(), ${req.userId}, ${description}, NOW(), NOW())
      `;
      
      // Create sale items
      for (const r of booking.refreshments) {
        const itemId = crypto.randomUUID();
        const qty = Number(r.quantity);
        const price = Number(r.price);
        await prisma.$executeRaw`
          INSERT INTO "SaleItem" (id, quantity, price, "purchasePrice", "saleId", "productId", "createdAt", "updatedAt")
          VALUES (${itemId}, ${qty}::decimal, ${price}::decimal, ${0}::decimal, ${saleId}, ${r.productId}, NOW(), NOW())
        `;
      }
    }

    const updatedBooking = await prisma.gameBooking.update({
      where: { id: req.params.id },
      data: { checkOutTime: new Date(), gamesPlayed, totalAmount, isPaid: true },
      include: { refreshments: true }
    });
    
    await prisma.gameTable.update({ where: { id: booking.tableId }, data: { isAvailable: true } });
    res.json(updatedBooking);
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
        include: { table: true, refreshments: true },
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
