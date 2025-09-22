import { authenticateToken } from './middleware.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  companyName: z.string().min(1, 'Company name is required'),
});

// Middleware to check super admin role
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {});
    
    const user = await req.prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: error });
  }
};

export function setupSuperAdminRoutes(app, prisma) {
  // Add prisma to request for middleware
  app.use((req, res, next) => {
    req.prisma = prisma;
    next();
  });

  // Get all users with their stats (with pagination)
  app.get('/api/super-admin/users', authenticateSuperAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'admin' },
          select: {
            id: true,
            email: true,
            companyName: true,
            trialEndDate: true,
            createdAt: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where: { role: 'admin' } })
      ]);

      const usersWithStats = await Promise.all(users.map(async (user) => {
        const [productCount, branchCount, employeeCount, salesCount, totalInventory, license] = await Promise.all([
          prisma.product.count({ where: { userId: user.id } }),
          prisma.branch.count({ where: { userId: user.id } }),
          prisma.employee.count({ where: { userId: user.id } }),
          prisma.sale.count({ where: { userId: user.id } }),
          prisma.product.aggregate({
            where: { userId: user.id },
            _sum: { quantity: true }
          }),
          prisma.license.findUnique({ where: { userId: user.id } })
        ]);

        return {
          ...user,
          licenseDuration: license?.duration,
          licenseStartDate: license?.activatedAt,
          licenseEndDate: license?.expiry ? new Date(Number(license.expiry) * 1000) : null,
          licenseType: license?.type,
          stats: {
            products: productCount,
            branches: branchCount,
            employees: employeeCount,
            sales: salesCount,
            inventory: Number(totalInventory._sum.quantity || 0)
          }
        };
      }));

      res.json({
        users: usersWithStats,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new admin user
  app.post('/api/super-admin/create-user', authenticateSuperAdmin, async (req, res) => {
    try {
      const { email, password, companyName } = createUserSchema.parse(req.body);
      
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      const user = await prisma.user.create({
        data: { 
          email, 
          password: hashedPassword,
          companyName,
          trialEndDate,
          role: 'admin'
        }
      });

      // Create trial license
      const licenseManager = (await import('../utils/licenseManager.js')).default;
      await licenseManager.createTrialLicense(user.id);

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          companyName: user.companyName,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Delete user and all associated data
  app.delete('/api/super-admin/users/:userId', authenticateSuperAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if user exists and is not a superadmin
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role === 'superadmin') {
        return res.status(403).json({ error: 'Cannot delete super admin user' });
      }

      // Delete all associated data in transaction
      await prisma.$transaction(async (tx) => {
        // Delete core tables that definitely exist
        await tx.product.deleteMany({ where: { userId } });
        await tx.employee.deleteMany({ where: { userId } });
        await tx.branch.deleteMany({ where: { userId } });
        await tx.sale.deleteMany({ where: { userId } });
        
        // Try to delete from other tables if they exist
        try {
          await tx.contact?.deleteMany({ where: { userId } });
        } catch (e) { /* Table might not exist */ }
        
        try {
          await tx.expense?.deleteMany({ where: { userId } });
        } catch (e) { /* Table might not exist */ }
        
        try {
          await tx.license?.deleteMany({ where: { userId } });
        } catch (e) { /* Table might not exist */ }
        
        // Finally delete the user
        await tx.user.delete({ where: { id: userId } });
      });

      res.json({ success: true, message: 'User and all associated data deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}