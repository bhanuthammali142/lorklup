-- 1. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_announcements" ON announcements FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 2. COMPLAINTS
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT CHECK (status IN ('pending', 'in-progress', 'resolved')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_complaints" ON complaints FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 3. ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'leave')) DEFAULT 'present',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_attendance" ON attendance FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 4. PARTIAL PAYMENTS SUPPORT (FEES TABLE UPDATE)
-- Check if columns exist, if not add them
ALTER TABLE fees ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS due_amount NUMERIC(10,2) DEFAULT 0;
-- 'partial' status constraint update manually if needed (Supabase Check constraints need drop/recreate)
ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_status_check;
ALTER TABLE fees ADD CONSTRAINT fees_status_check CHECK (status IN ('paid', 'pending', 'overdue', 'partial'));

-- 5. PAYMENT HISTORY
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE NOT NULL,
  fee_id UUID REFERENCES fees(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_payments" ON payments FOR ALL USING (
  hostel_id IN (SELECT id FROM hostels WHERE owner_id = auth.uid())
);

-- 6. STUDENT ROLE SUPPORT (linking auth user to student)
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
