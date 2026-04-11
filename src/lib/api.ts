import { supabase } from './supabase'
import type { Hostel, Student, Fee } from '../types'
import { supabaseAdmin } from './supabase-admin'

// ─── HOSTEL ─────────────────────────────────────────────────────────────────

export async function getOrCreateHostel(userId: string): Promise<Hostel | null> {
  const { data, error } = await supabase
    .from('hostels')
    .select('*')
    .eq('owner_id', userId)
    .limit(1)
    .single()

  if (error && error.code === 'PGRST116') {
    const { data: created } = await supabase
      .from('hostels')
      .insert({ owner_id: userId, name: 'My Hostel' })
      .select()
      .single()
    return created
  }
  return data
}

export async function updateHostel(hostelId: string, payload: Partial<Hostel>) {
  const { error } = await supabase.from('hostels').update(payload).eq('id', hostelId)
  if (error) throw error
}

// ─── STUDENTS ────────────────────────────────────────────────────────────────

export async function getStudents(hostelId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*, rooms(room_number, monthly_fee), beds(bed_number)')
    .eq('hostel_id', hostelId)
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function addStudent(payload: Omit<Student, 'id' | 'created_at' | 'rooms' | 'beds' | 'user_id'> & { email?: string }) {
  let userId = null;

  if (payload.email) {
    // 1. Send invite email & create auth account
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(payload.email);
    if (authErr) throw authErr;
    userId = authData.user.id;

    // 2. CRITICAL FIX: Write student role to profiles table IMMEDIATELY.
    //    This is the single source of truth used by AuthContext.checkRole().
    //    Without this, the student clicks the email link and gets treated as
    //    admin because no profile row exists yet.
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email: payload.email, role: 'student' });
    if (profileErr) {
      console.error('[addStudent] Failed to write profiles row:', profileErr.message);
      // Non-fatal: auth account is created, student can still be backfilled via detectAndWriteProfile
    }
  }

  // 3. Insert student record
  const { data, error } = await supabase.from('students').insert({
    ...payload,
    user_id: userId
  }).select().single()
  if (error) throw error

  // 4. Auto-create current month fee if bed assigned and room has monthly_fee
  if (data && data.room_id) {
    const { data: room } = await supabase.from('rooms').select('monthly_fee').eq('id', data.room_id).single()
    if (room && Number(room.monthly_fee) > 0) {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().split('T')[0]
      await supabase.from('fees').insert({
        hostel_id: payload.hostel_id,
        student_id: data.id,
        amount: room.monthly_fee,
        due_amount: room.monthly_fee,
        month: monthStart,
        due_date: dueDate,
        status: 'pending',
      })
    }
    
    // Mark bed as occupied regardless of fee amount
    if (payload.bed_id) {
      await supabase.from('beds').update({ status: 'occupied' }).eq('id', payload.bed_id)
    }
  }
  return data
}

export async function updateStudent(id: string, payload: Partial<Student>) {
  const { error } = await supabase.from('students').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteStudent(id: string) {
  // Free the bed first
  const { data: student } = await supabase.from('students').select('bed_id').eq('id', id).single()
  if (student?.bed_id) {
    await supabase.from('beds').update({ status: 'available' }).eq('id', student.bed_id)
  }
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}

// ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────────

export async function uploadStudentDoc(hostelId: string, studentId: string, file: File, type: 'aadhaar' | 'id_card') {
  const ext = file.name.split('.').pop()
  const path = `${hostelId}/${studentId}/${type}.${ext}`
  const { error } = await supabase.storage.from('student-docs').upload(path, file, { upsert: true })
  if (error) throw error

  const { data: { publicUrl } } = supabase.storage.from('student-docs').getPublicUrl(path)
  return publicUrl
}

// ─── ROOMS + BEDS ────────────────────────────────────────────────────────────

export async function getRoomsWithBeds(hostelId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, beds(*, students(full_name))')
    .eq('hostel_id', hostelId)
    .order('room_number')
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function addRoom(payload: { hostel_id: string; room_number: string; floor: string; capacity: number; type: 'AC' | 'Non-AC'; monthly_fee: number }) {
  const { data: room, error } = await supabase.from('rooms').insert(payload).select().single()
  if (error) throw error

  const beds = Array.from({ length: payload.capacity }, (_, i) => ({
    hostel_id: payload.hostel_id,
    room_id: room.id,
    bed_number: `B${i + 1}`,
    status: 'available' as const,
  }))
  const { error: bedErr } = await supabase.from('beds').insert(beds)
  if (bedErr) throw bedErr
  return room
}

export async function updateRoom(roomId: string, payload: Partial<{ room_number: string; floor: string; capacity: number; type: 'AC' | 'Non-AC'; monthly_fee: number }>) {
  const safePayload = { ...payload }
  
  const { error } = await supabase.from('rooms').update(safePayload).eq('id', roomId)
  if (error) throw error
  
  // If capacity is increased, auto-add more beds
  if (payload.capacity) {
    const { data: beds } = await supabase.from('beds').select('id, bed_number').eq('room_id', roomId)
    const currentBeds = beds?.length || 0
    if (payload.capacity > currentBeds) {
      const room = await supabase.from('rooms').select('hostel_id').eq('id', roomId).single()
      const newBeds = Array.from({ length: payload.capacity - currentBeds }, (_, i) => ({
        hostel_id: room.data?.hostel_id,
        room_id: roomId,
        bed_number: `B${currentBeds + i + 1}`,
        status: 'available' as const,
      }))
      await supabase.from('beds').insert(newBeds)
    }
  }
}

// ─── FEES ────────────────────────────────────────────────────────────────────

export async function getFees(hostelId: string): Promise<Fee[]> {
  const { data, error } = await supabase
    .from('fees')
    .select('*, students(full_name, rooms(room_number))')
    .eq('hostel_id', hostelId)
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function addFeeRecord(payload: { hostel_id: string; student_id: string; amount: number; month: string; due_date: string }) {
  const { error } = await supabase.from('fees').insert({ ...payload, due_amount: payload.amount, status: 'pending' })
  if (error) throw error
}

export async function processPayment(feeId: string, hostelId: string, studentId: string, amountPaid: number, totalAmount: number, currentPaid: number, paymentMethod: string, paidAtDate: string) {
  const newPaidAmount = currentPaid + amountPaid;
  const newDueAmount = totalAmount - newPaidAmount;
  let newStatus = 'pending';
  
  if (newPaidAmount >= totalAmount) {
    newStatus = 'paid';
  } else if (newPaidAmount > 0) {
    newStatus = 'partial';
  }
  
  const receipt_id = `REC-${Date.now()}`;

  // Update Fees table
  const { error: feeErr } = await supabase
    .from('fees')
    .update({ 
      status: newStatus, 
      paid_amount: newPaidAmount,
      due_amount: newDueAmount,
      paid_at: newStatus === 'paid' ? new Date(paidAtDate).toISOString() : null,
      receipt_id: newStatus === 'paid' ? receipt_id : null
    })
    .eq('id', feeId)
    .eq('hostel_id', hostelId);

  if (feeErr) throw feeErr;

  // Insert Payment record
  const { error: payErr } = await supabase
    .from('payments')
    .insert({
      hostel_id: hostelId,
      fee_id: feeId,
      student_id: studentId,
      amount: amountPaid,
      payment_method: paymentMethod,
      transaction_id: receipt_id,
      created_at: new Date(paidAtDate).toISOString()
    });
    
  if (payErr) throw payErr;
  return { receipt_id, newStatus };
}

export async function autoMarkOverdue(hostelId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('fees')
    .update({ status: 'overdue' })
    .eq('hostel_id', hostelId)
    .eq('status', 'pending')
    .lt('due_date', today)
  if (error) throw error
}

export async function generateBulkFees(hostelId: string, monthDate: string, dueDate: string) {
  // Get all active students with a room
  const { data: students } = await supabase
    .from('students')
    .select('id, rooms!inner(monthly_fee)')
    .eq('hostel_id', hostelId)
    .not('room_id', 'is', null);

  if (!students || students.length === 0) return { created: 0 };

  // Get fees already generated for this month
  const { data: existingFees } = await supabase
    .from('fees')
    .select('student_id')
    .eq('hostel_id', hostelId)
    .eq('month', monthDate);

  const existingStudentIds = new Set(existingFees?.map(f => f.student_id) || []);

  const feesToCreate = students
    .filter(s => !existingStudentIds.has(s.id) && s.rooms && Number((s.rooms as any).monthly_fee) > 0)
    .map(s => ({
      hostel_id: hostelId,
      student_id: s.id,
      amount: Number((s.rooms as any).monthly_fee),
      due_amount: Number((s.rooms as any).monthly_fee),
      month: monthDate,
      due_date: dueDate,
      status: 'pending'
    }));

  if (feesToCreate.length === 0) return { created: 0 };

  const { error } = await supabase.from('fees').insert(feesToCreate);
  if (error) throw error;
  return { created: feesToCreate.length };
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export function exportStudentsCSV(students: Student[]) {
  const headers = ['Name', 'ID Number', 'College', 'Branch', 'Phone', 'Parent Phone', 'Room', 'Bed', 'Joining Date', 'Verified']
  const rows = students.map(s => [
    s.full_name, s.id_number ?? '', s.college_name ?? '', s.branch ?? '',
    s.phone, s.parent_phone ?? '',
    (s as any).rooms?.room_number ?? 'Unassigned',
    (s as any).beds?.bed_number ?? '',
    s.joining_date, s.is_verified ? 'Yes' : 'No',
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `students_export_${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export async function getDashboardStats(hostelId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [{ count: students }, { data: beds }, { data: fees }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('hostel_id', hostelId),
    supabase.from('beds').select('status').eq('hostel_id', hostelId),
    supabase.from('fees').select('amount,status,month').eq('hostel_id', hostelId).gte('month', monthStart).lte('month', monthEnd),
  ])

  const totalBeds = beds?.length ?? 0
  const occupiedBeds = beds?.filter(b => b.status === 'occupied').length ?? 0
  const monthlyRevenue = fees?.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0) ?? 0
  const pendingFees = fees?.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0) ?? 0
  const overdueFees = fees?.filter(f => f.status === 'overdue').reduce((s, f) => s + Number(f.amount), 0) ?? 0

  return { totalStudents: students ?? 0, totalBeds, occupiedBeds, monthlyRevenue, pendingFees, overdueFees }
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export async function getRevenueByMonth(hostelId: string) {
  const { data, error } = await supabase
    .from('fees').select('amount, month, status')
    .eq('hostel_id', hostelId).eq('status', 'paid').order('month')
  if (error) return []
  const grouped: Record<string, number> = {}
  for (const row of data ?? []) {
    const label = new Date(row.month).toLocaleString('default', { month: 'short', year: '2-digit' })
    grouped[label] = (grouped[label] ?? 0) + Number(row.amount)
  }
  return Object.entries(grouped).map(([name, amount]) => ({ name, amount }))
}

export async function getOccupancyByMonth(hostelId: string) {
  const { data: beds } = await supabase.from('beds').select('status').eq('hostel_id', hostelId)
  const total = beds?.length ?? 0
  const occupied = beds?.filter(b => b.status === 'occupied').length ?? 0
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
  return months.map(name => ({ name, value: rate }))
}

// ─── COMPLAINTS ───────────────────────────────────────────────────────────────

export async function getComplaints(hostelId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, students(full_name, rooms(room_number))')
    .eq('hostel_id', hostelId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateComplaintStatus(id: string, payload: { status?: string, priority?: string }) {
  const { error } = await supabase.from('complaints').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

export async function getAnnouncements(hostelId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('hostel_id', hostelId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addAnnouncement(payload: { hostel_id: string, title: string, message: string }) {
  const { error } = await supabase.from('announcements').insert(payload)
  if (error) throw error
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export async function getAttendanceByDate(hostelId: string, date: string) {
  // Get all active students with their rooms, and outer join attendance for this date
  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name, rooms(room_number), attendance(status)')
    .eq('hostel_id', hostelId)
    .eq('attendance.date', date)
  
  if (studentErr) throw studentErr
  return students ?? []
}

export async function markAttendance(hostelId: string, studentId: string, date: string, status: 'present' | 'absent' | 'leave') {
  const { error } = await supabase
    .from('attendance')
    .upsert({ hostel_id: hostelId, student_id: studentId, date, status }, { onConflict: 'student_id, date' })
  if (error) throw error
}
