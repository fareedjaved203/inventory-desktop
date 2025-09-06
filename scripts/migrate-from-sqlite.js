import { PrismaClient as SqlitePrismaClient } from '@prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// SQLite client
const sqliteClient = new SqlitePrismaClient({
  datasources: {
    db: {
      url: 'file:./backend/prisma/inventory.db'
    }
  }
});

// PostgreSQL client
const postgresClient = new PostgresPrismaClient();

async function migrateData() {
  try {
    console.log('Starting data migration from SQLite to PostgreSQL...');

    // Check if SQLite database exists
    const sqliteDbPath = path.join(process.cwd(), 'backend', 'prisma', 'inventory.db');
    if (!fs.existsSync(sqliteDbPath)) {
      console.log('No SQLite database found. Skipping migration.');
      return;
    }

    // Migrate data in order (respecting foreign key constraints)
    
    // 1. Users
    const users = await sqliteClient.user.findMany();
    for (const user of users) {
      await postgresClient.user.upsert({
        where: { email: user.email },
        update: user,
        create: user
      });
    }
    console.log(`Migrated ${users.length} users`);

    // 2. Shop Settings
    const shopSettings = await sqliteClient.shopSettings.findMany();
    for (const setting of shopSettings) {
      await postgresClient.shopSettings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting
      });
    }
    console.log(`Migrated ${shopSettings.length} shop settings`);

    // 3. Branches
    const branches = await sqliteClient.branch.findMany();
    for (const branch of branches) {
      await postgresClient.branch.upsert({
        where: { id: branch.id },
        update: branch,
        create: branch
      });
    }
    console.log(`Migrated ${branches.length} branches`);

    // 4. Employees
    const employees = await sqliteClient.employee.findMany();
    for (const employee of employees) {
      await postgresClient.employee.upsert({
        where: { id: employee.id },
        update: employee,
        create: employee
      });
    }
    console.log(`Migrated ${employees.length} employees`);

    // 5. Contacts
    const contacts = await sqliteClient.contact.findMany();
    for (const contact of contacts) {
      await postgresClient.contact.upsert({
        where: { id: contact.id },
        update: contact,
        create: contact
      });
    }
    console.log(`Migrated ${contacts.length} contacts`);

    // 6. Products
    const products = await sqliteClient.product.findMany();
    for (const product of products) {
      await postgresClient.product.upsert({
        where: { id: product.id },
        update: product,
        create: product
      });
    }
    console.log(`Migrated ${products.length} products`);

    // 7. Sales
    const sales = await sqliteClient.sale.findMany();
    for (const sale of sales) {
      await postgresClient.sale.upsert({
        where: { id: sale.id },
        update: sale,
        create: sale
      });
    }
    console.log(`Migrated ${sales.length} sales`);

    // 8. Sale Items
    const saleItems = await sqliteClient.saleItem.findMany();
    for (const item of saleItems) {
      await postgresClient.saleItem.upsert({
        where: { id: item.id },
        update: item,
        create: item
      });
    }
    console.log(`Migrated ${saleItems.length} sale items`);

    // 9. Bulk Purchases
    const bulkPurchases = await sqliteClient.bulkPurchase.findMany();
    for (const purchase of bulkPurchases) {
      await postgresClient.bulkPurchase.upsert({
        where: { id: purchase.id },
        update: purchase,
        create: purchase
      });
    }
    console.log(`Migrated ${bulkPurchases.length} bulk purchases`);

    // 10. Bulk Purchase Items
    const bulkPurchaseItems = await sqliteClient.bulkPurchaseItem.findMany();
    for (const item of bulkPurchaseItems) {
      await postgresClient.bulkPurchaseItem.upsert({
        where: { id: item.id },
        update: item,
        create: item
      });
    }
    console.log(`Migrated ${bulkPurchaseItems.length} bulk purchase items`);

    // 11. Sale Returns
    const saleReturns = await sqliteClient.saleReturn.findMany();
    for (const saleReturn of saleReturns) {
      await postgresClient.saleReturn.upsert({
        where: { id: saleReturn.id },
        update: saleReturn,
        create: saleReturn
      });
    }
    console.log(`Migrated ${saleReturns.length} sale returns`);

    // 12. Sale Return Items
    const saleReturnItems = await sqliteClient.saleReturnItem.findMany();
    for (const item of saleReturnItems) {
      await postgresClient.saleReturnItem.upsert({
        where: { id: item.id },
        update: item,
        create: item
      });
    }
    console.log(`Migrated ${saleReturnItems.length} sale return items`);

    // 13. Loan Transactions
    const loanTransactions = await sqliteClient.loanTransaction.findMany();
    for (const transaction of loanTransactions) {
      await postgresClient.loanTransaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction
      });
    }
    console.log(`Migrated ${loanTransactions.length} loan transactions`);

    // 14. Drive Settings
    const driveSettings = await sqliteClient.driveSettings.findMany();
    for (const setting of driveSettings) {
      await postgresClient.driveSettings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting
      });
    }
    console.log(`Migrated ${driveSettings.length} drive settings`);

    console.log('Data migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData().catch(console.error);
}

export { migrateData };