import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string

// Standard client — respects RLS (used by admin and student modules)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service-role client — bypasses ALL RLS (used ONLY by Super Admin HQ)
// Never expose this in student/admin modules.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
