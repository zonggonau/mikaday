-- New enum values must be committed before they can be used (next migration sets the default).
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
