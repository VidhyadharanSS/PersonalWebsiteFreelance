-- ═══════════════════════════════════════════════════════════════════════
-- AUDIT LOGS TABLE — Migration for Admin Portal Audit Logging
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════╗
-- ║  AUDIT LOGS TABLE                     ║
-- ╚═══════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action          TEXT NOT NULL,                          -- e.g. 'booking_status_change', 'enquiry_deleted'
    severity        TEXT NOT NULL DEFAULT 'info'            -- 'info', 'warning', 'critical'
                    CHECK (severity IN ('info', 'warning', 'critical')),
    entity_type     TEXT DEFAULT NULL,                      -- 'booking', 'enquiry', 'system'
    entity_id       UUID DEFAULT NULL,                      -- FK to the entity (booking/enquiry)
    description     TEXT NOT NULL DEFAULT '',               -- Human-readable description
    metadata        JSONB DEFAULT '{}',                     -- Extra context (old/new values, etc.)
    admin_email     TEXT DEFAULT NULL,                      -- Who performed the action
    admin_name      TEXT DEFAULT NULL,                      -- Admin display name
    ip_address      TEXT DEFAULT NULL,                      -- Client IP (if available)
    user_agent      TEXT DEFAULT NULL,                      -- Browser user agent
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ╔═══════════════════════════════════════╗
-- ║  ENABLE RLS                            ║
-- ╚═══════════════════════════════════════╝

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ╔═══════════════════════════════════════╗
-- ║  RLS POLICIES                          ║
-- ╚═══════════════════════════════════════╝

-- Authenticated users can insert audit logs (the client writes logs)
CREATE POLICY "Allow authenticated insert on audit_logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Only admins can READ audit logs
CREATE POLICY "Admin can read audit_logs"
    ON audit_logs FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com',
            'admin@zped.org',
            'vidhyadharanss@gmail.com',
            'zenithpranavi786@gmail.com'
        )
    );

-- Only admins can DELETE audit logs (cleanup)
CREATE POLICY "Admin can delete audit_logs"
    ON audit_logs FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com',
            'admin@zped.org',
            'vidhyadharanss@gmail.com',
            'zenithpranavi786@gmail.com'
        )
    );

-- ╔═══════════════════════════════════════╗
-- ║  PERFORMANCE INDEXES                   ║
-- ╚═══════════════════════════════════════╝

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_email);

-- ╔═══════════════════════════════════════╗
-- ║  AUTO-CLEANUP (optional)               ║
-- ╚═══════════════════════════════════════╝
-- Uncomment below to auto-delete logs older than 90 days via a cron job:
--
-- CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
-- RETURNS void AS $$
-- BEGIN
--     DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- SELECT cron.schedule('cleanup-audit-logs', '0 3 * * 0', $$SELECT cleanup_old_audit_logs()$$);

-- ═══════════════════════════════════════════════════════════════════════
-- DONE! The audit_logs table is now ready for the admin portal.
-- ═══════════════════════════════════════════════════════════════════════
