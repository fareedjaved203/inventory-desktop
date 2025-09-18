import express from 'express';
import { PrismaClient } from '@prisma/client';
import { tableSchema, menuCategorySchema, menuItemSchema, customerSchema, orderSchema } from './schemas.js';

const router = express.Router();
const prisma = new PrismaClient();

// Tables Management
router.get('/tables', async (req, res) => {
  try {
    const userId = req.userId;
    const tables = await prisma.table.findMany({
      where: { userId },
      orderBy: { tableNumber: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.post('/tables', async (req, res) => {
  try {
    const userId = req.userId;
    const validatedData = tableSchema.parse(req.body);
    
    const table = await prisma.table.create({
      data: {
        ...validatedData,
        userId
      }
    });
    
    res.status(201).json(table);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(400).json({ error: error.message || 'Failed to create table' });
  }
});

router.put('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const validatedData = tableSchema.parse(req.body);
    
    const table = await prisma.table.update({
      where: { id, userId },
      data: validatedData
    });
    
    res.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(400).json({ error: error.message || 'Failed to update table' });
  }
});

router.delete('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    await prisma.table.delete({
      where: { id, userId }
    });
    
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(400).json({ error: 'Failed to delete table' });
  }
});

// Menu Categories Management
router.get('/menu-categories', async (req, res) => {
  try {
    const userId = req.userId;
    const categories = await prisma.menuCategory.findMany({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    res.status(500).json({ error: 'Failed to fetch menu categories' });
  }
});

router.post('/menu-categories', async (req, res) => {
  try {
    const userId = req.userId;
    const validatedData = menuCategorySchema.parse(req.body);
    
    const category = await prisma.menuCategory.create({
      data: {
        ...validatedData,
        userId
      }
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating menu category:', error);
    res.status(400).json({ error: error.message || 'Failed to create menu category' });
  }
});

router.put('/menu-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const validatedData = menuCategorySchema.parse(req.body);
    
    const category = await prisma.menuCategory.update({
      where: { id, userId },
      data: validatedData
    });
    
    res.json(category);
  } catch (error) {
    console.error('Error updating menu category:', error);
    res.status(400).json({ error: error.message || 'Failed to update menu category' });
  }
});

router.delete('/menu-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    await prisma.menuCategory.delete({
      where: { id, userId }
    });
    
    res.json({ message: 'Menu category deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu category:', error);
    res.status(400).json({ error: 'Failed to delete menu category' });
  }
});

// Menu Items Management
router.get('/menu-items', async (req, res) => {
  try {
    const userId = req.userId;
    const menuItems = await prisma.menuItem.findMany({
      where: { userId },
      include: {
        product: true,
        category: true
      }
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

router.post('/menu-items', async (req, res) => {
  try {
    const userId = req.userId;
    const validatedData = menuItemSchema.parse(req.body);
    
    const menuItem = await prisma.menuItem.create({
      data: {
        ...validatedData,
        userId
      },
      include: {
        product: true,
        category: true
      }
    });
    
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(400).json({ error: error.message || 'Failed to create menu item' });
  }
});

router.put('/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const validatedData = menuItemSchema.parse(req.body);
    
    const menuItem = await prisma.menuItem.update({
      where: { id, userId },
      data: validatedData,
      include: {
        product: true,
        category: true
      }
    });
    
    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(400).json({ error: error.message || 'Failed to update menu item' });
  }
});

router.delete('/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    await prisma.menuItem.delete({
      where: { id, userId }
    });
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(400).json({ error: 'Failed to delete menu item' });
  }
});

// Orders Management
router.get('/orders', async (req, res) => {
  try {
    const userId = req.userId;
    const { status, orderType } = req.query;
    
    const where = { userId };
    if (status && status !== 'ALL') where.status = status;
    if (orderType && orderType !== 'ALL') where.orderType = orderType;
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const userId = req.userId;
    const validatedData = orderSchema.parse(req.body);
    
    // Generate order number
    const orderCount = await prisma.order.count({ where: { userId } });
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;
    
    // Calculate totals
    const totalAmount = validatedData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const finalAmount = totalAmount - (validatedData.discountAmount || 0) + (validatedData.taxAmount || 0);
    
    const order = await prisma.order.create({
      data: {
        ...validatedData,
        orderNumber,
        totalAmount,
        finalAmount,
        userId,
        items: {
          create: validatedData.items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ error: error.message || 'Failed to create order' });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    
    const order = await prisma.order.update({
      where: { id, userId },
      data: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ error: 'Failed to update order status' });
  }
});

// Customers Management
router.get('/customers', async (req, res) => {
  try {
    const userId = req.userId;
    const customers = await prisma.customer.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const userId = req.userId;
    const validatedData = customerSchema.parse(req.body);
    
    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        userId
      }
    });
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ error: error.message || 'Failed to create customer' });
  }
});

export default router;