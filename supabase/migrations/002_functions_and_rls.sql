-- ============================================================================
-- KHAGAN LIVE BAKERY MANAGEMENT ERP + POS
-- Supabase PostgreSQL Migration 002: Stored Procedures & Row Level Security
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRANSACTIONAL RPC: APPROVE PRODUCTION BATCH
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
    -- 1. Fetch batch and lock row
    SELECT * INTO v_batch FROM production_batches WHERE id = p_batch_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Production batch not found: %', p_batch_id;
    END IF;

    -- Idempotency check: Cannot re-approve an already approved batch
    IF v_batch.status = 'Approved' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Batch is already approved. Double-posting prevented.',
            'batch_id', p_batch_id
        );
    END IF;

    -- 2. Find primary kitchen/warehouse location for the branch
    SELECT id INTO v_warehouse_id 
    FROM locations 
    WHERE branch_id = v_batch.branch_id AND type IN ('kitchen', 'warehouse') 
    ORDER BY (type = 'kitchen') DESC 
    LIMIT 1;

    IF v_warehouse_id IS NULL THEN
        SELECT id INTO v_warehouse_id FROM locations WHERE branch_id = v_batch.branch_id LIMIT 1;
    END IF;

    -- 3. Atomically consume raw materials and write immutable ledger
    FOR v_input IN 
        SELECT pi.*, rm.name_en, rm.current_stock 
        FROM production_inputs pi 
        JOIN raw_materials rm ON rm.id = pi.raw_material_id
        WHERE pi.batch_id = p_batch_id
    LOOP
        -- Deduct from raw material master stock
        UPDATE raw_materials 
        SET current_stock = current_stock - v_input.actual_quantity,
            updated_at = NOW()
        WHERE id = v_input.raw_material_id;

        -- Record raw material movement
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

    -- 4. Calculate total production cost & yield
    v_total_cost := v_total_raw_cost + COALESCE(v_batch.labor_cost, 0) + COALESCE(v_batch.utility_cost, 0);
    
    IF COALESCE(v_batch.actual_saleable_output, 0) > 0 THEN
        v_cost_per_piece := ROUND(v_total_cost / v_batch.actual_saleable_output, 2);
    ELSE
        v_cost_per_piece := 0;
    END IF;

    IF COALESCE(v_batch.planned_quantity, 0) > 0 THEN
        v_yield_pct := ROUND((v_batch.actual_saleable_output / v_batch.planned_quantity) * 100, 2);
    END IF;

    -- 5. Receive finished products into inventory
    FOR v_output IN 
        SELECT po.*, p.name_en 
        FROM production_outputs po
        JOIN products p ON p.id = po.product_id
        WHERE po.batch_id = p_batch_id
    LOOP
        -- Create or update inventory lot for finished product
        INSERT INTO inventory_lots (
            branch_id, location_id, item_type, item_id,
            lot_number, batch_id, initial_quantity, current_quantity,
            unit_cost, expiry_date
        ) VALUES (
            v_batch.branch_id, v_warehouse_id, 'product', v_output.product_id,
            v_batch.batch_number, p_batch_id, v_output.saleable_quantity, v_output.saleable_quantity,
            v_cost_per_piece, CURRENT_DATE + INTERVAL '3 days'
        ) RETURNING id INTO v_lot_id;

        -- Record finished goods receipt in immutable movement ledger
        INSERT INTO inventory_movements (
            branch_id, movement_type, item_type, item_id, lot_id,
            to_location_id, quantity, unit_cost, total_cost,
            reference_type, reference_id, actor_id, notes
        ) VALUES (
            v_batch.branch_id, 'finished_production_receipt', 'product', v_output.product_id, v_lot_id,
            v_warehouse_id, v_output.saleable_quantity, v_cost_per_piece, (v_output.saleable_quantity * v_cost_per_piece),
            'batch', p_batch_id, p_approver_id, 'Finished goods produced from batch ' || v_batch.batch_number
        );

        -- Update product cost price
        UPDATE products 
        SET cost_price = v_cost_per_piece,
            updated_at = NOW()
        WHERE id = v_output.product_id;
    END LOOP;

    -- 6. Update batch header
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
-- 2. TRANSACTIONAL RPC: PROCESS STOCK TRANSFER DISPATCH & RECEIVE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_process_stock_transfer_dispatch(
    p_transfer_id UUID,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_transfer FROM stock_transfers WHERE id = p_transfer_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer not found: %', p_transfer_id;
    END IF;

    IF v_transfer.status != 'Approved' AND v_transfer.status != 'Requested' THEN
        RAISE EXCEPTION 'Transfer cannot be dispatched in status: %', v_transfer.status;
    END IF;

    FOR v_item IN SELECT * FROM stock_transfer_items WHERE transfer_id = p_transfer_id LOOP
        -- Deduct from source lot or warehouse
        INSERT INTO inventory_movements (
            branch_id, movement_type, item_type, item_id,
            from_location_id, quantity, reference_type, reference_id, actor_id, notes
        ) VALUES (
            v_transfer.branch_id, 'transfer_dispatch', v_item.item_type, v_item.item_id,
            v_transfer.from_location_id, v_item.quantity_requested, 'transfer', p_transfer_id, p_actor_id,
            'Dispatched for transfer ' || v_transfer.transfer_number
        );

        UPDATE stock_transfer_items 
        SET quantity_dispatched = v_item.quantity_requested 
        WHERE id = v_item.id;
    END LOOP;

    UPDATE stock_transfers 
    SET status = 'Dispatched',
        dispatched_by = p_actor_id,
        dispatched_at = NOW(),
        updated_at = NOW()
    WHERE id = p_transfer_id;

    RETURN jsonb_build_object('success', true, 'status', 'Dispatched');
END;
$$;

CREATE OR REPLACE FUNCTION fn_process_stock_transfer_receive(
    p_transfer_id UUID,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_transfer FROM stock_transfers WHERE id = p_transfer_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer not found: %', p_transfer_id;
    END IF;

    IF v_transfer.status != 'Dispatched' THEN
        RAISE EXCEPTION 'Transfer cannot be received from status: %', v_transfer.status;
    END IF;

    FOR v_item IN SELECT * FROM stock_transfer_items WHERE transfer_id = p_transfer_id LOOP
        -- Add to destination location
        INSERT INTO inventory_movements (
            branch_id, movement_type, item_type, item_id,
            to_location_id, quantity, reference_type, reference_id, actor_id, notes
        ) VALUES (
            v_transfer.branch_id, 'transfer_receive', v_item.item_type, v_item.item_id,
            v_transfer.to_location_id, v_item.quantity_dispatched, 'transfer', p_transfer_id, p_actor_id,
            'Received for transfer ' || v_transfer.transfer_number
        );

        -- Also record in inventory_lots for shop location
        INSERT INTO inventory_lots (
            branch_id, location_id, item_type, item_id,
            lot_number, initial_quantity, current_quantity
        ) VALUES (
            v_transfer.branch_id, v_transfer.to_location_id, v_item.item_type, v_item.item_id,
            'TRF-' || v_transfer.transfer_number, v_item.quantity_dispatched, v_item.quantity_dispatched
        );

        UPDATE stock_transfer_items 
        SET quantity_received = v_item.quantity_dispatched 
        WHERE id = v_item.id;
    END LOOP;

    UPDATE stock_transfers 
    SET status = 'Received',
        received_by = p_actor_id,
        received_at = NOW(),
        updated_at = NOW()
    WHERE id = p_transfer_id;

    RETURN jsonb_build_object('success', true, 'status', 'Received');
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
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
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Cashier Read Protection: Cashiers cannot read payroll, employee salaries or admin financial expenses
CREATE POLICY "Cashier restricted from payroll" ON payroll_items
    FOR SELECT TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager', 'accountant'));

CREATE POLICY "Cashier restricted from expenses" ON expenses
    FOR SELECT TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager', 'accountant'));

CREATE POLICY "Cashier restricted from employees sensitive" ON employees
    FOR SELECT TO authenticated
    USING (auth_user_role() IN ('super_admin', 'manager', 'accountant'));

-- Universal authenticated read for products & categories (needed by POS and Admin)
CREATE POLICY "Public read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read categories" ON product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read locations" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public insert sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Public insert sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Public insert movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Public read cash sessions" ON cash_sessions FOR ALL TO authenticated USING (true);

