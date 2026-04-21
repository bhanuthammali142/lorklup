/**
 * adminApi.ts — MySQL backend version
 * Replaces Supabase Edge Function calls with REST API calls.
 */
import { apiHostels, apiStudents } from './api-client'

export async function createHostelWithOwner(payload: {
  ownerEmail: string
  ownerName: string
  ownerPhone?: string
  hostelName: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  floors?: any[]
  menu?: any
}) {
  return apiHostels.createWithOwner({
    ownerName:     payload.ownerName,
    ownerEmail:    payload.ownerEmail,
    ownerPhone:    payload.ownerPhone,
    hostelName:    payload.hostelName,
    address:       payload.address,
    contact_email: payload.contactEmail,
    contact_phone: payload.contactPhone,
    floors:        payload.floors,
    menu:          payload.menu,
  })
}

export async function createStudentAuthAccount(payload: {
  email?: string
  phone?: string
  full_name?: string
  hostel_id?: string
}) {
  // With MySQL backend, student account creation is handled inside addStudent
  // This function is a no-op shim for backward compatibility
  return { user_id: null, credentials: null }
}

export async function callAdminFunction(action: string, payload: any = {}) {
  // Route admin actions to the RESTful endpoints
  switch (action) {
    case 'create_hostel':
      return apiHostels.createWithOwner(payload)
    default:
      throw new Error(`Unknown admin action: ${action}`)
  }
}
