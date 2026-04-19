/**
 * supabase.ts
 *
 * ONLY the anon key lives here. The service role key has been removed from the
 * frontend entirely. All privileged operations now go through the Edge Function
 * via src/lib/adminApi.ts.
 *
 * If you see `supabaseAdmin` imported from this file anywhere in the codebase,
 * replace it with the appropriate function from src/lib/adminApi.ts.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment. ' +
    'Copy .env.example to .env.local and fill in your values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// supabaseAdmin has been intentionally removed.
// Use src/lib/adminApi.ts for any privileged operations.
