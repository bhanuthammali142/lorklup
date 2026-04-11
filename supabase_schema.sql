-- Run this entire script in your Supabase SQL Editor (https://supabase.com/dashboard/project/qihckomaecblsaypzrwb/sql)

-- 1. Hostels
CREATE TABLE IF NOT EXISTS hostels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_hostels" ON hostels FOR ALL USING (auth.uid() = owner_id);

-- 2. Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  floor TEXT,
  capacity INT NOT NULL DEFAULT 3,
  type TEXT CHECK (type IN ('AC','Non-AC')) DEFAULT 'Non-AC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hostel_id, room_number)
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_rooms" ON rooms FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 3. Beds
CREATE TABLE IF NOT EXISTS beds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  bed_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('available','occupied','maintenance')) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, bed_number)
);
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_beds" ON beds FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 4. Students
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  aadhaar_number TEXT,
  phone TEXT NOT NULL,
  parent_phone TEXT,
  profile_photo TEXT,
  college_name TEXT,
  branch TEXT,
  id_number TEXT,
  room_id UUID REFERENCES rooms(id),
  bed_id UUID REFERENCES beds(id),
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_students" ON students FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 5. Fees
CREATE TABLE IF NOT EXISTS fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  month DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('paid','pending','overdue')) DEFAULT 'pending',
  payment_method TEXT,
  receipt_id TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_fees" ON fees FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_beds_hostel ON beds(hostel_id);
CREATE INDEX IF NOT EXISTS idx_students_hostel ON students(hostel_id);
CREATE INDEX IF NOT EXISTS idx_fees_hostel ON fees(hostel_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_month ON fees(month);
