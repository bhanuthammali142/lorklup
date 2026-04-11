/**
 * run-migration.mjs
 * Runs the profiles table migration directly against Supabase
 * using the service role key (bypasses RLS).
 *
 * Usage: node run-migration.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qihckomaecblsaypzrwb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpaGNrb21hZWNibHNheXB6cndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTczMTc2NywiZXhwIjoyMDkxMzA3NzY3fQ.i_hA41AoY-JvJI7Miqx16dUJ7E9MByJLFs7clbwF5lc'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log('📋 Checking existing tables...')

  // Test basic connectivity
  const { data: hostels, error: hostelsErr } = await supabase.from('hostels').select('id').limit(1)
  if (hostelsErr) {
    console.error('❌ Cannot connect to Supabase:', hostelsErr.message)
    process.exit(1)
  }
  console.log('✅ Connected to Supabase. Hostels count check passed.')
  console.log('   Hostel rows found:', hostels?.length ?? 0)

  // Check if profiles table already exists
  const { error: profilesCheckErr } = await supabase.from('profiles').select('id').limit(1)
  
  if (!profilesCheckErr) {
    console.log('✅ profiles table already exists!')
  } else {
    console.log('⚠️  profiles table does not exist yet.')
    console.log('   Error:', profilesCheckErr.message)
    console.log('')
    console.log('📌 ACTION REQUIRED:')
    console.log('   The profiles table must be created via the Supabase SQL Editor.')
    console.log('   Open: https://supabase.com/dashboard/project/qihckomaecblsaypzrwb/sql')
    console.log('   Then paste and run the contents of: supabase_migration_profiles.sql')
    console.log('')
    console.log('   This cannot be done automatically because the SQL includes DDL')
    console.log('   (CREATE TABLE, ALTER TABLE) which requires the SQL Editor.')
  }

  // Check students table structure
  const { data: students, error: studentsErr } = await supabase
    .from('students')
    .select('id, full_name, user_id, email')
    .limit(5)
  
  if (studentsErr) {
    console.log('⚠️  students table issue:', studentsErr.message)
  } else {
    console.log(`\n📊 Students in DB: ${students?.length ?? 0}`)
    students?.forEach(s => {
      console.log(`   - ${s.full_name} | user_id: ${s.user_id || 'NOT SET'} | email: ${s.email || 'N/A'}`)
    })
  }

  // Check users via admin API
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) {
    console.log('⚠️  Cannot list auth users:', authErr.message)
  } else {
    console.log(`\n👤 Auth users: ${authUsers.users.length}`)
    authUsers.users.forEach(u => {
      console.log(`   - ${u.email} | id: ${u.id} | confirmed: ${!!u.confirmed_at}`)
    })
  }
}

main().catch(console.error)
