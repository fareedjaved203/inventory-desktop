import { validateRequest, authenticateToken } from './middleware.js';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().optional().default("#3B82F6"),
  icon: z.string().optional().default("📦")
});

export function setupCategoryRoutes(app, prisma) {
  // Get all categories
  app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;

      let where = { userId: req.userId };

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive'
        };
      }

      const [total, items] = await Promise.all([
        prisma.category.count({ where }),
        prisma.category.findMany({
          where,
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { products: true }
            }
          }
        })
      ]);

      res.json({
        items,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create category
  app.post('/api/categories', authenticateToken, validateRequest({ body: categorySchema }), async (req, res) => {
    try {
      const category = await prisma.category.create({
        data: {
          ...req.body,
          userId: req.userId
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      res.status(201).json(category);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Category name must be unique' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update category
  app.put('/api/categories/:id', authenticateToken, validateRequest({ body: categorySchema }), async (req, res) => {
    try {
      const category = await prisma.category.update({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
        data: req.body,
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      res.json(category);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Category name must be unique' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Delete category
  app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
      await prisma.category.delete({
        where: { 
          id: req.params.id,
          userId: req.userId
        }
      });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get categories with products (for POS)
  app.get('/api/categories/with-products', authenticateToken, async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        where: { 
          userId: req.userId,
          products: {
            some: {
              quantity: { gt: 0 }
            }
          }
        },
        include: {
          products: {
            where: {
              quantity: { gt: 0 }
            },
            select: {
              id: true,
              name: true,
              retailPrice: true,
              wholesalePrice: true,
              quantity: true,
              unit: true,
              sku: true,
              image: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Get products without categories
      const uncategorizedProducts = await prisma.product.findMany({
        where: {
          userId: req.userId,
          quantity: { gt: 0 },
          categoryId: null
        },
        select: {
          id: true,
          name: true,
          price: true,
          retailPrice: true,
          wholesalePrice: true,
          quantity: true,
          unit: true,
          sku: true,
          image: true
        }
      });

      // Add uncategorized products as a separate category if they exist
      const result = [...categories];
      if (uncategorizedProducts.length > 0) {
        result.push({
          id: 'uncategorized',
          name: 'Other Products',
          icon: '📦',
          color: '#6B7280',
          products: uncategorizedProducts
        });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}