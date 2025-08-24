const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function createDatabaseSchema(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Create all tables with the schema
      const schema = `
        -- Users table
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "username" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS "Product" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "price" REAL NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Contacts table
        CREATE TABLE IF NOT EXISTS "Contact" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "address" TEXT,
          "phoneNumber" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Sales table
        CREATE TABLE IF NOT EXISTS "Sale" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "billNumber" TEXT NOT NULL UNIQUE,
          "totalAmount" REAL NOT NULL,
          "discount" REAL NOT NULL DEFAULT 0,
          "paidAmount" REAL NOT NULL DEFAULT 0,
          "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "contactId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Sale_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );

        -- SaleItem table
        CREATE TABLE IF NOT EXISTS "SaleItem" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "saleId" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "price" REAL NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );

        -- Return table
        CREATE TABLE IF NOT EXISTS "Return" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "returnNumber" TEXT NOT NULL UNIQUE,
          "saleId" TEXT NOT NULL,
          "totalAmount" REAL NOT NULL,
          "refundAmount" REAL NOT NULL DEFAULT 0,
          "refundPaid" BOOLEAN NOT NULL DEFAULT false,
          "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Return_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );

        -- ReturnItem table
        CREATE TABLE IF NOT EXISTS "ReturnItem" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "returnId" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "price" REAL NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );

        -- BulkPurchase table
        CREATE TABLE IF NOT EXISTS "BulkPurchase" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "purchaseNumber" TEXT NOT NULL UNIQUE,
          "vendorName" TEXT NOT NULL,
          "totalAmount" REAL NOT NULL,
          "paidAmount" REAL NOT NULL DEFAULT 0,
          "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- BulkPurchaseItem table
        CREATE TABLE IF NOT EXISTS "BulkPurchaseItem" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "bulkPurchaseId" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "price" REAL NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BulkPurchaseItem_bulkPurchaseId_fkey" FOREIGN KEY ("bulkPurchaseId") REFERENCES "BulkPurchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "BulkPurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );

        -- LoanTransaction table
        CREATE TABLE IF NOT EXISTS "LoanTransaction" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "contactId" TEXT NOT NULL,
          "amount" REAL NOT NULL,
          "type" TEXT NOT NULL,
          "description" TEXT,
          "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "LoanTransaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );

        -- ShopSettings table
        CREATE TABLE IF NOT EXISTS "ShopSettings" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL,
          "shopName" TEXT NOT NULL,
          "shopDescription" TEXT,
          "shopDescription2" TEXT,
          "userName1" TEXT,
          "userPhone1" TEXT,
          "userName2" TEXT,
          "userPhone2" TEXT,
          "userName3" TEXT,
          "userPhone3" TEXT,
          "brand1" TEXT,
          "brand1Registered" BOOLEAN NOT NULL DEFAULT false,
          "brand2" TEXT,
          "brand2Registered" BOOLEAN NOT NULL DEFAULT false,
          "brand3" TEXT,
          "brand3Registered" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS "Sale_billNumber_idx" ON "Sale"("billNumber");
        CREATE INDEX IF NOT EXISTS "Sale_contactId_idx" ON "Sale"("contactId");
        CREATE INDEX IF NOT EXISTS "Sale_saleDate_idx" ON "Sale"("saleDate");
        CREATE INDEX IF NOT EXISTS "SaleItem_saleId_idx" ON "SaleItem"("saleId");
        CREATE INDEX IF NOT EXISTS "SaleItem_productId_idx" ON "SaleItem"("productId");
        CREATE INDEX IF NOT EXISTS "Return_saleId_idx" ON "Return"("saleId");
        CREATE INDEX IF NOT EXISTS "ReturnItem_returnId_idx" ON "ReturnItem"("returnId");
        CREATE INDEX IF NOT EXISTS "BulkPurchaseItem_bulkPurchaseId_idx" ON "BulkPurchaseItem"("bulkPurchaseId");
        CREATE INDEX IF NOT EXISTS "LoanTransaction_contactId_idx" ON "LoanTransaction"("contactId");
      `;

      db.exec(schema, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('Database schema created successfully');
        db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

module.exports = { createDatabaseSchema };