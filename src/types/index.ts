export interface Hostel {
  id: string
  owner_id: string
  name: string
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
}

export interface Room {
  id: string
  hostel_id: string
  room_number: string
  floor: string | null
  capacity: number
  type: 'AC' | 'Non-AC'
  created_at: string
  beds?: Bed[]
}

export interface Bed {
  id: string
  hostel_id: string
  room_id: string
  bed_number: string
  status: 'available' | 'occupied' | 'maintenance'
  created_at: string
  students?: Student[]
}

export interface Student {
  id: string
  hostel_id: string
  full_name: string
  email: string | null
  user_id: string | null
  aadhaar_number: string | null
  phone: string
  parent_phone: string | null
  profile_photo: string | null
  college_name: string | null
  branch: string | null
  id_number: string | null
  room_id: string | null
  bed_id: string | null
  joining_date: string
  is_verified: boolean
  created_at: string
  rooms?: { room_number: string } | null
  beds?: { bed_number: string } | null
}

export interface Fee {
  id: string
  hostel_id: string
  student_id: string
  amount: number
  paid_amount: number
  due_amount: number
  month: string
  due_date: string
  status: 'paid' | 'pending' | 'overdue' | 'partial'
  payment_method: string | null
  receipt_id: string | null
  paid_at: string | null
  created_at: string
  students?: { full_name: string; rooms?: { room_number: string } | null } | null
}

export interface DashboardStats {
  totalStudents: number
  occupiedBeds: number
  totalBeds: number
  monthlyRevenue: number
  pendingFees: number
  overdueFees: number
}

export interface Complaint {
  id: string
  hostel_id: string
  student_id: string
  title: string
  description: string
  image_url: string | null
  status: 'pending' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  students?: { full_name: string; rooms?: { room_number: string } | null }
}

export interface Announcement {
  id: string
  hostel_id: string
  title: string
  message: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  hostel_id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'leave'
  created_at: string
  students?: { full_name: string; rooms?: { room_number: string } | null }
}
