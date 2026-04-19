-- ============================================================
-- HostelOS — Migration v5: Real analytics + security hardening
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Occupancy snapshots (real monthly trend data) ─────────────────────────
CREATE TABLE IF NOT EXISTS occupancy_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_beds INT NOT NULL DEFAULT 0,
  occupied_beds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hostel_id, month)
);

ALTER TABLE occupancy_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_own_snapshots" ON occupancy_snapshots
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

-- ── 2. Auto-snapshot trigger: runs on first day of each month ────────────────
-- Call this function from a pg_cron job or from the app after each month rolls over
CREATE OR REPLACE FUNCTION snapshot_occupancy(p_hostel_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INT;
  v_occupied INT;
  v_rate NUMERIC;
  v_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
  SELECT COUNT(*) INTO v_total FROM beds WHERE hostel_id = p_hostel_id;
  SELECT COUNT(*) INTO v_occupied FROM beds WHERE hostel_id = p_hostel_id AND status = 'occupied';
  v_rate := CASE WHEN v_total > 0 THEN ROUND((v_occupied::NUMERIC / v_total) * 100, 2) ELSE 0 END;

  INSERT INTO occupancy_snapshots (hostel_id, month, rate, total_beds, occupied_beds)
  VALUES (p_hostel_id, v_month, v_rate, v_total, v_occupied)
  ON CONFLICT (hostel_id, month) DO UPDATE
    SET rate = EXCLUDED.rate,
        total_beds = EXCLUDED.total_beds,
        occupied_beds = EXCLUDED.occupied_beds;
END;
$$ LANGUAGE plpgsql;

-- ── 3. Enforce RLS on super_admin role for all tables ────────────────────────
-- Super admins use the anon key + JWT (not service key from browser)
-- Their RLS policies need to allow cross-hostel reads

DROP POLICY IF EXISTS "super_admin_read_all_hostels" ON hostels;
CREATE POLICY "super_admin_read_all_hostels" ON hostels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "super_admin_read_all_students" ON students;
CREATE POLICY "super_admin_read_all_students" ON students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "super_admin_read_all_fees" ON fees;
CREATE POLICY "super_admin_read_all_fees" ON fees
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "super_admin_tickets" ON platform_tickets;
CREATE POLICY "super_admin_tickets" ON platform_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ── 4. Update profiles constraint to allow super_admin role ──────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'student'));

-- ── 5. Add first-login flag to students for password change prompt ────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Mark all existing students so they know to change on next login
UPDATE students SET must_change_password = TRUE WHERE user_id IS NOT NULL;

-- ── 6. Index for occupancy snapshots queries ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_snapshots_hostel_month ON occupancy_snapshots(hostel_id, month DESC);
