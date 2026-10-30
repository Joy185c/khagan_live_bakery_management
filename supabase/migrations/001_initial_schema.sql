-- ============================================================================
-- KHAGAN LIVE BAKERY MANAGEMENT ERP + POS
-- Supabase PostgreSQL Migration 001: Complete Relational Schema & Security
-- ============================================================================

-- Enable required extensions
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
    name VARCHAR(50) NOT NULL UNIQUE, -- 'super_admin', 'manager', 'production_manager', 'inventory_staff', 'cashier', 'accountant', 'viewer'
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
    multiplier NUMERIC(16, 6) NOT NULL, -- e.g., 1 kg to g = 1000
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
    conversion_ratio NUMERIC(14, 4) DEFAULT 1.0000, -- how many base units per purchase unit
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
    standard_piece_weight_g NUMERIC(10, 2), -- in grams
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
    expected_output_count NUMERIC(10, 2) NOT NULL, -- e.g. 100 pcs
    expected_output_weight_kg NUMERIC(10, 4) NOT NULL, -- e.g. 10.0 kg
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
-- 3. PRODUCTION & BATCH MANAGEMENT
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
    stage VARCHAR(50) NOT NULL, -- 'dough_prep', 'baking', 'cooling', 'packaging'
    reason VARCHAR(255) NOT NULL,
    quantity NUMERIC(14, 4) NOT NULL,
    cost NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. INVENTORY, LOTS, MOVEMENTS & TRANSFERS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('raw_material', 'product')),
    item_id UUID NOT NULL, -- references raw_materials(id) or products(id)
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
    reference_type VARCHAR(50), -- 'purchase', 'batch', 'transfer', 'sale', 'waste'
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
-- 5. PURCHASES & SUPPLIER ACCOUNTS
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

CREATE TABLE IF NOT EXISTS purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    received_date DATE DEFAULT CURRENT_DATE,
    received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'bkash', 'nagad')),
    reference_number VARCHAR(100),
    payment_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. POS SALES, PAYMENTS, SHIFTS & REFUNDS
-- ----------------------------------------------------------------------------

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

CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('opening_float', 'cash_sale', 'cash_refund', 'payout', 'drop', 'correction')),
    amount NUMERIC(14, 2) NOT NULL,
    reason TEXT,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    refund_number VARCHAR(50) NOT NULL UNIQUE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL,
    refund_amount NUMERIC(14, 2) NOT NULL,
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('restockable', 'damaged')),
    reason TEXT NOT NULL,
    authorized_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. WASTE, EXPENSES & UTILITIES
-- ----------------------------------------------------------------------------

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

CREATE TABLE IF NOT EXISTS utility_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    allocation_method VARCHAR(50) NOT NULL CHECK (allocation_method IN ('batch_hours', 'production_quantity', 'manual')),
    allocated_amount NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expense_id, batch_id)
);

-- ----------------------------------------------------------------------------
-- 8. WORKFORCE & PAYROLL
-- ----------------------------------------------------------------------------

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

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift VARCHAR(50) DEFAULT 'General',
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'late', 'absent', 'half_day', 'paid_leave')),
    overtime_hours NUMERIC(4, 2) DEFAULT 0.00,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    period_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. '2026-10'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    base_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    overtime_amount NUMERIC(14, 2) DEFAULT 0.00,
    bonus_amount NUMERIC(14, 2) DEFAULT 0.00,
    advance_deduction NUMERIC(14, 2) DEFAULT 0.00,
    penalty_deduction NUMERIC(14, 2) DEFAULT 0.00,
    net_payable NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(payroll_period_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payroll_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_item_id UUID NOT NULL REFERENCES payroll_items(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank', 'bkash', 'nagad')),
    reference_number VARCHAR(100),
    payment_date DATE DEFAULT CURRENT_DATE,
    disbursed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. INDEXES FOR HIGH-THROUGHPUT SEARCH & LEDGER LOOKUP
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inv_lots_item ON inventory_lots(item_type, item_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inv_lots_expiry ON inventory_lots(expiry_date);
CREATE INDEX IF NOT EXISTS idx_movements_item ON inventory_movements(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_movements_ref ON inventory_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id);
CREATE INDEX IF NOT EXISTS idx_batches_date ON production_batches(production_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON production_batches(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
