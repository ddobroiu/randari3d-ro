-- CreateTable
CREATE TABLE "BillingInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "city" TEXT,
    "county" TEXT,
    "email" TEXT NOT NULL,
    "cui" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingInfo_userId_key" ON "BillingInfo"("userId");

-- AddForeignKey
ALTER TABLE "BillingInfo" ADD CONSTRAINT "BillingInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
