/**
 * api-client.ts
 * Central HTTP client replacing all Supabase calls.
 * Stores JWT in localStorage and injects it on every request.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface ApiUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'student'
  hostel_id: string | null
}

export function getToken(): string | null {
  return localStorage.getItem('hostelOS_token')
}

export function setToken(token: string) {
  localStorage.setItem('hostelOS_token', token)
}

export function clearToken() {
  localStorage.removeItem('hostelOS_token')
  localStorage.removeItem('hostelOS_user')
}

export function getStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem('hostelOS_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setStoredUser(user: ApiUser) {
  localStorage.setItem('hostelOS_user', JSON.stringify(user))
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { error: text } }

  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data as T
}

/** Auth */
export const apiAuth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => request<ApiUser>('/auth/me'),
}

/** Hostels */
export const apiHostels = {
  getAll:            () => request('/hostels'),
  create:            (data: any) => request('/hostels', { method: 'POST', body: JSON.stringify(data) }),
  update:            (id: string, data: any) => request(`/hostels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createWithOwner:   (data: any) => request('/hostels/create-with-owner', { method: 'POST', body: JSON.stringify(data) }),
}

/** Students */
export const apiStudents = {
  getAll:    (hostelId: string) => request(`/students?hostel_id=${hostelId}`),
  add:       (data: any)        => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  update:    (id: string, data: any) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:    (id: string)       => request(`/students/${id}`, { method: 'DELETE' }),
}

/** Rooms */
export const apiRooms = {
  getAll:  (hostelId: string) => request(`/rooms?hostel_id=${hostelId}`),
  add:     (data: any)        => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:  (id: string)       => request(`/rooms/${id}`, { method: 'DELETE' }),
}

/** Fees */
export const apiFees = {
  getAll:          (hostelId: string) => request(`/fees?hostel_id=${hostelId}`),
  add:             (data: any)   => request('/fees', { method: 'POST', body: JSON.stringify(data) }),
  generateBulk:    (data: any)   => request('/fees/generate-bulk', { method: 'POST', body: JSON.stringify(data) }),
  processPayment:  (id: string, data: any) => request(`/fees/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  markOverdue:     (hostelId: string) => request('/fees/mark-overdue', { method: 'POST', body: JSON.stringify({ hostel_id: hostelId }) }),
  getForStudent:   (studentId: string) => request(`/fees/student/${studentId}`),
}

/** Dashboard */
export const apiDashboard = {
  getStats:      (hostelId: string) => request(`/dashboard?hostel_id=${hostelId}`),
  getRevenue:    (hostelId: string) => request(`/dashboard/revenue?hostel_id=${hostelId}`),
}

/** Complaints */
export const apiComplaints = {
  getAll:  (hostelId: string) => request(`/complaints?hostel_id=${hostelId}`),
  add:     (data: any) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

/** Announcements */
export const apiAnnouncements = {
  getAll:  (hostelId: string) => request(`/announcements?hostel_id=${hostelId}`),
  add:     (data: any) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  delete:  (id: string) => request(`/announcements/${id}`, { method: 'DELETE' }),
}

/** Attendance */
export const apiAttendance = {
  get:   (hostelId: string, date: string) => request(`/attendance?hostel_id=${hostelId}&date=${date}`),
  mark:  (data: any) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
}

/** Food Menu */
export const apiFoodMenu = {
  get:   (hostelId: string) => request(`/food-menu?hostel_id=${hostelId}`),
  save:  (hostelId: string, menu: any) => request('/food-menu', { method: 'PUT', body: JSON.stringify({ hostel_id: hostelId, menu }) }),
}
