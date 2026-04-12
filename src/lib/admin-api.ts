/**
 * admin-api.ts — Frontend wrapper for the admin-ops Supabase Edge Function.
 *
 * All operations that previously used the service-role key directly in the
 * browser now go through this module, which calls the edge function instead.
 * The edge function holds the service role key securely on the server.
 */
import { supabase } from './supabase'

interface AdminApiResult<T = Record<string, unknown>> {
  data: T | null
  error: string | null
}

async function callAdminOps<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<AdminApiResult<T>> {
  const { data, error } = await supabase.functions.invoke('admin-ops', {
    body: { action, payload },
  })

  if (error) {
    // Edge function invocation error
    return { data: null, error: error.message || 'Edge function call failed' }
  }

  // The edge function returns JSON — check for application-level errors
  if (data?.error) {
    return { data: null, error: data.error }
  }

  return { data: data as T, error: null }
}

// ─── Student User Creation ───────────────────────────────────────────────────

export async function createStudentUser(email: string, password: string, fullName: string) {
  return callAdminOps<{ userId: string }>('create-student-user', {
    email,
    password,
    full_name: fullName,
  })
}

// ─── Admin User Creation (Super Admin only) ──────────────────────────────────

export async function createAdminUser(email: string, password: string, fullName: string) {
  return callAdminOps<{ userId: string; isExisting: boolean }>('create-admin-user', {
    email,
    password,
    full_name: fullName,
  })
}

// ─── List All Hostels (Super Admin only) ─────────────────────────────────────

export async function listAllHostels() {
  return callAdminOps<{ hostels: any[] }>('list-all-hostels')
}

// ─── Create Hostel with Rooms/Beds (Super Admin only) ────────────────────────

export async function createHostelFull(params: {
  ownerId: string
  hostelName: string
  address: string
  contactEmail: string
  contactPhone: string
  totalFloors: number
  floors: { floorName: string; rooms: { roomNumber: string; type: string; beds: number }[] }[]
  menu?: Record<string, Record<string, string>>
}) {
  return callAdminOps<{
    hostelId: string
    hostelCode: string
    roomsCreated: number
    bedsCreated: number
  }>('create-hostel', params)
}

// ─── Super Admin Dashboard Stats ─────────────────────────────────────────────

export async function getSuperAdminStats() {
  return callAdminOps<{
    totalHostels: number
    totalStudents: number
    activeStudents: number
  }>('superadmin-stats')
}
