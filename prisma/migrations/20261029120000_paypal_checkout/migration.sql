-- Replace Snipcart with PayPal checkout.

-- DropIndex
DROP INDEX "Order_snipcartToken_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "snipcartToken",
ADD COLUMN     "number" SERIAL NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentCaptureId" TEXT,
ADD COLUMN     "paymentOrderId" TEXT,
ADD COLUMN     "paymentProvider" TEXT NOT NULL DEFAULT 'paypal',
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentOrderId_key" ON "Order"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentCaptureId_key" ON "Order"("paymentCaptureId");
