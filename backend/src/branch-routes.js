import { validateRequest, authenticateToken } from './middleware.js';
import { z } from 'zod';

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(1, "Branch code is required"),
  location: z.string().min(1, "Location is required"),
});

export function setupBranchRoutes(app, prisma) {
  // Debug route to check available models
  app.get('/api/debug/models', (req, res) => {
    const models = Object.keys(prisma).filter(key => 
      typeof prisma[key] === 'object' && 
      prisma[key] !== null && 
      typeof prisma[key].findMany === 'function'
    );
    res.json({ availableModels: models, hasBranch: !!prisma.branch, hasEmployee: !!prisma.employee });
  });
  
  // Get all branches
  app.get('/api/branches', authenticateToken, async (req, res) => {
    try {
      // Check if branch model exists
      if (!prisma.branch) {
        console.error('Branch model not found in Prisma client');
        return res.status(500).json({ error: 'Branch model not available. Please restart the server.' });
      }
      
      const branches = await prisma.branch.findMany({
        where: { userId: req.userId },
        include: {
          employees: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(branches);
    } catch (error) {
      console.error('Branch route error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create branch
  app.post('/api/branches', authenticateToken, validateRequest({ body: branchSchema }), async (req, res) => {
    try {
      if (!prisma.branch) {
        return res.status(500).json({ error: 'Branch model not available. Please restart the server.' });
      }
      
      const branch = await prisma.branch.create({
        data: {
          ...req.body,
          userId: req.userId
        },
        include: {
          employees: true
        }
      });
      res.status(201).json(branch);
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.includes('name') ? 'name' : 'code';
        return res.status(400).json({ error: `Branch ${field} must be unique` });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update branch
  app.put('/api/branches/:id', authenticateToken, validateRequest({ body: branchSchema }), async (req, res) => {
    try {
      const branch = await prisma.branch.update({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
        data: req.body,
        include: {
          employees: true
        }
      });
      res.json(branch);
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.includes('name') ? 'name' : 'code';
        return res.status(400).json({ error: `Branch ${field} must be unique` });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Delete branch
  app.delete('/api/branches/:id', authenticateToken, async (req, res) => {
    try {
      await prisma.branch.delete({
        where: { 
          id: req.params.id,
          userId: req.userId
        }
      });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Branch not found' });
      }
      if (error.code === 'P2003') {
        return res.status(400).json({ error: 'Cannot delete branch with employees' });
      }
      res.status(500).json({ error: error.message });
    }
  });
}