import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function addImageColumn() {
  try {
    console.log('Adding image column to Product table...');
    
    // Add the image column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "Product" 
      ADD COLUMN IF NOT EXISTS "image" TEXT;
    `;
    
    console.log('Image column added successfully!');
  } catch (error) {
    console.error('Error adding image column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addImageColumn();