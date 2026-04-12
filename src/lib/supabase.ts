import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Standard client — respects RLS (used by all frontend modules)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// NOTE: The service-role client has been removed from the frontend.
// All admin operations now go through the 'admin-ops' Supabase Edge Function.
// See src/lib/admin-api.ts for the frontend wrapper.
