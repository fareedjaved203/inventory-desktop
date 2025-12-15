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
      },
      orderBy: { id: 'asc' }
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
    const { name, tableType, isAvailable } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (tableType !== undefined) updateData.tableType = tableType;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    
    const table = await prisma.gameTable.update({
      where: { id: req.params.id },
      data: updateData,
      include: { bookings: { where: { checkOutTime: null }, include: { playerBills: { where: { isPaid: false } } } } }
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
    const { tableId, memberId, member2Id, member3Id, member4Id, player1Name, player1Phone, player2Name, player2Phone, player3Name, player3Phone, player4Name, player4Phone, chargeType, charges, expectedDuration, totalPlayers } = req.body;
    
    // Save walk-in players to database
    if (!memberId && player1Name) {
      await prisma.player.create({ data: { name: player1Name, phone: player1Phone, userId: req.userId } });
    }
    if (!member2Id && player2Name) {
      await prisma.player.create({ data: { name: player2Name, phone: player2Phone, userId: req.userId } });
    }
    if (!member3Id && player3Name) {
      await prisma.player.create({ data: { name: player3Name, phone: player3Phone, userId: req.userId } });
    }
    if (!member4Id && player4Name) {
      await prisma.player.create({ data: { name: player4Name, phone: player4Phone, userId: req.userId } });
    }
    
    const framesToDeduct = totalPlayers || 1;
    let player1Charge = charges;
    let player2Charge = charges;
    
    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) return res.status(404).json({ error: 'Player 1 member not found' });
      if (member.expiryDate < new Date()) return res.status(400).json({ error: 'Player 1 membership expired. Please renew.' });
      
      if (member.perFrameCharge === 0 && member.remainingGames > 0) {
        player1Charge = 0;
      }
      else if (member.expiryDate >= new Date()) {
        player1Charge = 120;
      }
    }
    
    if (member2Id) {
      const member2 = await prisma.member.findUnique({ where: { id: member2Id } });
      if (!member2) return res.status(404).json({ error: 'Player 2 member not found' });
      if (member2.expiryDate < new Date()) return res.status(400).json({ error: 'Player 2 membership expired. Please renew.' });
      
      if (member2.perFrameCharge === 0 && member2.remainingGames > 0) {
        player2Charge = 0;
      }
      else if (member2.expiryDate >= new Date()) {
        player2Charge = 120;
      }
    }
    
    const booking = await prisma.gameBooking.create({
      data: { tableId, memberId, member2Id, player1Name, player1Phone, player2Name, player2Phone, chargeType, charges, player1Charges: player1Charge, player2Charges: player2Charge, expectedDuration, userId: req.userId },
      include: { refreshments: true, member: true, member2: true }
    });
    
    const players = [
      { memberId, name: player1Name, phone: player1Phone, charge: player1Charge },
      { memberId: member2Id, name: player2Name, phone: player2Phone, charge: player2Charge },
      { memberId: member3Id, name: player3Name, phone: player3Phone, charge: charges },
      { memberId: member4Id, name: player4Name, phone: player4Phone, charge: charges }
    ];
    
    for (const player of players) {
      if (player.name) {
        let playerCharge = player.charge;
        if (player.memberId) {
          const member = await prisma.member.findUnique({ where: { id: player.memberId } });
          if (member && member.perFrameCharge === 0 && member.remainingGames > 0) {
            playerCharge = 0;
          } else if (member && member.expiryDate >= new Date()) {
            playerCharge = member.perFrameCharge || charges;
          }
        }
        
        await prisma.playerBill.create({
          data: {
            bookingId: booking.id,
            memberId: player.memberId,
            playerName: player.name,
            playerPhone: player.phone,
            chargeType,
            chargePerGame: playerCharge,
            userId: req.userId
          }
        });
      }
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
    const { expectedDuration, lastPayerId } = req.body;
    const updateData = {};
    if (expectedDuration !== undefined) updateData.expectedDuration = expectedDuration;
    if (lastPayerId !== undefined) updateData.lastPayerId = lastPayerId;
    
    const booking = await prisma.gameBooking.update({
      where: { id: req.params.id },
      data: updateData,
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
    const { gamesPlayed, totalAmount, paymentMethod, payer } = req.body;
    
    const booking = await prisma.gameBooking.findUnique({
      where: { id: req.params.id },
      include: { refreshments: true, table: true, member: true, member2: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

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
      
      await prisma.$executeRaw`
        INSERT INTO "Sale" (id, "billNumber", "totalAmount", discount, "paidAmount", "saleDate", "userId", description, "createdAt", "updatedAt")
        VALUES (${saleId}, ${newBillNumber}, ${refreshmentsTotal}::decimal, ${0}::decimal, ${refreshmentsTotal}::decimal, NOW(), ${req.userId}, ${description}, NOW(), NOW())
      `;
      
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
      data: { checkOutTime: new Date(), gamesPlayed, totalAmount, paymentMethod: paymentMethod || 'cash', payer, isPaid: true },
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
    const { page = 1, limit = 10, playerName = '' } = req.query;
    const whereClause = { userId: req.userId };
    
    if (playerName) {
      whereClause.OR = [
        { player1Name: { contains: playerName, mode: 'insensitive' } },
        { player2Name: { contains: playerName, mode: 'insensitive' } },
        { playerBills: { some: { playerName: { contains: playerName, mode: 'insensitive' } } } }
      ];
    }
    
    const [total, bookings] = await Promise.all([
      prisma.gameBooking.count({ where: whereClause }),
      prisma.gameBooking.findMany({
        where: whereClause,
        include: { table: true, refreshments: true, member: true, member2: true, playerBills: true },
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

// Get active members
router.get('/members/active', authenticateToken, async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { userId: req.userId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get game history for booking
router.get('/bookings/:id/game-history', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.gameHistory.findMany({
      where: { bookingId: req.params.id },
      orderBy: { frameNumber: 'asc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player bills for booking
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

// Checkout player bill
router.post('/player-bills/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const { paymentMethod, totalAmount, paymentTotalAmount, paymentReceivedAmount } = req.body;
    const bill = await prisma.playerBill.findUnique({ where: { id: req.params.id } });
    if (!bill) return res.status(404).json({ error: 'Player bill not found' });
    
    const updateData = { isPaid: true, paymentMethod, totalAmount };
    if (paymentTotalAmount !== undefined) updateData.paymentTotalAmount = paymentTotalAmount;
    if (paymentReceivedAmount !== undefined) updateData.paymentReceivedAmount = paymentReceivedAmount;
    
    const updatedBill = await prisma.playerBill.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    const booking = await prisma.gameBooking.findUnique({ where: { id: bill.bookingId }, include: { playerBills: true } });
    const allPaid = booking.playerBills.every(b => b.id === req.params.id || b.isPaid);
    if (allPaid) {
      await prisma.gameTable.update({ where: { id: booking.tableId }, data: { isAvailable: true } });
    }
    
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer player bill to empty table
router.post('/bookings/transfer-to-empty', authenticateToken, async (req, res) => {
  try {
    const { tableId, playerBillId } = req.body;
    const bill = await prisma.playerBill.findUnique({ where: { id: playerBillId } });
    if (!bill) return res.status(404).json({ error: 'Player bill not found' });
    
    const booking = await prisma.gameBooking.create({
      data: {
        tableId,
        player1Name: bill.playerName,
        player1Phone: bill.playerPhone,
        chargeType: bill.chargeType,
        charges: bill.chargePerGame,
        userId: req.userId
      }
    });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer player bill to another booking
router.put('/player-bills/:id/transfer', authenticateToken, async (req, res) => {
  try {
    const { newBookingId } = req.body;
    const bill = await prisma.playerBill.update({
      where: { id: req.params.id },
      data: { bookingId: newBookingId }
    });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Switch player bills between bookings
router.put('/player-bills/switch', authenticateToken, async (req, res) => {
  try {
    const { bill1Id, bill2Id } = req.body;
    const bill1 = await prisma.playerBill.findUnique({ where: { id: bill1Id } });
    const bill2 = await prisma.playerBill.findUnique({ where: { id: bill2Id } });
    
    if (!bill1 || !bill2) return res.status(404).json({ error: 'One or both bills not found' });
    
    await prisma.playerBill.update({ where: { id: bill1Id }, data: { bookingId: bill2.bookingId } });
    await prisma.playerBill.update({ where: { id: bill2Id }, data: { bookingId: bill1.bookingId } });
    
    res.json({ message: 'Bills switched' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create player bill for booking
router.post('/bookings/:id/player-bills', authenticateToken, async (req, res) => {
  try {
    const { memberId, playerName, playerPhone, chargePerGame, chargeType } = req.body;
    const booking = await prisma.gameBooking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    const bill = await prisma.playerBill.create({
      data: {
        bookingId: req.params.id,
        memberId,
        playerName,
        playerPhone,
        chargeType,
        chargePerGame,
        userId: req.userId
      },
      include: { member: true }
    });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add game to player bill
router.post('/player-bills/:id/add-game', authenticateToken, async (req, res) => {
  try {
    const bill = await prisma.playerBill.findUnique({ where: { id: req.params.id } });
    if (!bill) return res.status(404).json({ error: 'Player bill not found' });
    
    const booking = await prisma.gameBooking.findUnique({ where: { id: bill.bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    const updatedBill = await prisma.playerBill.update({
      where: { id: req.params.id },
      data: { gamesPlayed: { increment: 1 }, totalAmount: { increment: bill.chargePerGame } }
    });
    
    await prisma.gameHistory.create({
      data: {
        bookingId: bill.bookingId,
        payerBillId: req.params.id,
        frameNumber: (await prisma.gameHistory.count({ where: { bookingId: bill.bookingId } })) + 1,
        amount: bill.chargePerGame,
        paymentMethod: 'cash'
      }
    });
    
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
