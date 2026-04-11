-- Run in Supabase SQL Editor to add monthly_fee to rooms and aadhaar/id photo fields to students

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS aadhaar_photo TEXT,
  ADD COLUMN IF NOT EXISTS id_card_photo TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone_verified BOOLEAN DEFAULT FALSE;

-- Create storage bucket for student documents (run once)
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-docs', 'student-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: only hostel owner can access their student docs
CREATE POLICY IF NOT EXISTS "owner_student_docs" ON storage.objects
  FOR ALL USING (bucket_id = 'student-docs' AND auth.role() = 'authenticated');
