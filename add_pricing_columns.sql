-- Add retail and wholesale price columns to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "retailPrice" BIGINT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "wholesalePrice" BIGINT;

-- Add price type column to SaleItem table
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "priceType" TEXT NOT NULL DEFAULT 'retail';