import { validateRequest, authenticateToken } from './middleware.js';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  branchId: z.string().min(1, "Branch is required"),
  permissions: z.array(z.string()).default([]),
});

const employeeUpdateSchema = employeeSchema.partial().extend({
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
});

export function setupEmployeeRoutes(app, prisma) {
  // Get all employees
  app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
      const employees = await prisma.employee.findMany({
        where: { userId: req.userId },
        include: {
          branch: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Remove password from response
      const safeEmployees = employees.map(({ password, ...employee }) => ({
        ...employee,
        permissions: JSON.parse(employee.permissions || '[]')
      }));
      
      res.json(safeEmployees);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create employee
  app.post('/api/employees', authenticateToken, validateRequest({ body: employeeSchema }), async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      
      const employee = await prisma.employee.create({
        data: {
          ...req.body,
          password: hashedPassword,
          permissions: JSON.stringify(req.body.permissions),
          userId: req.userId
        },
        include: {
          branch: true
        }
      });
      
      // Remove password from response
      const { password, ...safeEmployee } = employee;
      res.status(201).json({
        ...safeEmployee,
        permissions: JSON.parse(safeEmployee.permissions || '[]')
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'This email is already registered. Please use a different email address.' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update employee
  app.put('/api/employees/:id', authenticateToken, validateRequest({ body: employeeUpdateSchema }), async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      if (updateData.permissions) {
        updateData.permissions = JSON.stringify(updateData.permissions);
      }
      
      const employee = await prisma.employee.update({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
        data: updateData,
        include: {
          branch: true
        }
      });
      
      // Remove password from response
      const { password, ...safeEmployee } = employee;
      res.json({
        ...safeEmployee,
        permissions: JSON.parse(safeEmployee.permissions || '[]')
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'This email is already registered. Please use a different email address.' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Delete employee
  app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
    try {
      await prisma.employee.delete({
        where: { 
          id: req.params.id,
          userId: req.userId
        }
      });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.status(500).json({ error: error.message });
    }
  });
}