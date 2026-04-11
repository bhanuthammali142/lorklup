-- ============================================================
-- HostelOS — Profiles Table Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. Create the profiles table (single source of truth for role)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Each user can read their own profile (needed by frontend checkRole)
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 4. Service role can insert/update (used by admin backend when creating students)
--    This policy is needed so supabaseAdmin (service key) can write profiles.
CREATE POLICY "service_role_manage_profiles"
  ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Backfill existing admin users into profiles
--    (any user who owns a hostel is an admin)
INSERT INTO profiles (id, email, role)
SELECT h.owner_id, u.email, 'admin'
FROM hostels h
JOIN auth.users u ON u.id = h.owner_id
ON CONFLICT (id) DO NOTHING;

-- 6. Backfill existing students into profiles
--    (any user who has a student record with a user_id)
INSERT INTO profiles (id, email, role)
SELECT s.user_id, u.email, 'student'
FROM students s
JOIN auth.users u ON u.id = s.user_id
WHERE s.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Also fix students RLS so students can read their own record
--    The existing policy only allows hostel owners — students can't read their own data!
DROP POLICY IF EXISTS "owners_students" ON students;

-- Admin (hostel owner) can do everything
CREATE POLICY "admin_all_students" ON students FOR ALL
  USING (hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid()));

-- Students can read their own record (needed for StudentDashboard)
CREATE POLICY "student_read_own" ON students FOR SELECT
  USING (user_id = auth.uid());

-- 8. Fix fees RLS — students must be able to view their own fees
DROP POLICY IF EXISTS "owners_fees" ON fees;

CREATE POLICY "admin_all_fees" ON fees FOR ALL
  USING (hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid()));

CREATE POLICY "student_read_own_fees" ON fees FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- 9. Fix complaints RLS — students must be able to insert/read their own
DROP POLICY IF EXISTS "owners_complaints" ON complaints;

CREATE POLICY "admin_all_complaints" ON complaints FOR ALL
  USING (hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid()));

CREATE POLICY "student_manage_own_complaints" ON complaints FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- 10. Fix announcements RLS — students must be able to read announcements
DROP POLICY IF EXISTS "owners_announcements" ON announcements;

CREATE POLICY "admin_all_announcements" ON announcements FOR ALL
  USING (hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid()));

CREATE POLICY "student_read_announcements" ON announcements FOR SELECT
  USING (hostel_id IN (SELECT hostel_id FROM students WHERE user_id = auth.uid()));

-- 11. Fix attendance RLS — students can read their own
DROP POLICY IF EXISTS "owners_attendance" ON attendance;

CREATE POLICY "admin_all_attendance" ON attendance FOR ALL
  USING (hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid()));

CREATE POLICY "student_read_own_attendance" ON attendance FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
