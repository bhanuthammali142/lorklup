-- ============================================================
-- HostelOS — Database Integrity & Cleanup Migration v4
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qihckomaecblsaypzrwb/sql
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- STEP 1: Add human-readable short-code columns
-- ════════════════════════════════════════════════════════════

-- Hostel short code: HOS-001, HOS-002 ...
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS hostel_code TEXT;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS total_floors INT DEFAULT 0;

-- Student readable ID: auto-generated on insert
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_code TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS due_amount NUMERIC(10,2) DEFAULT 0;

-- Backfill hostel_code for existing hostels
UPDATE hostels h
SET hostel_code = 'HOS-' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 3, '0')
WHERE hostel_code IS NULL;

-- Backfill student_code for existing students
UPDATE students s
SET student_code = 'STU-' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 4, '0')
WHERE student_code IS NULL;

-- ════════════════════════════════════════════════════════════
-- STEP 2: Add UNIQUE constraints to prevent duplicate data
-- ════════════════════════════════════════════════════════════

-- One hostel code per row (readable ID must be unique platform-wide)
ALTER TABLE hostels DROP CONSTRAINT IF EXISTS hostels_code_unique;
ALTER TABLE hostels ADD CONSTRAINT hostels_code_unique UNIQUE (hostel_code);

-- One owner can only have one hostel with the same name
ALTER TABLE hostels DROP CONSTRAINT IF EXISTS hostels_owner_name_unique;
ALTER TABLE hostels ADD CONSTRAINT hostels_owner_name_unique UNIQUE (owner_id, name);

-- Room numbers must be unique within a hostel (already exists, but re-enforce)
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_hostel_room_unique;
ALTER TABLE rooms ADD CONSTRAINT rooms_hostel_room_unique UNIQUE (hostel_id, room_number);

-- Bed numbers must be unique within a room (already exists, re-enforce)
ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_room_bed_unique;
ALTER TABLE beds ADD CONSTRAINT beds_room_bed_unique UNIQUE (room_id, bed_number);

-- One student per bed (a bed cannot be assigned to 2 students simultaneously)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_bed_unique;
-- Only enforce when bed_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS students_bed_unique_idx ON students (bed_id) WHERE bed_id IS NOT NULL;

-- Student email must be unique within a hostel (prevent double-admission)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_hostel_unique;
CREATE UNIQUE INDEX IF NOT EXISTS students_email_hostel_idx ON students (hostel_id, email) WHERE email IS NOT NULL;

-- ════════════════════════════════════════════════════════════
-- STEP 3: Remove ALL conflicting/duplicate RLS policies  
-- then add clean, non-overlapping policies per table
-- ════════════════════════════════════════════════════════════

-- ── HOSTELS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "owners_hostels" ON hostels;
DROP POLICY IF EXISTS "super_admin_hostels" ON hostels;
DROP POLICY IF EXISTS "admin_all_hostels" ON hostels;

-- Admins can CRUD only their OWN hostel
CREATE POLICY "admin_own_hostel" ON hostels
  FOR ALL USING (owner_id = auth.uid());

-- ── ROOMS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "owners_rooms" ON rooms;
DROP POLICY IF EXISTS "admin_all_rooms" ON rooms;
DROP POLICY IF EXISTS "student_read_rooms" ON rooms;

-- Admins: full access to rooms in their hostel only
CREATE POLICY "admin_own_rooms" ON rooms
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

-- Students: READ-ONLY their own hostel's rooms (for room assignment display)
CREATE POLICY "student_read_own_hostel_rooms" ON rooms
  FOR SELECT USING (
    hostel_id IN (SELECT hostel_id FROM students WHERE user_id = auth.uid())
  );

-- ── BEDS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "owners_beds" ON beds;
DROP POLICY IF EXISTS "admin_all_beds" ON beds;
DROP POLICY IF EXISTS "student_read_beds" ON beds;

-- Admins: full access to beds in their hostel only
CREATE POLICY "admin_own_beds" ON beds
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

-- Students: READ-ONLY their own hostel's beds
CREATE POLICY "student_read_own_hostel_beds" ON beds
  FOR SELECT USING (
    hostel_id IN (SELECT hostel_id FROM students WHERE user_id = auth.uid())
  );

-- ── STUDENTS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "owners_students" ON students;
DROP POLICY IF EXISTS "admin_all_students" ON students;
DROP POLICY IF EXISTS "student_read_own" ON students;

-- Admins: full access ONLY to students in their own hostel
CREATE POLICY "admin_own_students" ON students
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

-- Students: READ-ONLY their own personal record
CREATE POLICY "student_read_self" ON students
  FOR SELECT USING (user_id = auth.uid());

-- ── FEES ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "owners_fees" ON fees;
DROP POLICY IF EXISTS "admin_all_fees" ON fees;
DROP POLICY IF EXISTS "student_read_own_fees" ON fees;

CREATE POLICY "admin_own_fees" ON fees
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

CREATE POLICY "student_read_self_fees" ON fees
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- ── COMPLAINTS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "owners_complaints" ON complaints;
DROP POLICY IF EXISTS "admin_all_complaints" ON complaints;
DROP POLICY IF EXISTS "student_manage_own_complaints" ON complaints;

CREATE POLICY "admin_own_complaints" ON complaints
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

CREATE POLICY "student_manage_self_complaints" ON complaints
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- ── ANNOUNCEMENTS ───────────────────────────────────────────
DROP POLICY IF EXISTS "owners_announcements" ON announcements;
DROP POLICY IF EXISTS "admin_all_announcements" ON announcements;
DROP POLICY IF EXISTS "student_read_announcements" ON announcements;

CREATE POLICY "admin_own_announcements" ON announcements
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

CREATE POLICY "student_read_hostel_announcements" ON announcements
  FOR SELECT USING (
    hostel_id IN (SELECT hostel_id FROM students WHERE user_id = auth.uid())
  );

-- ── ATTENDANCE ──────────────────────────────────────────────
DROP POLICY IF EXISTS "owners_attendance" ON attendance;
DROP POLICY IF EXISTS "admin_all_attendance" ON attendance;
DROP POLICY IF EXISTS "student_read_own_attendance" ON attendance;

CREATE POLICY "admin_own_attendance" ON attendance
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

CREATE POLICY "student_read_self_attendance" ON attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- ── PROFILES ────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "service_role_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_read_own_profile" ON profiles;

-- Each user can only read their own profile
CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Service role can manage all (no restriction needed — bypassed by service key)
CREATE POLICY "authenticated_upsert_own" ON profiles
  FOR ALL USING (id = auth.uid());

-- ════════════════════════════════════════════════════════════
-- STEP 4: Food menu table (if not already created)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS food_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL UNIQUE,
  menu JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_own_food_menu" ON food_menus;
CREATE POLICY "admin_own_food_menu" ON food_menus
  FOR ALL USING (
    hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "student_read_food_menu" ON food_menus;
CREATE POLICY "student_read_food_menu" ON food_menus
  FOR SELECT USING (
    hostel_id IN (SELECT hostel_id FROM students WHERE user_id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════
-- STEP 5: Auto-generate hostel_code on new inserts
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION generate_hostel_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hostel_code := 'HOS-' || LPAD(CAST((SELECT COUNT(*) + 1 FROM hostels) AS TEXT), 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_hostel_code ON hostels;
CREATE TRIGGER tr_generate_hostel_code
  BEFORE INSERT ON hostels
  FOR EACH ROW
  WHEN (NEW.hostel_code IS NULL)
  EXECUTE FUNCTION generate_hostel_code();

-- Auto-generate student_code on new inserts
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.student_code := 'STU-' || LPAD(CAST((SELECT COUNT(*) + 1 FROM students) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_student_code ON students;
CREATE TRIGGER tr_generate_student_code
  BEFORE INSERT ON students
  FOR EACH ROW
  WHEN (NEW.student_code IS NULL)
  EXECUTE FUNCTION generate_student_code();

-- ════════════════════════════════════════════════════════════
-- STEP 6: Remove duplicate rows (clean existing bad data)
-- ════════════════════════════════════════════════════════════

-- Delete duplicate rooms (keep the oldest row per hostel+room_number)
DELETE FROM rooms r1
USING rooms r2
WHERE r1.hostel_id = r2.hostel_id
  AND r1.room_number = r2.room_number
  AND r1.created_at > r2.created_at;

-- Delete duplicate beds (keep the oldest row per room+bed_number)
DELETE FROM beds b1
USING beds b2
WHERE b1.room_id = b2.room_id
  AND b1.bed_number = b2.bed_number
  AND b1.created_at > b2.created_at;

-- Free beds that are marked 'occupied' but have no student assigned
UPDATE beds
SET status = 'available'
WHERE status = 'occupied'
  AND id NOT IN (SELECT bed_id FROM students WHERE bed_id IS NOT NULL);

-- ════════════════════════════════════════════════════════════
-- STEP 7: Performance indexes
-- ════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_hostels_owner ON hostels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hostels_code ON hostels(hostel_code);
CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(hostel_id, floor);
CREATE INDEX IF NOT EXISTS idx_beds_hostel ON beds(hostel_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(hostel_id, status);
CREATE INDEX IF NOT EXISTS idx_students_hostel ON students(hostel_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_fees_hostel ON fees(hostel_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(hostel_id, status);
