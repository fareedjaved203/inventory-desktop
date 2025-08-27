@echo off
echo Running database migration for invoiceType...
cd backend
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function migrate() {
  try {
    const result = await prisma.$queryRaw\`PRAGMA table_info(ShopSettings)\`;
    const hasInvoiceType = result.some(column => column.name === 'invoiceType');
    if (!hasInvoiceType) {
      console.log('Adding invoiceType column...');
      await prisma.$executeRaw\`ALTER TABLE ShopSettings ADD COLUMN invoiceType TEXT DEFAULT 'A4'\`;
      console.log('✅ Column added successfully');
    } else {
      console.log('✅ Column already exists');
    }
    await prisma.$executeRaw\`UPDATE ShopSettings SET invoiceType = 'A4' WHERE invoiceType IS NULL\`;
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
migrate();
"
pause