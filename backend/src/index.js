import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient, Prisma } from '@prisma/client';
import { productSchema, productUpdateSchema, querySchema } from './schemas.js';
import { setupContactRoutes } from './contact-routes.js';
import { setupSalesRoutes } from './sales-routes.js';
import { setupBulkPurchaseRoutes } from './bulk-purchase-routes.js';
import { setupDashboardRoutes } from './dashboard-routes.js';
import { setupUserRoutes } from './user-routes.js';
import { setupShopSettingsRoutes } from './shop-settings-routes.js';
import { setupReturnRoutes } from './return-routes.js';
import { setupTransportRoutes } from './transport-routes.js';
import { setupManufacturingRoutes } from './manufacturing-routes.js';
import createLoanRoutes from './loan-routes.js';
import createAuthRoutes from './auth-routes.js';
import { setupBranchRoutes } from './branch-routes.js';
import { setupEmployeeRoutes } from './employee-routes.js';
import { setupEmployeeStatsRoutes } from './employee-stats-routes.js';
import { setupSuperAdminRoutes } from './super-admin-routes.js';
import { setupSyncRoutes } from './sync-routes.js';
import { validateRequest, authenticateToken } from './middleware.js';
import licenseRoutes from './license-routes.js';
import createExpenseRoutes from './expense-routes.js';
import backupRoutes from './backup-routes.js';
import { safeQuery, createConnectionConfig } from './db-utils.js';
import { connectionCleanup, requestTimeout } from './connection-middleware.js';

dotenv.config();



// Handle Electron environment and database selection
let databaseUrl = process.env.DATABASE_URL;
let isPostgreSQL = databaseUrl?.startsWith('postgresql');

console.log('Initial Database URL:', databaseUrl);
console.log('Initial Database type:', isPostgreSQL ? 'PostgreSQL' : 'SQLite');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
let prisma;

// Initialize application with proper connection management
async function initializeApp() {
  // Set PostgreSQL URL for Electron with connection pooling
  if (process.env.ELECTRON_APP) {
    console.log('Running in Electron mode');
    const postgresUrl = process.env.DATABASE_URL;
    
    // Try PostgreSQL first with connection pooling
    try {
      process.env.DATABASE_URL = postgresUrl;
      prisma = new PrismaClient({
        ...createConnectionConfig(),
        datasources: {
          db: {
            url: postgresUrl
          }
        }
      });
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('PostgreSQL connection successful with pooling');
      isPostgreSQL = true;
    } catch (error) {
      console.error('PostgreSQL connection failed:', error);
      throw error;
    }
  } else {
    prisma = new PrismaClient(createConnectionConfig());
  }
  
  console.log('Final Database URL:', process.env.DATABASE_URL);
  console.log('Database type:', isPostgreSQL ? 'PostgreSQL' : 'SQLite');
  
  await checkAndMigrate();
}

// Start initialization
initializeApp().catch(console.error);

const port = process.env.PORT || 3000;

// PostgreSQL migrations are handled manually
async function checkAndMigrate() {
  console.log('Database setup complete - tables should be created manually');
}

// Test database connection
async function ensureDatabaseExists() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return { success: true, isPostgreSQL };
  } catch (error) {
    console.log('Database connection failed:', error.message);
    return { success: false, isPostgreSQL };
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

// Serve static files only in development or Electron mode
if (process.env.NODE_ENV !== 'production') {
  const isPackaged = process.env.ELECTRON_APP && !process.env.NODE_ENV;
  const frontendPath = isPackaged 
    ? path.join(process.env.ELECTRON_CWD, 'resources/frontend/dist')
    : path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
}

// Setup routes
setupContactRoutes(app, prisma);
setupSalesRoutes(app, prisma);
setupBulkPurchaseRoutes(app, prisma);
setupDashboardRoutes(app, prisma);
setupUserRoutes(app, prisma);
setupShopSettingsRoutes(app, prisma);
setupReturnRoutes(app, prisma);
setupTransportRoutes(app, prisma);
setupManufacturingRoutes(app, prisma);
app.use('/api/loans', createLoanRoutes(prisma));
app.use('/api/auth', createAuthRoutes(prisma));
setupBranchRoutes(app, prisma);
setupEmployeeRoutes(app, prisma);
setupEmployeeStatsRoutes(app, prisma);
setupSuperAdminRoutes(app, prisma);
setupSyncRoutes(app, prisma);

// License routes
app.use('/api/license', licenseRoutes);

// Expense routes
app.use('/api/expenses', createExpenseRoutes(prisma));

// Backup routes
app.use('/api/backup', backupRoutes);

// Get next barcode for user (optimized for performance)
app.get('/api/products/next-barcode', authenticateToken, async (req, res) => {
  try {
    // Use aggregation to get max barcode number efficiently
    const result = await prisma.product.findFirst({
      where: {
        userId: req.userId,
        sku: {
          startsWith: 'H',
          not: null
        }
      },
      select: { sku: true },
      orderBy: { sku: 'desc' }
    });

    let nextNumber = 1;
    if (result?.sku) {
      // Extract number from the highest barcode (H00001 -> 1)
      const currentNumber = parseInt(result.sku.substring(1));
      nextNumber = currentNumber + 1;
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
    const { page = 1, limit = 10, search = '', sku = '' } = req.query;

    let where = {
      userId: req.userId
    };

    // If SKU is provided, search by exact SKU match
    if (sku) {
      where.sku = sku;
    } else if (search) {
      // Regular search by name, description, or SKU (case-insensitive)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
        unitValue: item.unitValue ? Number(item.unitValue) : null,
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

// Get low stock products
app.get('/api/products/low-stock', authenticateToken, validateRequest({ query: querySchema }), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    // Get all products and filter by dynamic threshold
    const allProducts = await prisma.product.findMany({
      where: { userId: req.userId }
    });
    let lowStockProducts = allProducts.filter(product => 
      Number(product.quantity) <= Number(product.lowStockThreshold || 10)
    );
    
    // Apply search filter
    if (search) {
      lowStockProducts = lowStockProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(search.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
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
    const { page = 1, limit = 10, search = '' } = req.query;

    const where = {
      userId: req.userId,
      isRawMaterial: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
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
    const { page = 1, limit = 10 } = req.query;
    
    // Check if damagedQuantity column exists
    try {
      const where = {
        userId: req.userId,
        damagedQuantity: {
          gt: 0,
        },
      };

      const [total, items] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

      res.json({
        items: items.map(item => ({
          ...item,
          price: Number(item.price),
          quantity: Number(item.damagedQuantity || 0)
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
      quantity: Number(product.quantity)
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
      // Check for existing product with same name
      const existingProduct = await prisma.product.findFirst({
        where: { 
          name: req.body.name,
          userId: req.userId
        }
      });
      
      if (existingProduct) {
        return res.status(400).json({ error: 'Product name must be unique' });
      }
      
      const product = await prisma.product.create({
        data: {
          ...req.body,
          userId: req.userId
        },
      });
      
      // Note: Automatic expense creation removed for compatibility
      
      res.status(201).json({
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
      // Check for existing product with same name (excluding current product)
      if (req.body.name) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: req.body.name,
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
        where: { id: req.params.id, userId: req.userId }
      });
      
      const product = await prisma.product.update({
        where: { 
          id: req.params.id,
          userId: req.userId
        },
        data: req.body,
      });
      
      // Note: Automatic expense creation removed for compatibility
      
      res.json({
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
    await prisma.product.delete({
      where: { 
        id: req.params.id,
        userId: req.userId
      },
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



// Catch-all handler only in development or Electron mode
if (process.env.NODE_ENV !== 'production') {
  app.get('*', (req, res) => {
    const isPackaged = process.env.ELECTRON_APP && !process.env.NODE_ENV;
    const indexPath = isPackaged 
      ? path.join(process.env.ELECTRON_CWD, 'resources/frontend/dist/index.html')
      : path.join(__dirname, '../../frontend/dist/index.html');
    res.sendFile(indexPath);
  });
}

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

if (process.env.NODE_ENV === 'production') {
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
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple root endpoint for keep-alive
app.get('/', (req, res) => {
  console.log('Keep-alive ping received');
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});