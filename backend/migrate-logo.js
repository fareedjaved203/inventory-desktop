const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function migrateLogo() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking if logo column exists...');
    
    // Check if logo column already exists
    const result = await prisma.$queryRaw`PRAGMA table_info(ShopSettings)`;
    const logoColumnExists = result.some(column => column.name === 'logo');
    
    if (logoColumnExists) {
      console.log('Logo column already exists. No migration needed.');
      return;
    }
    
    console.log('Adding logo column to ShopSettings table...');
    
    // Add logo column if it doesn't exist
    await prisma.$executeRaw`ALTER TABLE ShopSettings ADD COLUMN logo TEXT`;
    
    console.log('Logo column added successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    
    // If the column already exists, SQLite will throw an error, but that's okay
    if (error.message.includes('duplicate column name')) {
      console.log('Logo column already exists. Migration completed.');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateLogo()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateLogo };