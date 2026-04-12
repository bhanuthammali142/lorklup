-- ═══════════════════════════════════════════════════════════════════════════
-- Migration V5: Strict Multi-Tenant RLS Policies
-- 
-- Fixes: Admin A can no longer read/write Admin B's data.
-- All queries are enforced by the authenticated user's hostel ownership,
-- NOT by client-passed hostel_id parameters.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper function: get current user's hostel id ────────────────────────────
CREATE OR REPLACE FUNCTION get_user_hostel_id()
RETURNS uuid AS $$
  SELECT id FROM hostels WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper function: get current user's student hostel id ────────────────────
CREATE OR REPLACE FUNCTION get_student_hostel_id()
RETURNS uuid AS $$
  SELECT hostel_id FROM students WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- STUDENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing policies if any
DROP POLICY IF EXISTS "admin_students_select" ON students;
DROP POLICY IF EXISTS "admin_students_insert" ON students;
DROP POLICY IF EXISTS "admin_students_update" ON students;
DROP POLICY IF EXISTS "admin_students_delete" ON students;
DROP POLICY IF EXISTS "student_self_select" ON students;

-- Admins can only read students in their own hostel
CREATE POLICY "admin_students_select" ON students FOR SELECT TO authenticated
USING (hostel_id = get_user_hostel_id() OR user_id = auth.uid());

-- Admins can only insert students into their own hostel
CREATE POLICY "admin_students_insert" ON students FOR INSERT TO authenticated
WITH CHECK (hostel_id = get_user_hostel_id());

-- Admins can only update students in their own hostel
CREATE POLICY "admin_students_update" ON students FOR UPDATE TO authenticated
USING (hostel_id = get_user_hostel_id());

-- Admins can only delete students from their own hostel
CREATE POLICY "admin_students_delete" ON students FOR DELETE TO authenticated
USING (hostel_id = get_user_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- ROOMS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_rooms_select" ON rooms;
DROP POLICY IF EXISTS "admin_rooms_insert" ON rooms;
DROP POLICY IF EXISTS "admin_rooms_update" ON rooms;

CREATE POLICY "admin_rooms_select" ON rooms FOR SELECT TO authenticated
USING (hostel_id = get_user_hostel_id() OR hostel_id = get_student_hostel_id());

CREATE POLICY "admin_rooms_insert" ON rooms FOR INSERT TO authenticated
WITH CHECK (hostel_id = get_user_hostel_id());

CREATE POLICY "admin_rooms_update" ON rooms FOR UPDATE TO authenticated
USING (hostel_id = get_user_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- BEDS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_beds_select" ON beds;
DROP POLICY IF EXISTS "admin_beds_insert" ON beds;
DROP POLICY IF EXISTS "admin_beds_update" ON beds;

CREATE POLICY "admin_beds_select" ON beds FOR SELECT TO authenticated
USING (hostel_id = get_user_hostel_id() OR hostel_id = get_student_hostel_id());

CREATE POLICY "admin_beds_insert" ON beds FOR INSERT TO authenticated
WITH CHECK (hostel_id = get_user_hostel_id());

CREATE POLICY "admin_beds_update" ON beds FOR UPDATE TO authenticated
USING (hostel_id = get_user_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- FEES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_fees_select" ON fees;
DROP POLICY IF EXISTS "admin_fees_insert" ON fees;
DROP POLICY IF EXISTS "admin_fees_update" ON fees;
DROP POLICY IF EXISTS "student_fees_select" ON fees;

-- Admins see only their hostel's fees
CREATE POLICY "admin_fees_select" ON fees FOR SELECT TO authenticated
USING (hostel_id = get_user_hostel_id() OR hostel_id = get_student_hostel_id());

CREATE POLICY "admin_fees_insert" ON fees FOR INSERT TO authenticated
WITH CHECK (hostel_id = get_user_hostel_id());

CREATE POLICY "admin_fees_update" ON fees FOR UPDATE TO authenticated
USING (hostel_id = get_user_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPLAINTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_complaints_select" ON complaints;
DROP POLICY IF EXISTS "admin_complaints_update" ON complaints;
DROP POLICY IF EXISTS "student_complaints_insert" ON complaints;
DROP POLICY IF EXISTS "student_complaints_select" ON complaints;

CREATE POLICY "admin_complaints_select" ON complaints FOR SELECT TO authenticated
USING (hostel_id = get_user_hostel_id() OR hostel_id = get_student_hostel_id());

CREATE POLICY "admin_complaints_update" ON complaints FOR UPDATE TO authenticated
USING (hostel_id = get_user_hostel_id());

CREATE POLICY "student_complaints_insert" ON complaints FOR INSERT TO authenticated
WITH CHECK (hostel_id = get_student_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- ANNOUNCEMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_announcements_all" ON announcements;
DROP POLICY IF EXISTS "student_announcements_select" ON announcements;

CREATE POLICY "admin_announcements_all" ON announcements FOR ALL TO authenticated
USING (hostel_id = get_user_hostel_id());

CREATE POLICY "student_announcements_select" ON announcements FOR SELECT TO authenticated
USING (hostel_id = get_student_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- ATTENDANCE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_attendance_all" ON attendance;
DROP POLICY IF EXISTS "student_attendance_select" ON attendance;

CREATE POLICY "admin_attendance_all" ON attendance FOR ALL TO authenticated
USING (hostel_id = get_user_hostel_id());

CREATE POLICY "student_attendance_select" ON attendance FOR SELECT TO authenticated
USING (hostel_id = get_student_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- HOSTELS TABLE (owner can only see/edit their own hostel)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "owner_hostels_select" ON hostels;
DROP POLICY IF EXISTS "owner_hostels_update" ON hostels;

CREATE POLICY "owner_hostels_select" ON hostels FOR SELECT TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "owner_hostels_update" ON hostels FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- PAYMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_payments_all" ON payments;

CREATE POLICY "admin_payments_all" ON payments FOR ALL TO authenticated
USING (hostel_id = get_user_hostel_id() OR hostel_id = get_student_hostel_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- Enable RLS on all tables (if not already enabled)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE! Every table now enforces tenant isolation via the authenticated
-- user's hostel ownership. Client-passed hostel_id can no longer bypass RLS.
-- ═══════════════════════════════════════════════════════════════════════════
