import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { PrismaClient, Prisma } from '@prisma/client';
import { productSchema, productUpdateSchema, querySchema } from './schemas.js';
import { setupContactRoutes } from './contact-routes.js';
import { setupSalesRoutes } from './sales-routes.js';
import { setupBulkPurchaseRoutes } from './bulk-purchase-routes.js';
import { setupDashboardRoutes } from './dashboard-routes.js';
import { setupUserRoutes } from './user-routes.js';
import { setupShopSettingsRoutes } from './shop-settings-routes.js';
import { setupReturnRoutes } from './return-routes.js';

import { setupManufacturingRoutes } from './manufacturing-routes.js';
import { setupCategoryRoutes } from './category-routes.js';
import createLoanRoutes from './loan-routes.js';
import createAuthRoutes from './auth-routes.js';
import { setupBranchRoutes } from './branch-routes.js';
import { setupEmployeeRoutes } from './employee-routes.js';
import { setupEmployeeStatsRoutes } from './employee-stats-routes.js';
import { setupSuperAdminRoutes } from './super-admin-routes.js';
import { setupSyncRoutes } from './sync-routes.js';
import { setupAuditRoutes } from './audit-routes.js';
import { setupSeedRoutes } from './seed-routes.js';
import { validateRequest, authenticateToken } from './middleware.js';
import licenseRoutes from './license-routes.js';
import createExpenseRoutes from './expense-routes.js';
import backupRoutes from './backup-routes.js';
import { safeQuery, createConnectionConfig } from './db-utils.js';
import { connectionCleanup, requestTimeout } from './connection-middleware.js';
import { runMigrations } from './migrations.js';
import { generateVariantMatrix, reconcileVariants } from './variant-utils.js';

dotenv.config();



// Handle Electron environment and database selection
let databaseUrl = process.env.DATABASE_URL;

console.log('Initial Database URL:', databaseUrl);
console.log('Database type: SQLite');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure __dirname is available globally for compatibility
if (typeof global !== 'undefined') {
  global.__dirname = __dirname;
}

const app = express();
let prisma;

// Ensure all tables and columns exist in SQLite (runs on every startup)
async function ensureSchema(prismaClient) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "password" TEXT NOT NULL, "resetOtp" TEXT, "otpExpiry" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "companyName" TEXT, "role" TEXT DEFAULT 'admin', "trialEndDate" DATETIME)`,
    `CREATE TABLE IF NOT EXISTS "License" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "licenseKey" TEXT NOT NULL, "deviceFingerprint" TEXT NOT NULL, "expiry" BIGINT NOT NULL, "duration" TEXT, "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "isTrial" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "Category" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "color" TEXT DEFAULT '#3B82F6', "icon" TEXT DEFAULT '📦', "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "Product" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT NOT NULL, "price" REAL, "purchasePrice" REAL DEFAULT 0, "perUnitPurchasePrice" REAL DEFAULT 0, "sku" TEXT, "quantity" REAL NOT NULL, "damagedQuantity" REAL NOT NULL DEFAULT 0, "lowStockThreshold" REAL NOT NULL DEFAULT 10, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "unit" TEXT NOT NULL DEFAULT 'pcs', "userId" TEXT NOT NULL, "isRawMaterial" BOOLEAN NOT NULL DEFAULT false, "retailPrice" REAL, "wholesalePrice" REAL, "unitValue" REAL, "categoryId" TEXT, "image" TEXT, CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "Contact" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "address" TEXT, "phoneNumber" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL, "contactType" TEXT NOT NULL DEFAULT 'customer')`,
    `CREATE TABLE IF NOT EXISTS "Branch" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "code" TEXT NOT NULL, "location" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "Employee" ("id" TEXT NOT NULL PRIMARY KEY, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "phone" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL, "permissions" TEXT NOT NULL, "branchId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL, CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "Sale" ("id" TEXT NOT NULL PRIMARY KEY, "billNumber" TEXT NOT NULL, "totalAmount" REAL NOT NULL, "originalTotalAmount" REAL, "discount" REAL NOT NULL DEFAULT 0, "paidAmount" REAL NOT NULL DEFAULT 0, "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "contactId" TEXT, "employeeId" TEXT, "orderBookerId" TEXT, "carNumber" TEXT, "loadingDate" DATETIME, "arrivalDate" DATETIME, "description" TEXT, "transportCost" REAL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL, CONSTRAINT "Sale_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "Sale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "Sale_orderBookerId_fkey" FOREIGN KEY ("orderBookerId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "SaleItem" ("id" TEXT NOT NULL PRIMARY KEY, "quantity" REAL NOT NULL, "price" REAL NOT NULL, "purchasePrice" REAL NOT NULL DEFAULT 0, "saleId" TEXT NOT NULL, "productId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "priceType" TEXT NOT NULL DEFAULT 'retail', CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "SaleReturn" ("id" TEXT NOT NULL PRIMARY KEY, "returnNumber" TEXT NOT NULL, "totalAmount" REAL NOT NULL, "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "reason" TEXT, "refundAmount" REAL NOT NULL DEFAULT 0, "refundPaid" BOOLEAN NOT NULL DEFAULT false, "refundDate" DATETIME, "saleId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL, CONSTRAINT "SaleReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "SaleReturnItem" ("id" TEXT NOT NULL PRIMARY KEY, "quantity" REAL NOT NULL, "price" REAL NOT NULL, "saleReturnId" TEXT NOT NULL, "productId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "SaleReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "SaleReturnItem_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "BulkPurchase" ("id" TEXT NOT NULL PRIMARY KEY, "invoiceNumber" TEXT, "totalAmount" REAL NOT NULL, "paidAmount" REAL NOT NULL, "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "description" TEXT, "contactId" TEXT NOT NULL, "carNumber" TEXT, "transportCost" REAL, "loadingDate" DATETIME, "arrivalDate" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL, "discount" REAL NOT NULL DEFAULT 0, CONSTRAINT "BulkPurchase_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "BulkPurchaseItem" ("id" TEXT NOT NULL PRIMARY KEY, "quantity" REAL NOT NULL, "purchasePrice" REAL NOT NULL, "bulkPurchaseId" TEXT NOT NULL, "productId" TEXT NOT NULL, "isTotalCostItem" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "BulkPurchaseItem_bulkPurchaseId_fkey" FOREIGN KEY ("bulkPurchaseId") REFERENCES "BulkPurchase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "BulkPurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "LoanTransaction" ("id" TEXT NOT NULL PRIMARY KEY, "amount" REAL NOT NULL, "type" TEXT NOT NULL, "description" TEXT, "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "contactId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL, CONSTRAINT "LoanTransaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "Expense" ("id" TEXT NOT NULL PRIMARY KEY, "amount" REAL NOT NULL, "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "category" TEXT NOT NULL, "description" TEXT, "paymentMethod" TEXT, "receiptNumber" TEXT, "contactId" TEXT, "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "productId" TEXT, CONSTRAINT "Expense_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "Expense_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "Recipe" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "productId" TEXT NOT NULL, "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "RecipeItem" ("id" TEXT NOT NULL PRIMARY KEY, "recipeId" TEXT NOT NULL, "rawMaterialId" TEXT NOT NULL, "quantity" REAL NOT NULL, "unit" TEXT NOT NULL DEFAULT 'pcs', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "RecipeItem_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "Manufacturing" ("id" TEXT NOT NULL PRIMARY KEY, "recipeId" TEXT NOT NULL, "quantityProduced" REAL NOT NULL, "manufacturingCost" REAL NOT NULL DEFAULT 0, "productionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "notes" TEXT, "userId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Manufacturing_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS "ShopSettings" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "shopName" TEXT NOT NULL, "shopDescription" TEXT, "shopDescription2" TEXT, "userName1" TEXT NOT NULL, "userPhone1" TEXT NOT NULL, "userName2" TEXT, "userPhone2" TEXT, "userName3" TEXT, "userPhone3" TEXT, "brand1" TEXT, "brand1Registered" BOOLEAN NOT NULL DEFAULT false, "brand2" TEXT, "brand2Registered" BOOLEAN NOT NULL DEFAULT false, "brand3" TEXT, "brand3Registered" BOOLEAN NOT NULL DEFAULT false, "logo" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, "userId" TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "DriveSettings" ("id" TEXT NOT NULL PRIMARY KEY, "serviceAccountKey" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS "AuditTrail" ("id" TEXT NOT NULL PRIMARY KEY, "tableName" TEXT NOT NULL, "recordId" TEXT NOT NULL, "fieldName" TEXT NOT NULL, "oldValue" TEXT, "newValue" TEXT, "description" TEXT, "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "changedBy" TEXT NOT NULL DEFAULT 'system', "saleId" TEXT, "purchaseId" TEXT, CONSTRAINT "AuditTrail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "AuditTrail_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "BulkPurchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  ];

  // Columns that may be missing on older DBs — SQLite ALTER TABLE ADD COLUMN is safe (no-op if exists fails gracefully)
  const alterColumns = [
    `ALTER TABLE "User" ADD COLUMN "companyName" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'admin'`,
    `ALTER TABLE "User" ADD COLUMN "trialEndDate" DATETIME`,
    `ALTER TABLE "Product" ADD COLUMN "isRawMaterial" BOOLEAN DEFAULT false`,
    `ALTER TABLE "Product" ADD COLUMN "retailPrice" REAL`,
    `ALTER TABLE "Product" ADD COLUMN "wholesalePrice" REAL`,
    `ALTER TABLE "Product" ADD COLUMN "unitValue" REAL`,
    `ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT`,
    `ALTER TABLE "Product" ADD COLUMN "image" TEXT`,
    `ALTER TABLE "Product" ADD COLUMN "damagedQuantity" REAL DEFAULT 0`,
    `ALTER TABLE "Sale" ADD COLUMN "originalTotalAmount" REAL`,
    `ALTER TABLE "Sale" ADD COLUMN "orderBookerId" TEXT`,
    `ALTER TABLE "Sale" ADD COLUMN "carNumber" TEXT`,
    `ALTER TABLE "Sale" ADD COLUMN "loadingDate" DATETIME`,
    `ALTER TABLE "Sale" ADD COLUMN "arrivalDate" DATETIME`,
    `ALTER TABLE "Sale" ADD COLUMN "description" TEXT`,
    `ALTER TABLE "Sale" ADD COLUMN "transportCost" REAL`,
    `ALTER TABLE "BulkPurchase" ADD COLUMN "discount" REAL DEFAULT 0`,
    `ALTER TABLE "BulkPurchase" ADD COLUMN "carNumber" TEXT`,
    `ALTER TABLE "BulkPurchase" ADD COLUMN "transportCost" REAL`,
    `ALTER TABLE "BulkPurchase" ADD COLUMN "loadingDate" DATETIME`,
    `ALTER TABLE "BulkPurchase" ADD COLUMN "arrivalDate" DATETIME`,
    `ALTER TABLE "BulkPurchaseItem" ADD COLUMN "isTotalCostItem" BOOLEAN DEFAULT false`,
    `ALTER TABLE "SaleItem" ADD COLUMN "priceType" TEXT DEFAULT 'retail'`,
    `ALTER TABLE "License" ADD COLUMN "duration" TEXT`,
    `ALTER TABLE "License" ADD COLUMN "isTrial" BOOLEAN DEFAULT false`,
    `ALTER TABLE "Product" ADD COLUMN "parentProductId" TEXT`,
    `ALTER TABLE "Product" ADD COLUMN "variantLabel" TEXT`,
  ];

  // Create tables
  for (const sql of tables) {
    try { await prismaClient.$executeRawUnsafe(sql); } catch (e) { /* table exists */ }
  }

  // Add missing columns
  for (const sql of alterColumns) {
    try { await prismaClient.$executeRawUnsafe(sql); } catch (e) { /* column exists — SQLite throws "duplicate column name" */ }
  }

  // Migrate License.expiry from INTEGER to BIGINT (needed for lifetime licenses)
  try {
    await prismaClient.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "License_new" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "licenseKey" TEXT NOT NULL, "deviceFingerprint" TEXT NOT NULL, "expiry" BIGINT NOT NULL, "duration" TEXT, "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "isTrial" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`);
    await prismaClient.$executeRawUnsafe(`INSERT OR IGNORE INTO "License_new" SELECT * FROM "License"`);
    await prismaClient.$executeRawUnsafe(`DROP TABLE "License"`);
    await prismaClient.$executeRawUnsafe(`ALTER TABLE "License_new" RENAME TO "License"`);
  } catch (e) { /* migration already done or table doesn't exist yet */ }

  // Create unique indexes (IF NOT EXISTS)
  const indexes = [
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "License_userId_key" ON "License"("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Sale_billNumber_key" ON "Sale"("billNumber")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "BulkPurchase_invoiceNumber_key" ON "BulkPurchase"("invoiceNumber")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SaleReturn_returnNumber_key" ON "SaleReturn"("returnNumber")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Branch_name_key" ON "Branch"("name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Branch_code_key" ON "Branch"("code")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Recipe_productId_key" ON "Recipe"("productId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Product_userId_name_key" ON "Product"("userId", "name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_key" ON "Category"("userId", "name")`,
  ];
  for (const sql of indexes) {
    try { await prismaClient.$executeRawUnsafe(sql); } catch (e) { /* index exists */ }
  }

  // Fix any text dates left by old $executeRaw inserts (convert to integer epoch ms)
  const dateCols = [
    ['Sale', 'saleDate'], ['Sale', 'createdAt'], ['Sale', 'updatedAt'],
    ['SaleItem', 'createdAt'], ['SaleItem', 'updatedAt'],
    ['SaleReturn', 'returnDate'], ['SaleReturn', 'createdAt'], ['SaleReturn', 'updatedAt'],
    ['SaleReturnItem', 'createdAt'], ['SaleReturnItem', 'updatedAt'],
    ['BulkPurchase', 'purchaseDate'], ['BulkPurchase', 'createdAt'], ['BulkPurchase', 'updatedAt'],
    ['BulkPurchaseItem', 'createdAt'], ['BulkPurchaseItem', 'updatedAt'],
    ['Expense', 'date'], ['Expense', 'createdAt'], ['Expense', 'updatedAt'],
    ['LoanTransaction', 'date'], ['LoanTransaction', 'createdAt'], ['LoanTransaction', 'updatedAt'],
    ['Manufacturing', 'productionDate'], ['Manufacturing', 'createdAt'], ['Manufacturing', 'updatedAt'],
  ];
  for (const [table, col] of dateCols) {
    try {
      await prismaClient.$executeRawUnsafe(
        `UPDATE "${table}" SET "${col}" = CAST(strftime('%s', "${col}") AS INTEGER) * 1000 WHERE typeof("${col}") = 'text' AND "${col}" IS NOT NULL`
      );
    } catch (e) { /* table/column might not exist yet */ }
  }

  console.log('Database schema verified');
}

// Initialize application with proper connection management
async function initializeApp() {
  if (process.env.ELECTRON_APP) {
    console.log('Running in Electron mode');
    const userDataPath = process.env.ELECTRON_USER_DATA;
    if (userDataPath) {
      const dbPath = path.join(userDataPath, 'inventory.db');
      process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`;
      
      // One-time migration: delete old incompatible DB from previous PostgreSQL/old-schema builds
      const migrationMarker = path.join(userDataPath, '.sqlite_v2_migrated');
      if (fs.existsSync(dbPath) && !fs.existsSync(migrationMarker)) {
        console.log('Detected old database, removing for fresh SQLite schema...');
        try {
          fs.unlinkSync(dbPath);
          // Also remove WAL/SHM files if they exist
          if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
          if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
        } catch (e) {
          console.error('Failed to remove old DB:', e.message);
        }
      }
      // Write marker so we only do this once
      if (!fs.existsSync(migrationMarker)) {
        try { fs.writeFileSync(migrationMarker, new Date().toISOString()); } catch (e) { /* ignore */ }
      }
    }
  }
  
  prisma = new PrismaClient(createConnectionConfig());
  
  try {
    await prisma.$connect();
    await ensureSchema(prisma);
    console.log('SQLite connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
  
  console.log('Final Database URL:', process.env.DATABASE_URL);
  console.log('Database type: SQLite');
}

// Start initialization with error handling
initializeApp().then(() => {
  // Setup routes AFTER prisma is initialized
  setupContactRoutes(app, prisma);
  setupSalesRoutes(app, prisma);
  setupBulkPurchaseRoutes(app, prisma);
  setupDashboardRoutes(app, prisma);
  setupUserRoutes(app, prisma);
  setupShopSettingsRoutes(app, prisma);
  setupReturnRoutes(app, prisma);
  setupManufacturingRoutes(app, prisma);
  setupCategoryRoutes(app, prisma);
  app.use('/api/loans', createLoanRoutes(prisma));
  app.use('/api/auth', createAuthRoutes(prisma));
  setupBranchRoutes(app, prisma);
  setupEmployeeRoutes(app, prisma);
  setupEmployeeStatsRoutes(app, prisma);
  setupSuperAdminRoutes(app, prisma);
  setupSyncRoutes(app, prisma);
  setupAuditRoutes(app, prisma);
  setupSeedRoutes(app, prisma);
  app.use('/api/license', licenseRoutes);
  app.use('/api/expenses', createExpenseRoutes(prisma));
  app.use('/api/backup', backupRoutes);

  // Catch-all handler for Electron SPA routing (must be LAST, after all API routes)
  if (process.env.ELECTRON_APP) {
    app.get('*', (req, res) => {
      const isPackaged = process.env.NODE_ENV === 'production';
      let indexPath;
      if (isPackaged && process.resourcesPath) {
        indexPath = path.join(process.resourcesPath, 'frontend', 'dist', 'index.html');
      } else {
        indexPath = path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
      }
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application files not found');
      }
    });
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Database type: SQLite`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  console.error('Critical initialization error:', error);
  process.exit(1);
});

const port = process.env.PORT || 3000;

// Test database connection
async function ensureDatabaseExists() {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    return { success: true };
  } catch (error) {
    console.log('Database connection failed:', error.message);
    return { success: false };
  }
}



// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
  return Number(this);
};

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://hisabghar.netlify.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Add connection management middleware
app.use(requestTimeout(30000)); // 30 second timeout

// Serve static files in Electron mode
if (process.env.ELECTRON_APP) {
  const isPackaged = process.env.NODE_ENV === 'production';
  let frontendPath;
  
  if (isPackaged && process.resourcesPath) {
    frontendPath = path.join(process.resourcesPath, 'frontend', 'dist');
  } else {
    frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  }
  
  console.log('Serving static files from:', frontendPath);
  console.log('isPackaged:', isPackaged);
  console.log('process.resourcesPath:', process.resourcesPath);
  
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
  } else {
    console.warn('Frontend path does not exist:', frontendPath);
  }
}

// Serve uploads directory for product images
let uploadsPath;
if (process.env.ELECTRON_APP) {
  // In Electron, images are stored in user data directory
  const userDataPath = process.env.ELECTRON_USER_DATA || path.join(__dirname, '..', '..');
  uploadsPath = path.join(userDataPath, 'product-images');
} else {
  uploadsPath = path.join(__dirname, '..', 'uploads');
}

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('Created uploads directory:', uploadsPath);
}

// Serve images from the correct path
if (process.env.ELECTRON_APP) {
  app.use('/api/images', express.static(uploadsPath));
  console.log('Serving Electron images from:', uploadsPath);
} else {
  app.use('/uploads', express.static(uploadsPath));
  const productImagesPath = path.join(uploadsPath, 'product-images');
  app.use('/product-images', express.static(productImagesPath));
  console.log('Serving web uploads from:', uploadsPath);
}

// Routes are registered inside initializeApp().then() above

// Member routes
// Game and members related routes removed

// Get next barcode for user (optimized for performance)
app.get('/api/products/next-barcode', authenticateToken, async (req, res) => {
  try {
    // Use aggregation to get max barcode number efficiently
    const allHBarcodes = await prisma.product.findMany({
      where: {
        userId: req.userId,
        sku: {
          startsWith: 'H',
          not: null
        }
      },
      select: { sku: true }
    });

    let nextNumber = 1;
    if (allHBarcodes.length > 0) {
      // Find the highest numeric barcode, ignoring non-numeric ones
      const maxNumber = allHBarcodes
        .map(p => parseInt(p.sku.substring(1)))
        .filter(n => !isNaN(n))
        .reduce((max, n) => Math.max(max, n), 0);
      nextNumber = maxNumber + 1;
    }

    const barcode = `H${nextNumber.toString().padStart(5, '0')}`;
    res.json({ barcode });
  } catch (error) {
    console.error('Barcode generation error:', error);
    res.status(500).json({ error: 'Failed to generate barcode' });
  }
});

// Get all products with search and pagination
app.get('/api/products', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sku = '', lowStock = false, categoryId = '', isRawMaterial, parentOnly, excludeParents } = req.query;

    let where = {
      userId: req.userId
    };

    if (sku) {
      where.sku = sku;
    } else if (search) {
      // When parentOnly + search: also include parents whose children match the search
      if (parentOnly === 'true' || parentOnly === true) {
        where.OR = [
          { name: { contains: search }, parentProductId: null },
          { description: { contains: search }, parentProductId: null },
          { sku: { contains: search }, parentProductId: null },
          // Include parents that have a child variant matching the search
          {
            parentProductId: null,
            variants: {
              some: {
                OR: [
                  { name: { contains: search } },
                  { variantLabel: { contains: search } },
                  { sku: { contains: search } },
                ]
              }
            }
          }
        ];
      } else {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { sku: { contains: search } },
        ];
      }
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isRawMaterial !== undefined) {
      where.isRawMaterial = isRawMaterial === 'true';
    }

    // parentOnly=true: return only top-level products (parentProductId is null)
    // (When search is active, parentProductId: null is already embedded in the OR conditions above)
    if (parentOnly === 'true' || parentOnly === true) {
      if (!search) {
        where.parentProductId = null;
      }
    }

    // excludeParents=true: exclude products that have child variants (for POS/sales)
    // Include child variants (parentProductId not null) OR standalone products (no children)
    if (excludeParents === 'true' || excludeParents === true) {
      const excludeParentsCondition = {
        OR: [
          { parentProductId: { not: null } },
          { variants: { none: {} }, parentProductId: null }
        ]
      };
      if (where.OR) {
        // Search OR is already set — combine with AND so both conditions apply
        const searchCondition = { OR: where.OR };
        delete where.OR;
        where.AND = [searchCondition, excludeParentsCondition];
      } else {
        where.OR = excludeParentsCondition.OR;
      }
    }

    // Include category and recipe in all fetches
    const include = {
      category: true,
      recipe: {
        include: {
          ingredients: {
            include: {
              rawMaterial: true
            }
          }
        }
      }
    };

    // When parentOnly, include variants relation for parent products
    if (parentOnly === 'true' || parentOnly === true) {
      include.variants = true;
    }

    if (lowStock === 'true' || lowStock === true) {
      // For low stock, we need to fetch all and filter in JS because of dynamic threshold
      const allItems = await prisma.product.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
      });

      const filteredItems = allItems.filter(item => 
        Number(item.quantity) <= Number(item.lowStockThreshold || 10)
      );

      const total = filteredItems.length;
      const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

      return res.json({
        items: paginatedItems.map(item => {
          const isManufactured = !!item.recipe;
          const mapped = {
            ...item,
            id: item.id.toString(),
            price: item.price ? Number(item.price) : null,
            retailPrice: item.retailPrice ? Number(item.retailPrice) : null,
            wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : null,
            purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
            perUnitPurchasePrice: item.perUnitPurchasePrice ? Number(item.perUnitPurchasePrice) : null,
            unitValue: item.unitValue ? Number(item.unitValue) : null,
            quantity: isManufactured ? null : Number(item.quantity),
            isManufactured,
            recipe: item.recipe || undefined
          };
          if ((parentOnly === 'true' || parentOnly === true) && item.variants) {
            mapped.variantCount = item.variants.length;
            mapped.totalVariantQuantity = item.variants.reduce((sum, v) => sum + Number(v.quantity || 0), 0);
          }
          return mapped;
        }),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include
      }),
    ]);

    res.json({
      items: items.map(item => {
        const isManufactured = !!item.recipe;
        const mapped = {
          ...item,
          id: item.id.toString(),
          price: item.price ? Number(item.price) : null,
          retailPrice: item.retailPrice ? Number(item.retailPrice) : null,
          wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : null,
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          perUnitPurchasePrice: item.perUnitPurchasePrice ? Number(item.perUnitPurchasePrice) : null,
          unitValue: item.unitValue ? Number(item.unitValue) : null,
          quantity: isManufactured ? null : Number(item.quantity),
          isManufactured,
          recipe: item.recipe || undefined
        };
        if ((parentOnly === 'true' || parentOnly === true) && item.variants) {
          mapped.variantCount = item.variants.length;
          mapped.totalVariantQuantity = item.variants.reduce((sum, v) => sum + Number(v.quantity || 0), 0);
        }
        return mapped;
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock products
app.get('/api/products/low-stock', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', categoryId = '' } = req.query;
    
    let where = { userId: req.userId };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
            { sku: { contains: search } },
        ];
    }

    // Get all products and filter by dynamic threshold
    const allProducts = await prisma.product.findMany({
      where,
      include: { category: true }
    });
    let lowStockProducts = allProducts.filter(product => 
      Number(product.quantity) <= Number(product.lowStockThreshold || 10)
    );
    
    // Apply pagination
    const total = lowStockProducts.length;
    const items = lowStockProducts
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
      .slice((page - 1) * limit, page * limit);

    res.json({
      items: items.map(item => ({
        ...item,
        price: item.price ? Number(item.price) : null,
        retailPrice: item.retailPrice ? Number(item.retailPrice) : null,
        wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : null,
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        perUnitPurchasePrice: item.perUnitPurchasePrice ? Number(item.perUnitPurchasePrice) : null,
        quantity: Number(item.quantity),
        lowStockThreshold: Number(item.lowStockThreshold || 10)
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get raw material products
app.get('/api/products/raw-materials', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', categoryId = '' } = req.query;

    const where = {
      userId: req.userId,
      isRawMaterial: true,
      categoryId: categoryId || undefined,
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          { sku: { contains: search } },
        ],
      } : {})
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true }
      }),
    ]);

    res.json({
      items: items.map(item => ({
        ...item,
        id: item.id.toString(),
        price: item.price ? Number(item.price) : null,
        retailPrice: item.retailPrice ? Number(item.retailPrice) : null,
        wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : null,
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        perUnitPurchasePrice: item.perUnitPurchasePrice ? Number(item.perUnitPurchasePrice) : null,
        quantity: Number(item.quantity)
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get damaged products
app.get('/api/products/damaged', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId = '', search = '' } = req.query;
    
    // Check if damagedQuantity column exists
    try {
      const where = {
        userId: req.userId,
        damagedQuantity: {
          gt: 0,
        },
        categoryId: categoryId || undefined,
      };

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { sku: { contains: search } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: { category: true }
        }),
      ]);

      res.json({
        items: items.map(item => ({
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity),
          damagedQuantity: Number(item.damagedQuantity || 0)
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (columnError) {
      // If damagedQuantity column doesn't exist, return empty result
      res.json({
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark product as damaged
app.post('/api/products/:id/damage', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;
    
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        userId: req.userId
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (quantity > product.quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    try {
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: { decrement: quantity },
          damagedQuantity: { increment: quantity }
        }
      });
      
      res.json({
        ...updatedProduct,
        price: Number(updatedProduct.price),
        quantity: Number(updatedProduct.quantity),
        damagedQuantity: Number(updatedProduct.damagedQuantity || 0)
      });
    } catch (columnError) {
      // If damagedQuantity column doesn't exist, just decrement quantity
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: { decrement: quantity }
        }
      });
      
      res.json({
        ...updatedProduct,
        price: Number(updatedProduct.price),
        quantity: Number(updatedProduct.quantity),
        damagedQuantity: 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore damaged product
app.post('/api/products/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;
    
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        userId: req.userId
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    try {
      const restoreQty = quantity || product.damagedQuantity || 0;
      
      if (restoreQty > (product.damagedQuantity || 0)) {
        return res.status(400).json({ error: 'Cannot restore more than damaged quantity' });
      }
      
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: { increment: restoreQty },
          damagedQuantity: { decrement: restoreQty }
        }
      });
      
      res.json({
        ...updatedProduct,
        price: Number(updatedProduct.price),
        quantity: Number(updatedProduct.quantity),
        damagedQuantity: Number(updatedProduct.damagedQuantity || 0)
      });
    } catch (columnError) {
      // If damagedQuantity column doesn't exist, return error
      res.status(400).json({ error: 'Damaged items feature not available' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single product
app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { 
        id: req.params.id,
        userId: req.userId
      },
      include: {
        category: true,
        variants: true,
        recipe: {
          include: {
            ingredients: {
              include: {
                rawMaterial: true
              }
            }
          }
        }
      }
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({
      ...product,
      id: product.id.toString(),
      price: product.price ? Number(product.price) : null,
      retailPrice: product.retailPrice ? Number(product.retailPrice) : null,
      wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
      purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
      perUnitPurchasePrice: product.perUnitPurchasePrice ? Number(product.perUnitPurchasePrice) : null,
      unitValue: product.unitValue ? Number(product.unitValue) : null,
      quantity: Number(product.quantity),
      variants: (product.variants || []).map(child => ({
        ...child,
        id: child.id.toString(),
        price: child.price ? Number(child.price) : null,
        retailPrice: child.retailPrice ? Number(child.retailPrice) : null,
        wholesalePrice: child.wholesalePrice ? Number(child.wholesalePrice) : null,
        purchasePrice: child.purchasePrice ? Number(child.purchasePrice) : null,
        perUnitPurchasePrice: child.perUnitPurchasePrice ? Number(child.perUnitPurchasePrice) : null,
        unitValue: child.unitValue ? Number(child.unitValue) : null,
        quantity: Number(child.quantity)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a product
app.post(
  '/api/products',
  authenticateToken,
  validateRequest({ body: productSchema }),
  async (req, res) => {
    try {
      const { sizes, colors, excludedVariants, ...productData } = req.body;
      const hasSizes = Array.isArray(sizes) && sizes.length > 0;
      const hasColors = Array.isArray(colors) && colors.length > 0;
      const excludedSet = new Set(Array.isArray(excludedVariants) ? excludedVariants : []);

      // Check for existing product with same name
      const existingProduct = await prisma.product.findFirst({
        where: { 
          name: productData.name,
          userId: req.userId
        }
      });
      
      if (existingProduct) {
        return res.status(400).json({ error: 'Product name must be unique' });
      }

      // Prevent setting parentProductId to a product that is itself a child
      if (productData.parentProductId) {
        const parentCandidate = await prisma.product.findUnique({
          where: { id: productData.parentProductId },
          select: { parentProductId: true }
        });
        if (parentCandidate?.parentProductId) {
          return res.status(400).json({ error: 'Cannot nest variants more than one level deep.' });
        }
      }

      // If no sizes/colors, create a standalone product (original behavior)
      if (!hasSizes && !hasColors) {
        const product = await prisma.product.create({
          data: {
            ...productData,
            userId: req.userId
          },
          include: { category: true }
        });

        return res.status(201).json({
          ...product,
          id: product.id.toString(),
          price: product.price ? Number(product.price) : null,
          retailPrice: product.retailPrice ? Number(product.retailPrice) : null,
          wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
          purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
          perUnitPurchasePrice: product.perUnitPurchasePrice ? Number(product.perUnitPurchasePrice) : null,
          unitValue: product.unitValue ? Number(product.unitValue) : null,
          quantity: Number(product.quantity)
        });
      }

      // Variant creation: create parent + children in a transaction
      let variantMatrix = generateVariantMatrix(productData.name, sizes, colors);

      // Filter out excluded variants (user unchecked them in the preview)
      if (excludedSet.size > 0) {
        variantMatrix = variantMatrix.filter(v => !excludedSet.has(v.variantLabel));
      }

      // If all variants were excluded, create a standalone product
      if (variantMatrix.length === 0) {
        const product = await prisma.product.create({
          data: {
            ...productData,
            userId: req.userId
          },
          include: { category: true }
        });

        return res.status(201).json({
          ...product,
          id: product.id.toString(),
          price: product.price ? Number(product.price) : null,
          retailPrice: product.retailPrice ? Number(product.retailPrice) : null,
          wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
          purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
          perUnitPurchasePrice: product.perUnitPurchasePrice ? Number(product.perUnitPurchasePrice) : null,
          unitValue: product.unitValue ? Number(product.unitValue) : null,
          quantity: Number(product.quantity)
        });
      }

      // Check for name collisions with existing products
      const variantNames = variantMatrix.map(v => v.name);
      const existingVariants = await prisma.product.findMany({
        where: {
          userId: req.userId,
          name: { in: variantNames }
        },
        select: { name: true }
      });
      if (existingVariants.length > 0) {
        return res.status(400).json({
          error: `Product name must be unique. Conflicting names: ${existingVariants.map(v => v.name).join(', ')}`
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create the parent product first
        const parent = await tx.product.create({
          data: {
            ...productData,
            userId: req.userId
          },
          include: { category: true }
        });

        // Fields inherited from parent by each child variant
        const inheritedFields = {
          userId: req.userId,
          description: productData.description,
          unit: productData.unit,
          isRawMaterial: productData.isRawMaterial,
          categoryId: productData.categoryId,
          image: productData.image,
          price: productData.price,
          retailPrice: productData.retailPrice,
          wholesalePrice: productData.wholesalePrice,
          purchasePrice: productData.purchasePrice,
          perUnitPurchasePrice: productData.perUnitPurchasePrice,
          quantity: productData.quantity,
          lowStockThreshold: productData.lowStockThreshold,
          unitValue: productData.unitValue,
        };

        // Create all child variant rows
        const children = [];
        let skuIndex = 1;
        for (const variant of variantMatrix) {
          // Generate a unique SKU for each child variant based on parent SKU
          const parentSku = productData.sku || parent.id.substring(0, 8);
          const childSku = `${parentSku}-${skuIndex}`;
          const child = await tx.product.create({
            data: {
              ...inheritedFields,
              name: variant.name,
              variantLabel: variant.variantLabel,
              parentProductId: parent.id,
              sku: childSku,
            }
          });
          children.push(child);
          skuIndex++;
        }

        return { parent, children };
      });

      res.status(201).json({
        ...result.parent,
        id: result.parent.id.toString(),
        price: result.parent.price ? Number(result.parent.price) : null,
        retailPrice: result.parent.retailPrice ? Number(result.parent.retailPrice) : null,
        wholesalePrice: result.parent.wholesalePrice ? Number(result.parent.wholesalePrice) : null,
        purchasePrice: result.parent.purchasePrice ? Number(result.parent.purchasePrice) : null,
        perUnitPurchasePrice: result.parent.perUnitPurchasePrice ? Number(result.parent.perUnitPurchasePrice) : null,
        unitValue: result.parent.unitValue ? Number(result.parent.unitValue) : null,
        quantity: Number(result.parent.quantity),
        variants: result.children.map(child => ({
          ...child,
          id: child.id.toString(),
          price: child.price ? Number(child.price) : null,
          retailPrice: child.retailPrice ? Number(child.retailPrice) : null,
          wholesalePrice: child.wholesalePrice ? Number(child.wholesalePrice) : null,
          purchasePrice: child.purchasePrice ? Number(child.purchasePrice) : null,
          perUnitPurchasePrice: child.perUnitPurchasePrice ? Number(child.perUnitPurchasePrice) : null,
          unitValue: child.unitValue ? Number(child.unitValue) : null,
          quantity: Number(child.quantity)
        }))
      });
    } catch (error) {
      console.error('Product creation error:', error);
      if (error.code === 'P2002') {
        console.error('Constraint violation details:', error.meta);
        const target = error.meta?.target;
        if (target && target.includes('name')) {
          return res.status(400).json({ error: 'Product name must be unique' });
        }
        if (target && target.includes('sku')) {
          return res.status(400).json({ error: 'SKU must be unique' });
        }
        return res.status(400).json({ error: 'Duplicate value detected' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Update a product
app.put(
  '/api/products/:id',
  authenticateToken,
  validateRequest({ body: productUpdateSchema }),
  async (req, res) => {
    try {
      const { sizes, colors, excludedVariants: excludedVariantsUpdate, ...updateData } = req.body;
      const hasSizes = Array.isArray(sizes) && sizes.length > 0;
      const hasColors = Array.isArray(colors) && colors.length > 0;
      const excludedSetUpdate = new Set(Array.isArray(excludedVariantsUpdate) ? excludedVariantsUpdate : []);

      // Check for existing product with same name (excluding current product)
      if (updateData.name) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: updateData.name,
            userId: req.userId,
            NOT: { id: req.params.id }
          }
        });
        
        if (existingProduct) {
          return res.status(400).json({ error: 'Product name must be unique' });
        }
      }
      
      // Get original product data
      const originalProduct = await prisma.product.findUnique({
        where: { id: req.params.id, userId: req.userId },
        include: { variants: true }
      });

      if (!originalProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Prevent a product that has child variants from being set as another product's child
      if (updateData.parentProductId && originalProduct.variants.length > 0) {
        return res.status(400).json({ error: 'Cannot make a parent product with existing variants into a child variant.' });
      }

      // If no sizes/colors provided, do a simple update (original behavior)
      // This also handles individual child variant updates (price, quantity, SKU, etc.)
      if (!hasSizes && !hasColors) {
        const product = await prisma.product.update({
          where: { 
            id: req.params.id,
            userId: req.userId
          },
          data: updateData,
          include: { category: true, variants: true }
        });
        
        return res.json({
          ...product,
          id: product.id.toString(),
          price: product.price ? Number(product.price) : null,
          retailPrice: product.retailPrice ? Number(product.retailPrice) : null,
          wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
          purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
          perUnitPurchasePrice: product.perUnitPurchasePrice ? Number(product.perUnitPurchasePrice) : null,
          unitValue: product.unitValue ? Number(product.unitValue) : null,
          quantity: Number(product.quantity)
        });
      }

      // Variant reconciliation path
      const newParentName = updateData.name || originalProduct.name;
      const oldParentName = originalProduct.name;

      const desiredMatrix = generateVariantMatrix(newParentName, sizes, colors);

      // Filter out excluded variants (user unchecked them in the preview)
      const filteredMatrix = excludedSetUpdate.size > 0
        ? desiredMatrix.filter(v => !excludedSetUpdate.has(v.variantLabel))
        : desiredMatrix;

      const existingVariants = originalProduct.variants.map(v => ({
        id: v.id,
        variantLabel: v.variantLabel,
        name: v.name,
      }));

      const { toCreate, toDelete, toUpdate } = reconcileVariants(
        existingVariants,
        filteredMatrix,
        newParentName,
        oldParentName
      );

      // Safety check: before deleting, check for associated records
      if (toDelete.length > 0) {
        const deleteIds = toDelete.map(v => {
          const existing = originalProduct.variants.find(ev => ev.variantLabel === v.variantLabel);
          return existing?.id;
        }).filter(Boolean);

        const [saleItems, bulkPurchaseItems, saleReturnItems] = await Promise.all([
          prisma.saleItem.findMany({
            where: { productId: { in: deleteIds } },
            select: { productId: true }
          }),
          prisma.bulkPurchaseItem.findMany({
            where: { productId: { in: deleteIds } },
            select: { productId: true }
          }),
          prisma.saleReturnItem.findMany({
            where: { productId: { in: deleteIds } },
            select: { productId: true }
          }),
        ]);

        const blockedIds = new Set([
          ...saleItems.map(i => i.productId),
          ...bulkPurchaseItems.map(i => i.productId),
          ...saleReturnItems.map(i => i.productId),
        ]);

        if (blockedIds.size > 0) {
          const blockedNames = toDelete
            .filter(v => {
              const existing = originalProduct.variants.find(ev => ev.variantLabel === v.variantLabel);
              return existing && blockedIds.has(existing.id);
            })
            .map(v => v.name);

          return res.status(400).json({
            error: `Cannot remove variants because they have associated sales, purchase, or return records: ${blockedNames.join(', ')}`
          });
        }
      }

      // Check for name collisions with new variant names
      if (toCreate.length > 0) {
        const newNames = toCreate.map(v => v.name);
        const existingWithNames = await prisma.product.findMany({
          where: {
            userId: req.userId,
            name: { in: newNames }
          },
          select: { name: true }
        });
        if (existingWithNames.length > 0) {
          return res.status(400).json({
            error: `Product name must be unique. Conflicting names: ${existingWithNames.map(v => v.name).join(', ')}`
          });
        }
      }

      // Execute all changes in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update the parent product
        const parent = await tx.product.update({
          where: { id: req.params.id, userId: req.userId },
          data: updateData,
          include: { category: true }
        });

        // Delete removed variants
        for (const variant of toDelete) {
          const existing = originalProduct.variants.find(ev => ev.variantLabel === variant.variantLabel);
          if (existing) {
            await tx.product.delete({ where: { id: existing.id } });
          }
        }

        // Update child names if parent name changed
        for (const variant of toUpdate) {
          const existing = originalProduct.variants.find(ev => ev.variantLabel === variant.variantLabel);
          if (existing) {
            await tx.product.update({
              where: { id: existing.id },
              data: { name: variant.name }
            });
          }
        }

        // Create new variants
        const inheritedFields = {
          userId: req.userId,
          description: parent.description,
          unit: parent.unit,
          isRawMaterial: parent.isRawMaterial,
          categoryId: parent.categoryId,
          image: parent.image,
          price: parent.price,
          retailPrice: parent.retailPrice,
          wholesalePrice: parent.wholesalePrice,
          purchasePrice: parent.purchasePrice,
          perUnitPurchasePrice: parent.perUnitPurchasePrice,
          quantity: parent.quantity,
          lowStockThreshold: parent.lowStockThreshold,
          unitValue: parent.unitValue,
        };

        // Determine next SKU index based on existing variants
        const existingSkuNumbers = originalProduct.variants
          .filter(v => v.sku && v.sku.startsWith(parent.sku + '-'))
          .map(v => parseInt(v.sku.split('-').pop()))
          .filter(n => !isNaN(n));
        let skuIndex = existingSkuNumbers.length > 0 ? Math.max(...existingSkuNumbers) + 1 : originalProduct.variants.length + 1;

        for (const variant of toCreate) {
          const childSku = `${parent.sku || parent.id.substring(0, 8)}-${skuIndex}`;
          await tx.product.create({
            data: {
              ...inheritedFields,
              name: variant.name,
              variantLabel: variant.variantLabel,
              parentProductId: parent.id,
              sku: childSku,
            }
          });
          skuIndex++;
        }

        // Fetch updated parent with all variants
        const updatedParent = await tx.product.findUnique({
          where: { id: parent.id },
          include: { category: true, variants: true }
        });

        return updatedParent;
      });

      res.json({
        ...result,
        id: result.id.toString(),
        price: result.price ? Number(result.price) : null,
        retailPrice: result.retailPrice ? Number(result.retailPrice) : null,
        wholesalePrice: result.wholesalePrice ? Number(result.wholesalePrice) : null,
        purchasePrice: result.purchasePrice ? Number(result.purchasePrice) : null,
        perUnitPurchasePrice: result.perUnitPurchasePrice ? Number(result.perUnitPurchasePrice) : null,
        unitValue: result.unitValue ? Number(result.unitValue) : null,
        quantity: Number(result.quantity),
        variants: result.variants.map(child => ({
          ...child,
          id: child.id.toString(),
          price: child.price ? Number(child.price) : null,
          retailPrice: child.retailPrice ? Number(child.retailPrice) : null,
          wholesalePrice: child.wholesalePrice ? Number(child.wholesalePrice) : null,
          purchasePrice: child.purchasePrice ? Number(child.purchasePrice) : null,
          perUnitPurchasePrice: child.perUnitPurchasePrice ? Number(child.perUnitPurchasePrice) : null,
          unitValue: child.unitValue ? Number(child.unitValue) : null,
          quantity: Number(child.quantity)
        }))
      });
    } catch (error) {
      console.error('Product update error:', error);
      if (error.code === 'P2002') {
        console.error('Constraint violation details:', error.meta);
        const target = error.meta?.target;
        if (target && target.includes('name')) {
          return res.status(400).json({ error: 'Product name must be unique' });
        }
        if (target && target.includes('sku')) {
          return res.status(400).json({ error: 'SKU must be unique' });
        }
        return res.status(400).json({ error: 'Duplicate value detected' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete a product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    // Fetch the product with its child variants
    const product = await prisma.product.findUnique({
      where: { id: req.params.id, userId: req.userId },
      include: { variants: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If this product has child variants, check all children for associated records
    if (product.variants.length > 0) {
      const childIds = product.variants.map(v => v.id);

      const [saleItems, bulkPurchaseItems, saleReturnItems] = await Promise.all([
        prisma.saleItem.findMany({
          where: { productId: { in: childIds } },
          select: { productId: true }
        }),
        prisma.bulkPurchaseItem.findMany({
          where: { productId: { in: childIds } },
          select: { productId: true }
        }),
        prisma.saleReturnItem.findMany({
          where: { productId: { in: childIds } },
          select: { productId: true }
        }),
      ]);

      // Build a map of blocked child IDs to their record types
      const blockedMap = new Map();
      for (const item of saleItems) {
        if (!blockedMap.has(item.productId)) blockedMap.set(item.productId, new Set());
        blockedMap.get(item.productId).add('sales');
      }
      for (const item of bulkPurchaseItems) {
        if (!blockedMap.has(item.productId)) blockedMap.set(item.productId, new Set());
        blockedMap.get(item.productId).add('purchases');
      }
      for (const item of saleReturnItems) {
        if (!blockedMap.has(item.productId)) blockedMap.set(item.productId, new Set());
        blockedMap.get(item.productId).add('returns');
      }

      if (blockedMap.size > 0) {
        const blockedDetails = product.variants
          .filter(v => blockedMap.has(v.id))
          .map(v => `${v.name} (${[...blockedMap.get(v.id)].join(', ')})`)
          .join('; ');

        return res.status(400).json({
          error: `Cannot delete product because the following variants have associated records: ${blockedDetails}`
        });
      }

      // No children have records — delete all children then parent in a transaction
      await prisma.$transaction(async (tx) => {
        for (const variant of product.variants) {
          await tx.product.delete({ where: { id: variant.id } });
        }
        await tx.product.delete({ where: { id: product.id } });
      });

      return res.status(204).send();
    }

    // If this is a child variant, check only this variant for associated records
    if (product.parentProductId) {
      const [saleItems, bulkPurchaseItems, saleReturnItems] = await Promise.all([
        prisma.saleItem.findMany({
          where: { productId: product.id },
          select: { id: true },
          take: 1,
        }),
        prisma.bulkPurchaseItem.findMany({
          where: { productId: product.id },
          select: { id: true },
          take: 1,
        }),
        prisma.saleReturnItem.findMany({
          where: { productId: product.id },
          select: { id: true },
          take: 1,
        }),
      ]);

      const recordTypes = [];
      if (saleItems.length > 0) recordTypes.push('sales');
      if (bulkPurchaseItems.length > 0) recordTypes.push('purchases');
      if (saleReturnItems.length > 0) recordTypes.push('returns');

      if (recordTypes.length > 0) {
        return res.status(400).json({
          error: `Cannot delete variant '${product.name}' because it has associated ${recordTypes.join(', ')} records.`
        });
      }

      // No associated records — delete only this child variant
      await prisma.product.delete({
        where: { id: product.id },
      });

      return res.status(204).send();
    }

    // No child variants and not a child variant — delete the standalone product directly
    await prisma.product.delete({
      where: { id: req.params.id, userId: req.userId },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'This product cannot be deleted because it is referenced in sales records. Please remove all associated sales records first.'
      });
    }
    res.status(500).json({ error: error.message });
  }
});



// Product routes and other inline handlers below use module-level `prisma` via closure

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Keep-alive removed for Electron mode
if (!process.env.ELECTRON_APP) {
  const url = process.env.RENDER_EXTERNAL_URL;
  
  setInterval(async () => {
    try {
      const response = await fetch(`${url}/health`);
      console.log('Keep-alive ping:', response.status, new Date().toISOString());
    } catch (error) {
      console.log('Keep-alive failed:', error.message);
    }
  }, 14 * 60 * 1000); // Every 14 minutes
}
// Image upload endpoint for web version
app.post('/api/products/upload-image', authenticateToken, (req, res) => {
  try {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadPath;
        if (process.env.ELECTRON_APP) {
          // In Electron, use AppData directory
          const os = require('os');
          uploadPath = path.join(os.homedir(), 'AppData', 'Roaming', 'hisab-ghar', 'product-images');
        } else {
          // Web mode - use uploads directory
          uploadPath = path.join(__dirname, '..', 'uploads', 'product-images');
        }
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const filename = `web_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, filename);
      }
    });
    
    const upload = multer({ 
      storage,
      limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
    }).single('image');
    
    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      res.json({ filename: req.file.filename });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve product images
app.get('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  let imagePath;
  
  if (process.env.ELECTRON_APP) {
    // In Electron, images are stored in a known AppData location
    const os = require('os');
    const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'hisab-ghar');
    const electronImagePath = path.join(appDataPath, 'product-images', filename);
    
    if (fs.existsSync(electronImagePath)) {
      imagePath = electronImagePath;
    } else {
      // Fallback to regular uploads directory
      const uploadsPath = path.join(__dirname, '..', 'uploads', 'product-images', filename);
      if (fs.existsSync(uploadsPath)) {
        imagePath = uploadsPath;
      }
    }
  } else {
    // Web mode - use uploads directory
    imagePath = path.join(__dirname, '..', 'uploads', 'product-images', filename);
  }
  
  if (imagePath && fs.existsSync(imagePath)) {
    console.log('Serving image from:', imagePath);
    res.sendFile(path.resolve(imagePath));
  } else {
    console.log('Image not found:', filename);
    res.status(404).json({ error: 'Image not found' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple root endpoint for keep-alive
app.get('/', (req, res) => {
  console.log('Keep-alive ping received');
  res.send('Server is running');
});
