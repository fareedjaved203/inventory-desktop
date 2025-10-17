import express from 'express';
import { validateRequest } from './middleware.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

let prisma;

// Middleware to get current user ID
const getCurrentUserId = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(4, 'Password must be at least 4 characters'),
});

const updateEmailSchema = z.object({
  currentEmail: z.string().email('Invalid email address'),
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

function createAuthRoutes(prismaInstance) {
  prisma = prismaInstance;
  const router = express.Router();
  // Check if any user exists (always allow signup now)
  router.get('/check', async (req, res) => {
    try {
      const userCount = await prisma.user.count();
      res.json({ hasUser: userCount > 0, allowSignup: true });
    } catch (error) {
      console.error('Auth check error:', error);
      res.json({ hasUser: false, allowSignup: true });
    }
  });

  // Signup (allow multiple users now)
  router.post('/signup', validateRequest({ body: signupSchema }), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with 7-day trial
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      const trialExpiry = Math.floor(trialEndDate.getTime() / 1000);

      const user = await prisma.user.create({
        data: { 
          email, 
          password: hashedPassword,
          trialEndDate
        }
      });

      // Create trial license
      console.log('Creating trial license for new user:', user.id);
      const licenseManager = (await import('../utils/licenseManager.js')).default;
      const trialResult = await licenseManager.createTrialLicense(user.id);
      console.log('Trial license creation result:', trialResult);

      // Generate JWT token for immediate login
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      // Send notification email in background
      setImmediate(async () => {
        try {
          const emailService = (await import('./email-service.js')).default;
          await emailService.sendNewUserNotification(email);
        } catch (emailError) {
          console.error('Failed to send new user notification:', emailError);
        }
      });

      res.json({ success: true, token, userId: user.id, userType: 'admin' });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  });

  // Login
  router.post('/login', validateRequest({ body: authSchema }), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // First check admin users
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (isValidPassword) {
          const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
          const userType = user.role === 'superadmin' ? 'superadmin' : 'admin';
          return res.json({ success: true, userType, token, userId: user.id });
        }
      }

      // Then check employees if admin login failed
      if (prisma.employee) {
        const employee = await prisma.employee.findFirst({
          where: { email },
          include: { branch: true }
        });

        if (employee && await bcrypt.compare(password, employee.password)) {
          // Check if admin's license is expired for employee login
          const adminUser = await prisma.user.findUnique({ where: { id: employee.userId } });
          if (adminUser && adminUser.trialEndDate && new Date() > adminUser.trialEndDate) {
            return res.status(403).json({ error: 'License expired. Please contact administrator to renew license.' });
          }
          
          const token = jwt.sign({ userId: employee.userId }, JWT_SECRET, { expiresIn: '24h' });
          return res.json({ 
            success: true, 
            userType: 'employee',
            permissions: JSON.parse(employee.permissions || '[]'),
            branch: employee.branch,
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            token,
            userId: employee.userId
          });
        }
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
      console.error('Login error:', error);
      // Ensure connection is properly handled on error
      if (error.code === 'P1001' || error.code === 'P1017') {
        console.error('Database connection issue during login');
        return res.status(503).json({ error: 'Database connection failed. Please try again.' });
      }
      res.status(500).json({ error: error.message || 'Login failed' });
    }
  });

  // Forgot Password - Send OTP
  router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({ error: 'No user found with this email' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtp: otp, otpExpiry }
      });

      console.log(`OTP for ${email}: ${otp}`);

      // Send OTP via email
      try {
        const emailService = (await import('./email-service.js')).default;
        await emailService.sendOTP(email, otp);
        res.json({ success: true, message: 'OTP sent to your email' });
      } catch (emailError) {
        console.error('Email service error:', emailError.message);
        res.json({ success: true, message: `Email service unavailable. Your OTP is: ${otp}` });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error.code === 'P1001' || error.code === 'P1017') {
        return res.status(503).json({ error: 'Database connection failed. Please try again.' });
      }
      res.status(500).json({ error: error.message || 'Failed to send OTP' });
    }
  });

  // Reset Password with OTP
  router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.resetOtp || user.resetOtp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({ error: 'OTP has expired' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          resetOtp: null,
          otpExpiry: null
        }
      });

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.code === 'P1001' || error.code === 'P1017') {
        return res.status(503).json({ error: 'Database connection failed. Please try again.' });
      }
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Update Email
  router.post('/update-email', validateRequest({ body: updateEmailSchema }), async (req, res) => {
    try {
      const { currentEmail, newEmail, password } = req.body;
      
      const user = await prisma.user.findUnique({
        where: { email: currentEmail }
      });

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!user || !isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail }
      });

      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail }
      });

      res.json({ success: true, message: 'Email updated successfully' });
    } catch (error) {
      console.error('Update email error:', error);
      if (error.code === 'P1001' || error.code === 'P1017') {
        return res.status(503).json({ error: 'Database connection failed. Please try again.' });
      }
      res.status(500).json({ error: 'Failed to update email' });
    }
  });

  return router;
}

export function setupAuthRoutes(app, prismaInstance) {
  app.use('/api/auth', createAuthRoutes(prismaInstance));
}

export default createAuthRoutes;