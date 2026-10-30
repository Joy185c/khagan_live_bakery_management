-- ============================================================================
-- SPREADSHEET SYNCHRONIZATION OUTBOX & SETTINGS
-- Khagan Live Bakery Management ERP + POS
-- ============================================================================

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

-- RLS
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
