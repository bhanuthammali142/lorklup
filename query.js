import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const email = 'bhanuthammali142@gmail.com';
  console.log('Checking for email:', email);
  
  const { data: students } = await supabaseAdmin.from('students').select('*').eq('email', email);
  console.log('Students:', students);
  
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*').eq('email', email);
  console.log('Profiles:', profiles);
}
run();
