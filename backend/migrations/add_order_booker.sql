-- Add orderBookerId column to Sale table
ALTER TABLE "Sale" ADD COLUMN "orderBookerId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_orderBookerId_fkey" 
  FOREIGN KEY ("orderBookerId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX "Sale_orderBookerId_idx" ON "Sale"("orderBookerId");
