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

  // Get all users with their stats
  app.get('/api/super-admin/users', authenticateSuperAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: { role: 'admin' },
        select: {
          id: true,
          email: true,
          companyName: true,
          trialEndDate: true,
          createdAt: true,
        }
      });

      const usersWithStats = await Promise.all(users.map(async (user) => {
        const [productCount, branchCount, employeeCount, salesCount, totalInventory] = await Promise.all([
          prisma.product.count({ where: { userId: user.id } }),
          prisma.branch.count({ where: { userId: user.id } }),
          prisma.employee.count({ where: { userId: user.id } }),
          prisma.sale.count({ where: { userId: user.id } }),
          prisma.product.aggregate({
            where: { userId: user.id },
            _sum: { quantity: true }
          })
        ]);

        return {
          ...user,
          stats: {
            products: productCount,
            branches: branchCount,
            employees: employeeCount,
            sales: salesCount,
            inventory: Number(totalInventory._sum.quantity || 0)
          }
        };
      }));

      res.json(usersWithStats);
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
}