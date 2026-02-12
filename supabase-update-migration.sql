-- ==========================================
-- MIGRATION: Add missing columns to existing tables
-- Run this if you already have tables from the old version
-- ==========================================

-- Add code column to products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'code'
    ) THEN
        ALTER TABLE products ADD COLUMN code VARCHAR(50) UNIQUE;
        -- Generate codes for existing products
        UPDATE products SET code = 'PROD-' || id::text WHERE code IS NULL;
        ALTER TABLE products ALTER COLUMN code SET NOT NULL;
    END IF;
END $$;

-- Add price_small column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price_small'
    ) THEN
        ALTER TABLE products ADD COLUMN price_small INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add commission_per_unit column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'commission_per_unit'
    ) THEN
        ALTER TABLE products ADD COLUMN commission_per_unit INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add price_wholesale column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price_wholesale'
    ) THEN
        ALTER TABLE products ADD COLUMN price_wholesale INTEGER DEFAULT 0;
    END IF;
END $$;

-- Change price column from DECIMAL to INTEGER if needed
-- Note: This might lose precision if you have decimal prices
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'price' 
        AND data_type != 'integer'
    ) THEN
        ALTER TABLE products ALTER COLUMN price TYPE INTEGER USING price::integer;
    END IF;
END $$;

-- Ensure order_number column exists in orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'order_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE;
        -- Generate order numbers for existing orders
        UPDATE orders SET order_number = 'ORD' || id::text WHERE order_number IS NULL;
    END IF;
END $$;

-- Add customer_name, customer_wa, address_full if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_wa'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_wa VARCHAR(50);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'address_full'
    ) THEN
        ALTER TABLE orders ADD COLUMN address_full TEXT;
    END IF;
END $$;

-- Add shipping_cost, status, affiliate_code if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_cost'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_cost INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'status'
    ) THEN
        ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'WAITING_CONFIRMATION';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'affiliate_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN affiliate_code VARCHAR(50);
    END IF;
END $$;

-- Add subtotal and total columns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total'
    ) THEN
        ALTER TABLE orders ADD COLUMN total INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add is_self_referral column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'is_self_referral'
    ) THEN
        ALTER TABLE orders ADD COLUMN is_self_referral BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add total_commission column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_commission'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_commission INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add resi_number and courier_name
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'resi_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN resi_number VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'courier_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN courier_name VARCHAR(100);
    END IF;
END $$;

-- Change orders.id to UUID if it's not already
-- WARNING: This is complex and might require data migration
-- Only run if you're starting fresh or have a backup
-- Uncomment if needed:
/*
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        -- Create new UUID column
        ALTER TABLE orders ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
        -- Copy data (you might need custom logic here)
        -- Drop old column and rename new one
        -- ALTER TABLE orders DROP COLUMN id;
        -- ALTER TABLE orders RENAME COLUMN id_uuid TO id;
        RAISE NOTICE 'Manual migration needed for orders.id to UUID';
    END IF;
END $$;
*/

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_wa ON orders(customer_wa);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate ON orders(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Check for any warnings or errors above.';
END $$;
