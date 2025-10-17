import { validateRequest, authenticateToken } from './middleware.js';
import { querySchema } from './schemas.js';

export function setupTransportRoutes(app, prisma) {
  // Get all transports
  app.get('/api/transport', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      let where = { userId: req.userId };

      if (search) {
        where.carNumber = {
          contains: search,
          mode: 'insensitive'
        };
      }

      const [total, items] = await Promise.all([
        prisma.transport.count({ where }),
        prisma.transport.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create transport
  app.post('/api/transport', authenticateToken, async (req, res) => {
    try {
      const { carNumber, driverName } = req.body;

      if (!carNumber) {
        return res.status(400).json({ error: 'Car number is required' });
      }

      const transport = await prisma.transport.create({
        data: {
          carNumber,
          driverName,
          userId: req.userId,
        },
      });

      res.status(201).json(transport);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update transport
  app.put('/api/transport/:id', authenticateToken, async (req, res) => {
    try {
      const { carNumber, driverName } = req.body;

      const transport = await prisma.transport.update({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
        data: { carNumber, driverName },
      });

      res.json(transport);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Transport not found' });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Delete transport
  app.delete('/api/transport/:id', authenticateToken, async (req, res) => {
    try {
      await prisma.transport.delete({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
      });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Transport not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });
}