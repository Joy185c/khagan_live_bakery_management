-- ============================================================================
-- KHAGAN LIVE BAKERY MANAGEMENT SYSTEM
-- MIGRATION 004: COMPLETE AUTHENTICATION & SUPER ADMIN ACCESS CONTROL
-- ============================================================================

-- 1. Ensure columns exist on profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'suspended', 'deactivated')),
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS session_version INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '{}'::jsonb;

-- Create index on status and role for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 2. Security Audit Logs Table
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_user_name VARCHAR(255),
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'BLOCK_USER', 
        'UNBLOCK_USER', 
        'SUSPEND_USER', 
        'REVOKE_ACCESS', 
        'ACTIVATE_USER', 
        'DEACTIVATE_USER', 
        'CHANGE_ROLE', 
        'UPDATE_PERMISSIONS',
        'FORCE_LOGOUT', 
        'INVITE_USER', 
        'RESET_PASSWORD',
        'FIRST_OWNER_SETUP'
    )),
    reason TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_target ON security_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_logs(created_at DESC);

-- 3. Row Level Security for Security Audit Logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin can view security audit logs" ON security_audit_logs;
CREATE POLICY "Super Admin can view security audit logs" ON security_audit_logs
    FOR SELECT TO authenticated
    USING (auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Authenticated can insert security audit logs" ON security_audit_logs;
CREATE POLICY "Authenticated can insert security audit logs" ON security_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 4. Protective Trigger / Function: Prevent Blocking or Deleting the Last Active Super Admin
CREATE OR REPLACE FUNCTION fn_prevent_last_super_admin_lockout()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_active_admin_count INT;
BEGIN
    -- Check if target user was a super_admin and is being deactivated/blocked/suspended/role changed
    IF OLD.role = 'super_admin' AND (
        NEW.status IN ('blocked', 'suspended', 'deactivated') OR 
        NEW.is_active = FALSE OR 
        NEW.role <> 'super_admin'
    ) THEN
        SELECT COUNT(*) INTO v_active_admin_count
        FROM profiles
        WHERE role = 'super_admin'
          AND status = 'active'
          AND is_active = TRUE
          AND id <> OLD.id;

        IF v_active_admin_count < 1 THEN
            RAISE EXCEPTION 'Security Error: Cannot block, deactivate, or change role of the last active Super Admin account.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_super_admin_lockout ON profiles;
CREATE TRIGGER trg_prevent_last_super_admin_lockout
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_last_super_admin_lockout();

-- Prevent DELETE on profiles for safety (historical preservation)
CREATE OR REPLACE FUNCTION fn_prevent_profile_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Security Policy: Employee profiles cannot be hard-deleted to preserve historical audit records. Use Deactivate or Revoke Access instead.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_delete ON profiles;
CREATE TRIGGER trg_prevent_profile_delete
BEFORE DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_profile_delete();

