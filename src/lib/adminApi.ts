/**
 * adminApi.ts
 *
 * ALL privileged operations go through this module.
 * It calls the Edge Function instead of using the service role key in the browser.
 *
 * The service key must ONLY live in:
 *   - supabase/functions/admin-operations/index.ts  (server-side)
 *   - Your Supabase project secrets (set via: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx)
 *
 * NEVER import supabase-admin.ts again from any frontend file.
 */

import { supabase } from './supabase'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-operations`

async function callAdminFunction<T = unknown>(
  action: string,
  payload: Record<string, unknown>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  let res: Response;
  try {
    res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    })
  } catch (err: any) {
    if (err.message.includes('Failed to fetch')) {
      // TASK 2: SMART LOCAL FALLBACK
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const LOCAL_URL = 'http://localhost:54321/functions/v1/admin-operations'
          res = await fetch(LOCAL_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ action, payload }),
          })
        } catch (localErr: any) {
          throw new Error(
            `Edge Function not deployed.\n\nRun:\n` +
            `1. supabase login\n` +
            `2. supabase link --project-ref YOUR_PROJECT_ID\n` +
            `3. supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx\n` +
            `4. supabase functions deploy admin-operations`
          )
        }
      } else {
        // TASK 1: DETAILED ERROR DEPLOYMENT
        throw new Error(
          `Edge Function not deployed.\n\nRun:\n` +
          `1. supabase login\n` +
          `2. supabase link --project-ref YOUR_PROJECT_ID\n` +
          `3. supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx\n` +
          `4. supabase functions deploy admin-operations`
        )
      }
    } else {
      throw err;
    }
  }

  const text = await res.text()
  let json;
  try {
    json = JSON.parse(text)
  } catch (err) {
    throw new Error(`Invalid response from server: ${res.status} ${res.statusText}`)
  }
  
  if (!res.ok) throw new Error(json.error || `Admin operation failed: ${res.status}`)
  return json as T
}

// ── Student auth account creation ─────────────────────────────────────────────

export interface StudentCredentials {
  email: string
  password: string
  must_change: boolean
}

export interface CreateStudentUserResult {
  user_id: string
  credentials: StudentCredentials
}

export async function createStudentAuthAccount(params: {
  email?: string
  phone: string
  full_name: string
  hostel_id: string
}): Promise<CreateStudentUserResult> {
  return callAdminFunction<CreateStudentUserResult>('create_student_user', params)
}

// ── Hostel creation (super admin) ─────────────────────────────────────────────

export interface CreateHostelResult {
  hostel_id: string
  credentials: { email: string; password: string }
  summary: string
}

export async function createHostelWithOwner(params: {
  ownerEmail: string
  ownerName: string
  ownerPhone: string
  hostelName: string
  address: string
  contactEmail?: string
  contactPhone?: string
  floors?: unknown[]
  menu?: Record<string, unknown>
}): Promise<CreateHostelResult> {
  return callAdminFunction<CreateHostelResult>('create_hostel', params)
}

// ── User management (super admin) ─────────────────────────────────────────────

export async function resetUserPassword(userId: string): Promise<{ new_password: string }> {
  return callAdminFunction('reset_password', { user_id: userId })
}
