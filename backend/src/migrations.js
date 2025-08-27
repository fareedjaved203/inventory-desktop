export async function runMigrations(prisma) {
  try {
    console.log('Running database migrations...');
    
    // Check if ShopSettings table exists first
    let tableExists = true;
    try {
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='ShopSettings'`;
    } catch (error) {
      tableExists = false;
    }
    
    if (!tableExists) {
      console.log('ShopSettings table does not exist, skipping migration');
      return;
    }
    
    // Check and add invoiceType column
    const result = await prisma.$queryRaw`PRAGMA table_info(ShopSettings)`;
    const hasInvoiceType = result.some(column => column.name === 'invoiceType');
    
    if (!hasInvoiceType) {
      console.log('Adding invoiceType column...');
      try {
        await prisma.$executeRaw`ALTER TABLE ShopSettings ADD COLUMN invoiceType TEXT DEFAULT 'A4'`;
        console.log('✅ invoiceType column added');
        
        // Set default values for existing records
        await prisma.$executeRaw`UPDATE ShopSettings SET invoiceType = 'A4' WHERE invoiceType IS NULL OR invoiceType = ''`;
        console.log('✅ Default values set');
      } catch (alterError) {
        console.warn('Could not add invoiceType column:', alterError.message);
      }
    } else {
      // Ensure existing records have valid values
      await prisma.$executeRaw`UPDATE ShopSettings SET invoiceType = 'A4' WHERE invoiceType IS NULL OR invoiceType = ''`;
    }
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.warn('Migration warning:', error.message);
  }
}