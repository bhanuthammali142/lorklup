import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL              as string
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string

// SECURITY NOTE: This client bypasses ALL RLS.
// It MUST only be called from:
//   - Supabase Edge Functions (server-side)
//   - Local dev/migration scripts (never imported by browser components)
//
// In production, move all admin operations to Edge Functions and delete this export.
// For now, we keep it here solely for Super Admin operations that have no
// other path. Ensure VITE_SUPABASE_SERVICE_ROLE_KEY is rotated if exposed.
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  console.error(
    '[HostelOS] supabaseAdmin is being imported in a browser production build. ' +
    'Move admin operations to a Supabase Edge Function immediately.'
  )
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
