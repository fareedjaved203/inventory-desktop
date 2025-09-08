import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const email = 'fareedjaved203@gmail.com';
    const password = 'Admin123$';
    
    // Check if super admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('Super admin already exists');
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'superadmin',
        companyName: 'System Administration'
      }
    });
    
    console.log('Super admin created successfully:', superAdmin.email);
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();