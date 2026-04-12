import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('*')
  console.log('--- PROFILES ---', profiles)
  
  const { data: students } = await supabase.from('students').select('id, email, user_id, full_name')
  console.log('--- STUDENTS ---', students)

  const { data: hostels } = await supabase.from('hostels').select('id, owner_id')
  console.log('--- HOSTELS ---', hostels)
}
run()
