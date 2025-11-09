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
      include: { 
        bookings: { 
          where: { checkOutTime: null }, 
          include: { 
            refreshments: true, 
            member: true, 
            member2: true,
            playerBills: { where: { isPaid: false }, include: { member: true } }
          }, 
          orderBy: { checkInTime: 'desc' } 
        } 
      }
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
    const { tableId, memberId, member2Id, player1Name, player1Phone, player2Name, player2Phone, chargeType, charges, player1Charges, player2Charges, expectedDuration, totalPlayers } = req.body;
    
    const framesToDeduct = totalPlayers || 1;
    
    // Validate members at check-in
    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) return res.status(404).json({ error: 'Player 1 member not found' });
      if (member.expiryDate < new Date()) return res.status(400).json({ error: 'Player 1 membership expired. Please renew.' });
      if (member.totalGames > 0 && member.remainingGames <= 0) {
        return res.status(400).json({ error: 'Player 1 has no games remaining. Please renew membership.' });
      }
    }
    
    if (member2Id) {
      const member2 = await prisma.member.findUnique({ where: { id: member2Id } });
      if (!member2) return res.status(404).json({ error: 'Player 2 member not found' });
      if (member2.expiryDate < new Date()) return res.status(400).json({ error: 'Player 2 membership expired. Please renew.' });
      if (member2.totalGames > 0 && member2.remainingGames <= 0) {
        return res.status(400).json({ error: 'Player 2 has no games remaining. Please renew membership.' });
      }
    }
    
    const booking = await prisma.gameBooking.create({
      data: { tableId, memberId, member2Id, player1Name, player1Phone, player2Name, player2Phone, chargeType, charges, player1Charges: player1Charges || 0, player2Charges: player2Charges || 0, expectedDuration, userId: req.userId },
      include: { refreshments: true, member: true, member2: true }
    });
    
    // Create player bills
    await prisma.playerBill.create({
      data: {
        bookingId: booking.id,
        memberId,
        playerName: player1Name,
        playerPhone: player1Phone,
        chargeType,
        chargePerGame: player1Charges || 0,
        userId: req.userId
      }
    });
    
    if (player2Name) {
      await prisma.playerBill.create({
        data: {
          bookingId: booking.id,
          memberId: member2Id,
          playerName: player2Name,
          playerPhone: player2Phone,
          chargeType,
          chargePerGame: player2Charges || 0,
          userId: req.userId
        }
      });
    }
    
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
    const { playerName, playerBillId, productId, quantity } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });
    
    const refreshment = await prisma.bookingRefreshment.create({
      data: {
        bookingId: req.params.id,
        playerName,
        playerBillId,
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
    const { gamesPlayed, totalAmount, paymentMethod } = req.body;
    
    const booking = await prisma.gameBooking.findUnique({
      where: { id: req.params.id },
      include: { refreshments: true, table: true, member: true, member2: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    // Deduct games from members if gamesPlayed > 0
    if (gamesPlayed && gamesPlayed > 0) {
      if (booking.memberId && booking.member && booking.member.totalGames > 0) {
        const newRemaining = Math.max(0, booking.member.remainingGames - gamesPlayed);
        await prisma.member.update({
          where: { id: booking.memberId },
          data: { remainingGames: newRemaining }
        });
      }
      if (booking.member2Id && booking.member2 && booking.member2.totalGames > 0) {
        const newRemaining = Math.max(0, booking.member2.remainingGames - gamesPlayed);
        await prisma.member.update({
          where: { id: booking.member2Id },
          data: { remainingGames: newRemaining }
        });
      }
    }

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
      data: { checkOutTime: new Date(), gamesPlayed, totalAmount, paymentMethod: paymentMethod || 'cash', isPaid: true },
      include: { refreshments: true }
    });
    
    await prisma.gameTable.update({ where: { id: booking.tableId }, data: { isAvailable: true } });
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer booking to another table
router.put('/bookings/:id/transfer', authenticateToken, async (req, res) => {
  try {
    const { newTableId } = req.body;
    const booking = await prisma.gameBooking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    const newTable = await prisma.gameTable.findUnique({ where: { id: newTableId } });
    if (!newTable || !newTable.isAvailable) return res.status(400).json({ error: 'Table not available' });
    
    await prisma.gameTable.update({ where: { id: booking.tableId }, data: { isAvailable: true } });
    await prisma.gameTable.update({ where: { id: newTableId }, data: { isAvailable: false } });
    
    const updatedBooking = await prisma.gameBooking.update({
      where: { id: req.params.id },
      data: { tableId: newTableId },
      include: { refreshments: true, member: true, member2: true }
    });
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new player to existing booking
router.post('/player-bills', authenticateToken, async (req, res) => {
  try {
    const { bookingId, memberId, playerName, playerPhone, chargePerGame, chargeType } = req.body;
    
    const newBill = await prisma.playerBill.create({
      data: {
        bookingId,
        memberId,
        playerName,
        playerPhone,
        chargeType: chargeType || 'per_game',
        chargePerGame: chargePerGame || 0,
        userId: req.userId
      },
      include: { member: true, refreshments: true }
    });
    
    res.json(newBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player bills for a booking
router.get('/bookings/:id/player-bills', authenticateToken, async (req, res) => {
  try {
    const bills = await prisma.playerBill.findMany({
      where: { bookingId: req.params.id },
      include: { member: true, refreshments: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Checkout individual player (1 game)
router.post('/player-bills/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const bill = await prisma.playerBill.findUnique({
      where: { id: req.params.id },
      include: { member: true, refreshments: true, booking: { include: { table: true } } }
    });
    
    if (!bill) return res.status(404).json({ error: 'Player bill not found' });
    if (bill.isPaid) return res.status(400).json({ error: 'Bill already paid' });
    
    const gamesPlayed = 1;
    let totalAmount = Number(bill.chargePerGame);
    
    // Deduct 1 game from member if applicable
    if (bill.memberId && bill.member && bill.member.totalGames > 0) {
      const newRemaining = Math.max(0, bill.member.remainingGames - 1);
      await prisma.member.update({
        where: { id: bill.memberId },
        data: { remainingGames: newRemaining }
      });
    }
    
    // Create sale for refreshments if any
    if (bill.refreshments.length > 0) {
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
      
      const refreshmentsTotal = bill.refreshments.reduce((sum, r) => sum + Number(r.totalAmount), 0);
      const saleId = crypto.randomUUID();
      const description = `Refreshments - ${bill.booking.table.name} (${bill.playerName})`;
      
      await prisma.$executeRaw`
        INSERT INTO "Sale" (id, "billNumber", "totalAmount", discount, "paidAmount", "saleDate", "userId", description, "createdAt", "updatedAt")
        VALUES (${saleId}, ${newBillNumber}, ${refreshmentsTotal}::decimal, ${0}::decimal, ${refreshmentsTotal}::decimal, NOW(), ${req.userId}, ${description}, NOW(), NOW())
      `;
      
      for (const r of bill.refreshments) {
        const itemId = crypto.randomUUID();
        const qty = Number(r.quantity);
        const price = Number(r.price);
        await prisma.$executeRaw`
          INSERT INTO "SaleItem" (id, quantity, price, "purchasePrice", "saleId", "productId", "createdAt", "updatedAt")
          VALUES (${itemId}, ${qty}::decimal, ${price}::decimal, ${0}::decimal, ${saleId}, ${r.productId}, NOW(), NOW())
        `;
      }
    }
    
    const updatedBill = await prisma.playerBill.update({
      where: { id: req.params.id },
      data: { isPaid: true, gamesPlayed, totalAmount, checkoutTime: new Date(), paymentMethod: paymentMethod || 'cash' },
      include: { member: true, refreshments: true }
    });
    
    // Check if all players checked out, then free the table
    const allBills = await prisma.playerBill.findMany({ where: { bookingId: bill.bookingId } });
    const allPaid = allBills.every(b => b.isPaid);
    if (allPaid) {
      await prisma.gameTable.update({ where: { id: bill.booking.tableId }, data: { isAvailable: true } });
      await prisma.gameBooking.update({ where: { id: bill.bookingId }, data: { checkOutTime: new Date() } });
    }
    
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer player to another booking/table
router.put('/player-bills/:id/transfer', authenticateToken, async (req, res) => {
  try {
    const { newBookingId } = req.body;
    const bill = await prisma.playerBill.findUnique({ 
      where: { id: req.params.id },
      include: { refreshments: true }
    });
    
    if (!bill) return res.status(404).json({ error: 'Player bill not found' });
    if (bill.isPaid) return res.status(400).json({ error: 'Cannot transfer paid bill' });
    
    // Update player bill
    const updatedBill = await prisma.playerBill.update({
      where: { id: req.params.id },
      data: { bookingId: newBookingId },
      include: { member: true, refreshments: true }
    });
    
    // Transfer refreshments to new booking
    if (bill.refreshments.length > 0) {
      await prisma.bookingRefreshment.updateMany({
        where: { playerBillId: req.params.id },
        data: { bookingId: newBookingId }
      });
    }
    
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add game charge to player bill (loser pays)
router.post('/player-bills/:id/add-game', authenticateToken, async (req, res) => {
  try {
    const bill = await prisma.playerBill.findUnique({
      where: { id: req.params.id },
      include: { member: true }
    });
    
    if (!bill) return res.status(404).json({ error: 'Player bill not found' });
    if (bill.isPaid) return res.status(400).json({ error: 'Bill already paid' });
    
    const newGamesPlayed = bill.gamesPlayed + 1;
    const newTotalAmount = Number(bill.totalAmount) + Number(bill.chargePerGame);
    
    // Deduct 1 game from member if applicable
    if (bill.memberId && bill.member && bill.member.totalGames > 0) {
      const newRemaining = Math.max(0, bill.member.remainingGames - 1);
      await prisma.member.update({
        where: { id: bill.memberId },
        data: { remainingGames: newRemaining }
      });
    }
    
    const updatedBill = await prisma.playerBill.update({
      where: { id: req.params.id },
      data: { gamesPlayed: newGamesPlayed, totalAmount: newTotalAmount },
      include: { member: true, refreshments: true }
    });
    
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Continue playing (create new bill for same player)
router.post('/player-bills/:id/continue', authenticateToken, async (req, res) => {
  try {
    const oldBill = await prisma.playerBill.findUnique({
      where: { id: req.params.id },
      include: { booking: true }
    });
    
    if (!oldBill) return res.status(404).json({ error: 'Player bill not found' });
    if (!oldBill.isPaid) return res.status(400).json({ error: 'Bill not paid yet' });
    
    // Create new bill for continued play
    const newBill = await prisma.playerBill.create({
      data: {
        bookingId: oldBill.bookingId,
        memberId: oldBill.memberId,
        playerName: oldBill.playerName,
        playerPhone: oldBill.playerPhone,
        chargeType: oldBill.chargeType,
        chargePerGame: oldBill.chargePerGame,
        userId: req.userId
      },
      include: { member: true, refreshments: true }
    });
    
    res.json(newBill);
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
        include: { table: true, refreshments: true, member: true, member2: true },
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
