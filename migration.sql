-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
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
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "BulkPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;