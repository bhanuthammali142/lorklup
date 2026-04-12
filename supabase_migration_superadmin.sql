-- ============================================================
-- HostelOS — Super Admin Setup Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Update the role constraint to allow 'super_admin'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'admin', 'student'));

-- 2. Create the super_admin role for a specific email
-- (Replace 'YOUR_SUPER_ADMIN_EMAIL@domain.com' with the actual super admin email after they sign up)
UPDATE profiles SET role = 'super_admin' WHERE email = 'YOUR_SUPER_ADMIN_EMAIL@domain.com';

-- 3. Create Support Tickets Table for Platform/Hostel Management
CREATE TABLE IF NOT EXISTS platform_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_manage_all_tickets" ON platform_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "hostel_owners_read_own_tickets" ON platform_tickets FOR SELECT
  USING (hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid()));

CREATE POLICY "hostel_owners_insert_own_tickets" ON platform_tickets FOR INSERT
  WITH CHECK (hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid()));

-- 4. Elevate super admin visibility on ALL hostels
DROP POLICY IF EXISTS "super_admin_hostels" ON hostels;
CREATE POLICY "super_admin_hostels" ON hostels FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

