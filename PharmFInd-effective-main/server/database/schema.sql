-- PharmFind PostgreSQL Database Schema
-- Run this script to create all tables, indexes, and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Users Table ====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==================== Medicines Table ====================
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(255),
    requires_prescription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_category CHECK (category IN (
        'Pain Relief', 'Antibiotics', 'Vitamins', 'Cold & Flu',
        'Allergy', 'Digestive Health', 'First Aid', 'Hygiene'
    ))
);

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);

-- ==================== Pharmacies Table ====================
CREATE TABLE IF NOT EXISTS pharmacies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    rating DECIMAL(2,1) DEFAULT 0,
    is_open BOOLEAN DEFAULT TRUE,
    hours_open TIME,
    hours_close TIME,
    base_delivery_fee DECIMAL(10,2) DEFAULT 15.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_rating CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pharmacies_is_open ON pharmacies(is_open);

-- ==================== Pharmacy Inventory Table ====================
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    stock_status VARCHAR(20) NOT NULL DEFAULT 'In Stock',
    quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_stock_status CHECK (stock_status IN ('In Stock', 'Low Stock', 'Out of Stock')),
    CONSTRAINT unique_pharmacy_medicine UNIQUE(pharmacy_id, medicine_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_medicine ON pharmacy_inventory(medicine_id);

-- ==================== Orders Table ====================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fees DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    delivery_address TEXT,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_order_status CHECK (status IN (
        'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'
    ))
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ==================== Order Items Table ====================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id),
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id),
    medicine_name VARCHAR(255) NOT NULL,
    pharmacy_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    CONSTRAINT check_order_type CHECK (type IN ('delivery', 'reservation'))
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medicine ON order_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_order_items_pharmacy ON order_items(pharmacy_id);

-- ==================== Order Status History Table ====================
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_timestamp ON order_status_history(timestamp DESC);

-- ==================== User Addresses Table ====================
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    building VARCHAR(50),
    floor VARCHAR(50),
    phone_number VARCHAR(20) NOT NULL,
    additional_details TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_nickname CHECK (nickname IN ('Home', 'Work', 'Mom''s', 'Other'))
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

-- ==================== Favorites Table ====================
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    last_pharmacy_id INTEGER REFERENCES pharmacies(id),
    last_price DECIMAL(10,2),
    added_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_medicine UNIQUE(user_id, medicine_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_medicine ON favorites(medicine_id);

-- ==================== Email Verifications Table ====================
CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);

-- ==================== Triggers ====================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create order status history entry
CREATE OR REPLACE FUNCTION create_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, status, note, timestamp)
        VALUES (NEW.id, NEW.status, NULL, NOW());
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_order_status_history_trigger 
    AFTER UPDATE OF status ON orders
    FOR EACH ROW EXECUTE FUNCTION create_order_status_history();

