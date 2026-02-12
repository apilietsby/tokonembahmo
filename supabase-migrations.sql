-- ==========================================
-- TOKONEMBAHMO V2 - COMPLETE DATABASE SCHEMA
-- ==========================================

-- A. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    price_small INTEGER DEFAULT 0,
    commission_per_unit INTEGER DEFAULT 0,
    price_wholesale INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sku VARCHAR(100),
    variants JSONB,
    default_tiktok_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B. AFFILIATES TABLE
CREATE TABLE IF NOT EXISTS affiliates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100),
    bank_account VARCHAR(100),
    bank_holder_name VARCHAR(255),
    current_balance INTEGER DEFAULT 0,
    total_commission_earned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- C. CUSTOMER BINDINGS TABLE (90 Days Lock)
CREATE TABLE IF NOT EXISTS customer_bindings (
    id SERIAL PRIMARY KEY,
    customer_wa VARCHAR(50) NOT NULL,
    affiliate_code VARCHAR(50) NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_wa),
    FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE CASCADE
);

-- D. ORDERS TABLE (Main Transactions)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_wa VARCHAR(50) NOT NULL,
    address_full TEXT NOT NULL,
    shipping_cost INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'WAITING_CONFIRMATION',
    affiliate_code VARCHAR(50),
    total_commission INTEGER DEFAULT 0,
    resi_number VARCHAR(100),
    courier_name VARCHAR(100),
    is_self_referral BOOLEAN DEFAULT FALSE,
    subtotal INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE SET NULL
);

-- E. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_per_unit INTEGER NOT NULL,
    is_wholesale BOOLEAN DEFAULT FALSE,
    commission_per_item INTEGER DEFAULT 0,
    total_price INTEGER NOT NULL,
    total_commission INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    -- Note: Removed FK constraint on product_code to allow flexible product entries
);

-- F. AFFILIATE LINKS TABLE (For Custom TikTok URLs)
CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_code VARCHAR(50) NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    custom_tiktok_url TEXT,
    referral_code VARCHAR(100) UNIQUE NOT NULL,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(affiliate_code, product_code),
    FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE CASCADE,
    FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE
);

-- G. PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_code VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'REQUESTED',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_date TIMESTAMP,
    proof_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE CASCADE
);

-- H. NOTIFICATIONS TABLE (For tracking WA messages)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    recipient_wa VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_wa ON orders(customer_wa);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate ON orders(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_customer_bindings_wa ON customer_bindings(customer_wa);
CREATE INDEX IF NOT EXISTS idx_customer_bindings_valid ON customer_bindings(valid_until);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON payouts(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliates_updated_at ON affiliates;
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_bindings_updated_at ON customer_bindings;
CREATE TRIGGER update_customer_bindings_updated_at BEFORE UPDATE ON customer_bindings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_links_updated_at ON affiliate_links;
CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON affiliate_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();