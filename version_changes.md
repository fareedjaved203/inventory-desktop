# 5.10.7:

-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL DEFAULT 'system',
    "saleId" TEXT,
    "purchaseId" TEXT,
    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditTrail_tableName_recordId_idx" ON "AuditTrail"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "AuditTrail_changedAt_idx" ON "AuditTrail"("changedAt");

-- CreateIndex
CREATE INDEX "AuditTrail_saleId_idx" ON "AuditTrail"("saleId");

-- CreateIndex
CREATE INDEX "AuditTrail_purchaseId_idx" ON "AuditTrail"("purchaseId");

-- AddForeignKey
ALTER TABLE "AuditTrail"
ADD CONSTRAINT "AuditTrail_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail"
ADD CONSTRAINT "AuditTrail_purchaseId_fkey"
FOREIGN KEY ("purchaseId") REFERENCES "BulkPurchase"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
 

# 5.10.8:

- ALTER TABLE "BulkPurchase" ADD COLUMN "description" TEXT;

# 5.10.9:

-- Create Member table
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "cnic" TEXT,
    "membershipType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX "Member_userId_idx" ON "Member"("userId");
CREATE INDEX "Member_userId_expiryDate_idx" ON "Member"("userId", "expiryDate");
CREATE INDEX "Member_userId_isActive_idx" ON "Member"("userId", "isActive");

-- Create GameTable
CREATE TABLE "GameTable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableType" TEXT NOT NULL DEFAULT 'snooker',
    "chargeType" TEXT NOT NULL,
    "charges" DECIMAL(65,30) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameTable_pkey" PRIMARY KEY ("id")
);

-- Create GameBooking
CREATE TABLE "GameBooking" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "player1Name" TEXT NOT NULL,
    "player1Phone" TEXT,
    "player2Name" TEXT,
    "player2Phone" TEXT,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "gamesPlayed" INTEGER DEFAULT 0,
    "totalAmount" DECIMAL(65,30) DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameBooking_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "GameTable_userId_idx" ON "GameTable"("userId");
CREATE INDEX "GameTable_userId_isAvailable_idx" ON "GameTable"("userId", "isAvailable");
CREATE INDEX "GameBooking_userId_idx" ON "GameBooking"("userId");
CREATE INDEX "GameBooking_tableId_idx" ON "GameBooking"("tableId");
CREATE INDEX "GameBooking_userId_checkInTime_idx" ON "GameBooking"("userId", "checkInTime");

-- Add foreign key (will be updated later to CASCADE)
ALTER TABLE "GameBooking" ADD CONSTRAINT "GameBooking_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "GameTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove charge fields from GameTable
ALTER TABLE "GameTable" DROP COLUMN "chargeType";
ALTER TABLE "GameTable" DROP COLUMN "charges";

-- Add charge fields to GameBooking
ALTER TABLE "GameBooking" ADD COLUMN "chargeType" TEXT NOT NULL DEFAULT 'per_hour';
ALTER TABLE "GameBooking" ADD COLUMN "charges" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "GameBooking" ADD COLUMN "expectedDuration" TEXT;

-- Create BookingRefreshment table
CREATE TABLE "BookingRefreshment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRefreshment_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX "BookingRefreshment_bookingId_idx" ON "BookingRefreshment"("bookingId");
CREATE INDEX "BookingRefreshment_bookingId_playerName_idx" ON "BookingRefreshment"("bookingId", "playerName");

-- Add foreign key constraints
ALTER TABLE "BookingRefreshment" ADD CONSTRAINT "BookingRefreshment_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "GameBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingRefreshment" ADD CONSTRAINT "BookingRefreshment_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add membership tier fields to Member table
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membershipPrice" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "totalGames" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "remainingGames" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "perFrameCharge" DECIMAL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "lastResetDate" TIMESTAMP NOT NULL DEFAULT NOW();

-- Add memberId and member2Id to GameBooking table
ALTER TABLE "GameBooking" ADD COLUMN IF NOT EXISTS "memberId" TEXT;
ALTER TABLE "GameBooking" ADD COLUMN IF NOT EXISTS "member2Id" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "GameBooking_memberId_idx" ON "GameBooking"("memberId");
CREATE INDEX IF NOT EXISTS "GameBooking_member2Id_idx" ON "GameBooking"("member2Id");

-- Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'GameBooking_memberId_fkey'
    ) THEN
        ALTER TABLE "GameBooking" 
        ADD CONSTRAINT "GameBooking_memberId_fkey" 
        FOREIGN KEY ("memberId") REFERENCES "Member"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'GameBooking_member2Id_fkey'
    ) THEN
        ALTER TABLE "GameBooking" 
        ADD CONSTRAINT "GameBooking_member2Id_fkey" 
        FOREIGN KEY ("member2Id") REFERENCES "Member"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

ALTER TABLE "GameBooking" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'cash';

UPDATE "Member" 
SET "remainingGames" = "totalGames" 
WHERE "totalGames" > 0;

-- Add per-player charge fields
ALTER TABLE "GameBooking" ADD COLUMN IF NOT EXISTS "player1Charges" DECIMAL DEFAULT 0;
ALTER TABLE "GameBooking" ADD COLUMN IF NOT EXISTS "player2Charges" DECIMAL DEFAULT 0;

-- Create PlayerBill table for individual player billing
CREATE TABLE IF NOT EXISTS "PlayerBill" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "memberId" TEXT,
    "playerName" TEXT NOT NULL,
    "playerPhone" TEXT,
    "chargeType" TEXT NOT NULL,
    "chargePerGame" DECIMAL NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "checkoutTime" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerBill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlayerBill_bookingId_idx" ON "PlayerBill"("bookingId");
CREATE INDEX IF NOT EXISTS "PlayerBill_memberId_idx" ON "PlayerBill"("memberId");
CREATE INDEX IF NOT EXISTS "PlayerBill_userId_idx" ON "PlayerBill"("userId");
CREATE INDEX IF NOT EXISTS "PlayerBill_isPaid_idx" ON "PlayerBill"("isPaid");

ALTER TABLE "PlayerBill" 
ADD CONSTRAINT "PlayerBill_bookingId_fkey" 
FOREIGN KEY ("bookingId") REFERENCES "GameBooking"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlayerBill" 
ADD CONSTRAINT "PlayerBill_memberId_fkey" 
FOREIGN KEY ("memberId") REFERENCES "Member"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BookingRefreshment" ADD COLUMN IF NOT EXISTS "playerBillId" TEXT;
CREATE INDEX IF NOT EXISTS "BookingRefreshment_playerBillId_idx" ON "BookingRefreshment"("playerBillId");
ALTER TABLE "BookingRefreshment" 
ADD CONSTRAINT "BookingRefreshment_playerBillId_fkey" 
FOREIGN KEY ("playerBillId") REFERENCES "PlayerBill"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix table deletion cascade
ALTER TABLE "GameBooking" DROP CONSTRAINT IF EXISTS "GameBooking_tableId_fkey";
ALTER TABLE "GameBooking" 
ADD CONSTRAINT "GameBooking_tableId_fkey" 
FOREIGN KEY ("tableId") REFERENCES "GameTable"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;