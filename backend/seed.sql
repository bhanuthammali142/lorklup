-- HostelOS Default Superadmin Seed
-- This creates a default superadmin account for testing/development
-- Email: admin@hostel.com
-- Password: Bhanu@2006
-- Hash generated with bcrypt (12 rounds)

USE hostel_management;

-- Check if superadmin exists before inserting
INSERT INTO users (id, name, email, password_hash, role)
SELECT 
  UUID(),
  'Super Admin',
  'admin@hostel.com',
  -- bcrypt hash of "Bhanu@2006"
  '$2a$12$vguPEJw7FLnPQsN0/VgXJe9XqVppXsHxbJnEgYCfLnRjYGvFOmw2a',
  'super_admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@hostel.com' AND role = 'super_admin'
);

SELECT 'Superadmin seed completed' as message;
