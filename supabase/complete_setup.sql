-- ============================================================================
-- KHAGAN LIVE BAKERY MANAGEMENT ERP + POS
-- COMPLETE ONE-CLICK DATABASE SETUP FOR SUPABASE
-- Run this entire script in Supabase Dashboard -> SQL Editor -> Click 'Run'
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. IDENTITY, MULTI-TENANCY & RBAC
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    trade_license VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'BDT',
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('warehouse', 'kitchen', 'shop_counter', 'cold_storage', 'waste_bin')),
    is_default_pos BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_bn VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    assigned_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE,
    role VARCHAR(50) NOT NULL REFERENCES roles(name) ON DELETE RESTRICT,
    language_preference VARCHAR(10) DEFAULT 'bn' CHECK (language_preference IN ('bn', 'en')),
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    old_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. UNITS, MASTER DATA & RECIPES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name_en VARCHAR(50) NOT NULL,
    name_bn VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('weight', 'volume', 'count', 'packaging')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    to_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    multiplier NUMERIC(16, 6) NOT NULL,
    UNIQUE(from_unit_id, to_unit_id)
);

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    purchase_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    conversion_ratio NUMERIC(14, 4) DEFAULT 1.0000,
    current_stock NUMERIC(14, 4) DEFAULT 0.0000,
    avg_cost_per_unit NUMERIC(14, 2) DEFAULT 0.00,
    reorder_point NUMERIC(14, 4) DEFAULT 5.0000,
    shelf_life_days INT,
    storage_location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    standard_piece_weight_g NUMERIC(10, 2),
    selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(14, 2) DEFAULT 0.00,
    shelf_life_days INT DEFAULT 2,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(14, 2) NOT NULL,
    cost NUMERIC(14, 2) DEFAULT 0.00,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) NOT NULL,
    standard_batch_size NUMERIC(10, 2) DEFAULT 1.00,
    expected_output_count NUMERIC(10, 2) NOT NULL,
    expected_output_weight_kg NUMERIC(10, 4) NOT NULL,
    standard_waste_pct NUMERIC(6, 2) DEFAULT 2.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    expected_output_count NUMERIC(10, 2) NOT NULL,
    expected_output_weight_kg NUMERIC(10, 4) NOT NULL,
    labor_cost_per_batch NUMERIC(14, 2) DEFAULT 0.00,
    overhead_cost_per_batch NUMERIC(14, 2) DEFAULT 0.00,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, version_number)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_version_id UUID NOT NULL REFERENCES recipe_versions(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 4) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    cost_snapshot NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PRODUCTION & INVENTORY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS production_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Completed', 'Cancelled')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES production_plans(id) ON DELETE SET NULL,
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    recipe_version_id UUID NOT NULL REFERENCES recipe_versions(id) ON DELETE RESTRICT,
    production_date DATE DEFAULT CURRENT_DATE,
    shift VARCHAR(50) DEFAULT 'Morning',
    operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Planned', 'In Progress', 'Completed', 'Approved', 'Cancelled')),
    planned_quantity NUMERIC(10, 2) NOT NULL,
    actual_saleable_output NUMERIC(10, 2) DEFAULT 0.00,
    rejected_quantity NUMERIC(10, 2) DEFAULT 0.00,
    actual_output_weight_kg NUMERIC(10, 4) DEFAULT 0.0000,
    raw_material_cost NUMERIC(14, 2) DEFAULT 0.00,
    labor_cost NUMERIC(14, 2) DEFAULT 0.00,
    utility_cost NUMERIC(14, 2) DEFAULT 0.00,
    total_cost NUMERIC(14, 2) DEFAULT 0.00,
    cost_per_piece NUMERIC(14, 2) DEFAULT 0.00,
    yield_percentage NUMERIC(6, 2) DEFAULT 0.00,
    weight_variance_pct NUMERIC(6, 2) DEFAULT 0.00,
    remarks TEXT,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    planned_quantity NUMERIC(14, 4) NOT NULL,
    actual_quantity NUMERIC(14, 4) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    unit_cost NUMERIC(14, 2) NOT NULL,
    total_cost NUMERIC(14, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS production_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    saleable_quantity NUMERIC(10, 2) NOT NULL,
    rejected_quantity NUMERIC(10, 2) DEFAULT 0.00,
    piece_weight_g NUMERIC(10, 2),
    total_weight_kg NUMERIC(10, 4),
    unit_cost NUMERIC(14, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS production_waste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    cost NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('raw_material', 'product')),
    item_id UUID NOT NULL,
    lot_number VARCHAR(100) NOT NULL,
    batch_id UUID REFERENCES production_batches(id) ON DELETE SET NULL,
    initial_quantity NUMERIC(14, 4) NOT NULL,
    current_quantity NUMERIC(14, 4) NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    expiry_date DATE,
    received_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (
        movement_type IN (
            'purchase_receipt',
            'production_issue',
            'production_return',
            'finished_production_receipt',
            'transfer_dispatch',
            'transfer_receive',
            'sale',
            'return',
            'waste',
            'adjustment'
        )
    ),
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('raw_material', 'product')),
    item_id UUID NOT NULL,
    lot_id UUID REFERENCES inventory_lots(id) ON DELETE SET NULL,
    from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    unit_cost NUMERIC(14, 2) DEFAULT 0.00,
    total_cost NUMERIC(14, 2) DEFAULT 0.00,
    reference_type VARCHAR(50),
    reference_id UUID,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    from_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    to_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested', 'Approved', 'Dispatched', 'Received', 'Cancelled')),
    requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dispatched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('raw_material', 'product')),
    item_id UUID NOT NULL,
    quantity_requested NUMERIC(14, 4) NOT NULL,
    quantity_dispatched NUMERIC(14, 4) DEFAULT 0.0000,
    quantity_received NUMERIC(14, 4) DEFAULT 0.0000
);

-- ----------------------------------------------------------------------------
-- 4. PURCHASES, SALES & FINANCES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    opening_balance NUMERIC(14, 2) DEFAULT 0.00,
    current_balance NUMERIC(14, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'Partial Received', 'Received', 'Cancelled')),
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(14, 4) NOT NULL,
    quantity_received NUMERIC(14, 4) DEFAULT 0.0000,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    unit_price NUMERIC(14, 2) NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    session_number VARCHAR(50) NOT NULL UNIQUE,
    cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_float NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_cash_sales NUMERIC(14, 2) DEFAULT 0.00,
    total_mobile_sales NUMERIC(14, 2) DEFAULT 0.00,
    total_card_sales NUMERIC(14, 2) DEFAULT 0.00,
    total_refunds NUMERIC(14, 2) DEFAULT 0.00,
    total_payouts NUMERIC(14, 2) DEFAULT 0.00,
    total_drops NUMERIC(14, 2) DEFAULT 0.00,
    expected_closing_cash NUMERIC(14, 2) DEFAULT 0.00,
    counted_closing_cash NUMERIC(14, 2),
    cash_variance NUMERIC(14, 2) DEFAULT 0.00,
    closing_notes TEXT,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    customer_name VARCHAR(100) DEFAULT 'Walking Customer',
    customer_phone VARCHAR(50),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14, 2) DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_cogs NUMERIC(14, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'refunded', 'cancelled')),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'returned', 'cancelled')),
    idempotency_key VARCHAR(100) UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    unit_cogs NUMERIC(14, 2) DEFAULT 0.00,
    discount_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_price NUMERIC(14, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'card', 'split')),
    amount NUMERIC(14, 2) NOT NULL,
    transaction_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waste_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    waste_number VARCHAR(50) NOT NULL UNIQUE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('raw_material', 'product')),
    item_id UUID NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    unit_cost NUMERIC(14, 2) DEFAULT 0.00,
    total_cost NUMERIC(14, 2) DEFAULT 0.00,
    reason VARCHAR(255) NOT NULL,
    disposal_method VARCHAR(100),
    authorized_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    is_utility BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank', 'bkash', 'nagad')),
    paid_to VARCHAR(255) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    full_name_en VARCHAR(255) NOT NULL,
    full_name_bn VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    national_id VARCHAR(50),
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL CHECK (department IN ('production', 'shop', 'management', 'cleaning', 'delivery')),
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary_type VARCHAR(20) NOT NULL CHECK (salary_type IN ('monthly', 'daily')),
    base_salary NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    overtime_rate_per_hour NUMERIC(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. INITIAL SEED DATA
-- ----------------------------------------------------------------------------

-- Insert Roles
INSERT INTO roles (name, display_name_en, display_name_bn, description) VALUES
    ('super_admin', 'Owner / Super Admin', 'মালিক / প্রধান প্রশাসক', 'Full control over all modules and financial data'),
    ('manager', 'Branch Manager', 'শাখা ব্যবস্থাপক', 'Day to day bakery oversight, approvals, and inventory adjustments'),
    ('production_manager', 'Head Baker / Chef', 'হেড বেকার / শেফ', 'Recipe management and daily batch planning/execution'),
    ('inventory_staff', 'Inventory Keeper', 'গুদাম ও ইনভেন্টরি কর্মী', 'Goods receiving, stock counting, and inter-location transfers'),
    ('cashier', 'Shop Cashier', 'দোকান বিক্রয় ক্যাশিয়ার', 'POS sales, receipt printing, customer returns, and shift cash reconciliation'),
    ('accountant', 'Accountant', 'হিসাবরক্ষক', 'Operating expenses, supplier balances, and payroll sheets'),
    ('viewer', 'Auditor / Viewer', 'নিরীক্ষক / দর্শক', 'Read-only access to operational reports')
ON CONFLICT (name) DO NOTHING;

-- Insert Organization
INSERT INTO organizations (id, name, trade_license, contact_phone, contact_email, currency, timezone)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Khagan Live Bakery (খাগান লাইভ বেকারি)',
    'TL-DHAKA-2026-9988',
    '01712-345678',
    'info@khaganlivebakery.com',
    'BDT',
    'Asia/Dhaka'
) ON CONFLICT DO NOTHING;

-- Insert Branch
INSERT INTO branches (id, organization_id, name, code, address, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Khagan Bazar Main Branch (খাগান বাজার মূল শাখা)',
    'KB-01',
    'Khagan Bazar, Birulia, Savar, Dhaka-1340',
    '01712-345678',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Insert Locations
INSERT INTO locations (id, branch_id, name, type, is_default_pos, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Main Kitchen & Warehouse (প্রধান কারখানা ও গুদাম)', 'kitchen', FALSE, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Front Shop Counter POS (দোকান বিক্রয় কাউন্টার)', 'shop_counter', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Insert Units
INSERT INTO units (id, code, name_en, name_bn, symbol, type)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'kg', 'Kilogram', 'কেজি', 'kg', 'weight'),
    ('d0000000-0000-0000-0000-000000000002', 'g', 'Gram', 'গ্রাম', 'g', 'weight'),
    ('d0000000-0000-0000-0000-000000000003', 'l', 'Liter', 'লিটার', 'L', 'volume'),
    ('d0000000-0000-0000-0000-000000000004', 'ml', 'Milliliter', 'মিলি', 'ml', 'volume'),
    ('d0000000-0000-0000-0000-000000000005', 'pcs', 'Piece', 'পিস', 'pcs', 'count'),
    ('d0000000-0000-0000-0000-000000000006', 'pkt', 'Packet', 'প্যাকেট', 'pkt', 'packaging')
ON CONFLICT (code) DO NOTHING;

-- Unit Conversions
INSERT INTO unit_conversions (from_unit_id, to_unit_id, multiplier)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 1000.000000),
    ('d0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 1000.000000)
ON CONFLICT DO NOTHING;

-- Product Categories
INSERT INTO product_categories (id, branch_id, name_en, name_bn, slug, sort_order, is_active)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bread & Loaves', 'পাউরুটি ও বান', 'bread', 1, TRUE),
    ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Cakes & Pastries', 'কেক ও পেস্ট্রি', 'cakes', 2, TRUE),
    ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Biscuits & Cookies', 'বিস্কুট ও কুকিজ', 'biscuits', 3, TRUE),
    ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Savory & Patties', 'লবণাক্ত ও প্যাটিস', 'savory', 4, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Raw Materials
INSERT INTO raw_materials (id, branch_id, code, name_en, name_bn, category, base_unit_id, purchase_unit_id, conversion_ratio, current_stock, avg_cost_per_unit, reorder_point, shelf_life_days, storage_location, is_active)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'RM-FLOUR-01', 'Special Baker Flour (Maida)', 'স্পেশাল বেকারি ময়দা', 'Flour & Grains', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 120.0000, 60.00, 30.0000, 90, 'Rack A', TRUE),
    ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'RM-SUGAR-01', 'Refined White Sugar', 'সাদা চিনি', 'Sweeteners', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 65.0000, 130.00, 20.0000, 180, 'Rack B', TRUE),
    ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'RM-BUTTER-01', 'Bakery Butter Fat', 'বেকারি বাটার / মাখন', 'Dairy', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 18.0000, 820.00, 6.0000, 60, 'Chiller 1', TRUE),
    ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'RM-YEAST-01', 'Instant Dry Yeast', 'ড্রাই ইস্ট', 'Leavening', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 6.5000, 480.00, 2.0000, 120, 'Rack C', TRUE),
    ('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'RM-MILK-01', 'Fresh Whole Milk', 'খাটি তরল দুধ', 'Dairy', 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 1, 45.0000, 90.00, 15.0000, 3, 'Chiller 2', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Finished Products
INSERT INTO products (id, branch_id, sku, barcode, name_en, name_bn, category_id, unit_id, standard_piece_weight_g, selling_price, cost_price, shelf_life_days, is_active)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BRD-MILK-400', '89411001001', 'Special Milk Bread 400g', 'স্পেশাল মিল্ক ব্রেড ৪০০ গ্রাম', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 400.00, 85.00, 48.00, 3, TRUE),
    ('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'BRD-BUN-60', '89411001002', 'Sweet Butter Bun 60g', 'মিষ্টি বাটার বান ৬০ গ্রাম', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 60.00, 20.00, 11.00, 2, TRUE),
    ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'CK-VAN-1LB', '89411002001', 'Vanilla Sponge Cake 1 Pound', 'ভ্যানিলা স্পঞ্জ কেক ১ পাউন্ড', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 454.00, 450.00, 255.00, 4, TRUE),
    ('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'SAV-CHICK-PUFF', '89411004001', 'Crispy Chicken Puff Patty', 'মুচমুচে চিকেন প্যাটিস', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 85.00, 40.00, 22.00, 1, TRUE)
ON CONFLICT (sku) DO NOTHING;

-- Suppliers
INSERT INTO suppliers (id, branch_id, name, contact_person, phone, email, address, opening_balance, current_balance, is_active)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'City Sugar & Flour Mills Ltd.', 'Md. Zahirul Haque', '01819-223344', 'sales@citymillsbd.com', 'Postogola, Dhaka', 0.00, 12500.00, TRUE),
    ('20000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Aarong Dairy & Agro Foods', 'Sultan Mahmud', '01912-887766', 'corporate@aarongdairy.com', 'Tejgaon, Dhaka', 0.00, 8400.00, TRUE)
ON CONFLICT DO NOTHING;

-- Initial Demo Profiles
INSERT INTO profiles (id, branch_id, assigned_location_id, full_name, phone, role, language_preference, is_active)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Shuvo Ahmed (Owner)', '01711-000001', 'super_admin', 'bn', TRUE),
    ('30000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Fatema Khatun (Cashier)', '01711-000005', 'cashier', 'bn', TRUE)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. TRANSACTIONAL STORED PROCEDURES
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_approve_production_batch(
    p_batch_id UUID,
    p_approver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch RECORD;
    v_input RECORD;
    v_output RECORD;
    v_warehouse_id UUID;
    v_lot_id UUID;
    v_total_raw_cost NUMERIC(14,2) := 0;
    v_total_cost NUMERIC(14,2) := 0;
    v_cost_per_piece NUMERIC(14,2) := 0;
    v_yield_pct NUMERIC(6,2) := 0;
BEGIN
    SELECT * INTO v_batch FROM production_batches WHERE id = p_batch_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Production batch not found: %', p_batch_id;
    END IF;

    IF v_batch.status = 'Approved' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Batch is already approved. Double-posting prevented.',
            'batch_id', p_batch_id
        );
    END IF;

    SELECT id INTO v_warehouse_id 
    FROM locations 
    WHERE branch_id = v_batch.branch_id AND type IN ('kitchen', 'warehouse') 
    ORDER BY (type = 'kitchen') DESC 
    LIMIT 1;

    IF v_warehouse_id IS NULL THEN
        SELECT id INTO v_warehouse_id FROM locations WHERE branch_id = v_batch.branch_id LIMIT 1;
    END IF;

    FOR v_input IN 
        SELECT pi.*, rm.name_en, rm.current_stock 
        FROM production_inputs pi 
        JOIN raw_materials rm ON rm.id = pi.raw_material_id
        WHERE pi.batch_id = p_batch_id
    LOOP
        UPDATE raw_materials 
        SET current_stock = current_stock - v_input.actual_quantity,
            updated_at = NOW()
        WHERE id = v_input.raw_material_id;

        INSERT INTO inventory_movements (
            branch_id, movement_type, item_type, item_id,
            from_location_id, quantity, unit_cost, total_cost,
            reference_type, reference_id, actor_id, notes
        ) VALUES (
            v_batch.branch_id, 'production_issue', 'raw_material', v_input.raw_material_id,
            v_warehouse_id, v_input.actual_quantity, v_input.unit_cost, v_input.total_cost,
            'batch', p_batch_id, p_approver_id, 'Batch consumption for ' || v_batch.batch_number
        );

        v_total_raw_cost := v_total_raw_cost + v_input.total_cost;
    END LOOP;

    v_total_cost := v_total_raw_cost + COALESCE(v_batch.labor_cost, 0) + COALESCE(v_batch.utility_cost, 0);
    
    IF COALESCE(v_batch.actual_saleable_output, 0) > 0 THEN
        v_cost_per_piece := ROUND(v_total_cost / v_batch.actual_saleable_output, 2);
    ELSE
        v_cost_per_piece := 0;
    END IF;

    IF COALESCE(v_batch.planned_quantity, 0) > 0 THEN
        v_yield_pct := ROUND((v_batch.actual_saleable_output / v_batch.planned_quantity) * 100, 2);
    END IF;

    FOR v_output IN 
        SELECT po.*, p.name_en 
        FROM production_outputs po
        JOIN products p ON p.id = po.product_id
        WHERE po.batch_id = p_batch_id
    LOOP
        INSERT INTO inventory_lots (
            branch_id, location_id, item_type, item_id,
            lot_number, batch_id, initial_quantity, current_quantity,
            unit_cost, expiry_date
        ) VALUES (
            v_batch.branch_id, v_warehouse_id, 'product', v_output.product_id,
            v_batch.batch_number, p_batch_id, v_output.saleable_quantity, v_output.saleable_quantity,
            v_cost_per_piece, CURRENT_DATE + INTERVAL '3 days'
        ) RETURNING id INTO v_lot_id;

        INSERT INTO inventory_movements (
            branch_id, movement_type, item_type, item_id, lot_id,
            to_location_id, quantity, unit_cost, total_cost,
            reference_type, reference_id, actor_id, notes
        ) VALUES (
            v_batch.branch_id, 'finished_production_receipt', 'product', v_output.product_id, v_lot_id,
            v_warehouse_id, v_output.saleable_quantity, v_cost_per_piece, (v_output.saleable_quantity * v_cost_per_piece),
            'batch', p_batch_id, p_approver_id, 'Finished goods produced from batch ' || v_batch.batch_number
        );

        UPDATE products 
        SET cost_price = v_cost_per_piece,
            updated_at = NOW()
        WHERE id = v_output.product_id;
    END LOOP;

    UPDATE production_batches
    SET status = 'Approved',
        raw_material_cost = v_total_raw_cost,
        total_cost = v_total_cost,
        cost_per_piece = v_cost_per_piece,
        yield_percentage = v_yield_pct,
        approved_by = p_approver_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_batch_id;

    RETURN jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'total_cost', v_total_cost,
        'cost_per_piece', v_cost_per_piece,
        'yield_percentage', v_yield_pct
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

DROP POLICY IF EXISTS "Allow authenticated read products" ON products;
CREATE POLICY "Allow authenticated read products" ON products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read categories" ON product_categories;
CREATE POLICY "Allow authenticated read categories" ON product_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read locations" ON locations;
CREATE POLICY "Allow authenticated read locations" ON locations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read sales" ON sales;
CREATE POLICY "Allow authenticated read sales" ON sales FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert sales" ON sales;
CREATE POLICY "Allow authenticated insert sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert sale_items" ON sale_items;
CREATE POLICY "Allow authenticated insert sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert movements" ON inventory_movements;
CREATE POLICY "Allow authenticated insert movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read cash sessions" ON cash_sessions;
CREATE POLICY "Allow authenticated read cash sessions" ON cash_sessions FOR ALL TO authenticated USING (true);

-- Cashier Restriction: Cashiers cannot read sensitive expenses and employee records
DROP POLICY IF EXISTS "Cashier restricted from expenses" ON expenses;
CREATE POLICY "Cashier restricted from expenses" ON expenses
    FOR SELECT TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager', 'accountant'));

DROP POLICY IF EXISTS "Cashier restricted from employees" ON employees;
CREATE POLICY "Cashier restricted from employees" ON employees
    FOR SELECT TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager', 'accountant'));


-- ----------------------------------------------------------------------------
-- 8. SPREADSHEET SYNCHRONIZATION OUTBOX & LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spreadsheet_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    spreadsheet_id VARCHAR(255),
    sheet_title VARCHAR(255) DEFAULT 'Khagan Live Bakery - Live ERP Data',
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error', 'not_configured')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spreadsheet_sync_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'production_batch', 'raw_material', 'product', 'sale', 'recipe',
        'waste', 'purchase', 'expense', 'payroll', 'summary', 'audit_log'
    )),
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RECONCILE', 'CANCEL', 'APPROVE')),
    entity_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 5,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS spreadsheet_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('incremental', 'reconcile', 'manual', 'retry')),
    records_processed INT DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    error_details TEXT,
    triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spreadsheet_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spreadsheet_sync_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE spreadsheet_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access spreadsheet_settings" ON spreadsheet_sync_settings;
CREATE POLICY "Admin access spreadsheet_settings" ON spreadsheet_sync_settings
    FOR ALL TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager'));

DROP POLICY IF EXISTS "Admin access spreadsheet_outbox" ON spreadsheet_sync_outbox;
CREATE POLICY "Admin access spreadsheet_outbox" ON spreadsheet_sync_outbox
    FOR ALL TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager'));

DROP POLICY IF EXISTS "Admin access spreadsheet_logs" ON spreadsheet_sync_logs;
CREATE POLICY "Admin access spreadsheet_logs" ON spreadsheet_sync_logs
    FOR ALL TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager'));
