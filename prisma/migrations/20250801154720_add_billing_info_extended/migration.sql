-- AlterTable
ALTER TABLE "BillingInfo" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'pf';
