import express from 'express';
import { authenticateToken } from './middleware.js';

export default function createPlayerRoutes(prisma) {
  const router = express.Router();

  router.get('/search', authenticateToken, async (req, res) => {
    try {
      const { q = '' } = req.query;
      const players = await prisma.player.findMany({
        where: {
          userId: req.userId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } }
          ]
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { name, phone } = req.body;
      const userId = req.userId;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Player name is required' });
      }
      
      const player = await prisma.player.create({
        data: { name: name.trim(), phone: phone || null, userId }
      });
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
