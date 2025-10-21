-- Add image column to Product table
-- This migration adds an optional image field to store product image filenames

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN "Product"."image" IS 'Optional filename of product image stored locally';