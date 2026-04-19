// src/lib/AuthContext.tsx
// Changed: removed supabaseAdmin — all role resolution uses the anon client (RLS enforced)
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  role: 'super_admin' | 'admin' | 'student' | null
  studentData: any | null
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  studentData: null,
  signOut: async () => {},
  loading: true,
})

async function resolveRoleFromProfile(
  userId: string
): Promise<'super_admin' | 'admin' | 'student' | null> {
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email
  const roleFromMetadata = userData.user?.user_metadata?.role

  // ---- PLATFORM OWNER OVERRIDE ----
  if (email === 'bhanuthammali2601@gmail.com' || email === 'admin@hostelos.com') {
    // Write 'super_admin' to DB so RLS policies that check role = 'super_admin' work
    await supabase.from('profiles').upsert({
      id:    userId,
      email: email ?? '',
      role:  'super_admin',
    })
    return 'super_admin'
  }

  // Trust JWT metadata written at account creation
  if (roleFromMetadata === 'student' || roleFromMetadata === 'admin') {
    await supabase
      .from('profiles')
      .upsert({ id: userId, email: email || '', role: roleFromMetadata })
    return roleFromMetadata
  }

  // Self-healing: if email is in students table, they are a student
  if (email) {
    const { data: studentMatch } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (studentMatch) {
      await supabase
        .from('profiles')
        .upsert({ id: userId, email, role: 'student' })
      return 'student'
    }
  }

  // Check profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[AuthContext] profiles lookup failed:', error.message)
    return null
  }

  if (data?.role === 'super_admin') return 'super_admin'
  if (data?.role === 'admin') return 'admin'
  if (data?.role === 'student') return 'student'

  // No profile found — detect and write
  return await detectAndWriteProfile(userId)
}

async function detectAndWriteProfile(userId: string): Promise<'super_admin' | 'admin' | 'student'> {
  const { data: hostel } = await supabase
    .from('hostels')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (hostel) {
    const { data: user } = await supabase.auth.getUser()
    await supabase
      .from('profiles')
      .upsert({ id: userId, email: user.user?.email ?? '', role: 'admin' })
    return 'admin'
  }

  const { data: userData } = await supabase.auth.getUser()
  const currentEmail = userData.user?.email ?? ''

  let studentQuery = supabase
    .from('students')
    .select('id, email, user_id')
    .eq('user_id', userId)
  if (currentEmail) {
    studentQuery = supabase
      .from('students')
      .select('id, email, user_id')
      .or(`user_id.eq.${userId},email.eq.${currentEmail}`)
  }

  const { data: student } = await studentQuery.maybeSingle()

  if (student) {
    await supabase
      .from('profiles')
      .upsert({ id: userId, email: currentEmail || student.email || '', role: 'student' })
    if (!student.user_id) {
      await supabase.from('students').update({ user_id: userId }).eq('id', student.id)
    }
    return 'student'
  }

  // If no hostel and no student record found, check if profiles already has a role
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile?.role === 'super_admin') return 'super_admin'

  console.warn('[AuthContext] No hostel/student record — writing admin profile for:', userId)
  await supabase
    .from('profiles')
    .upsert({ id: userId, email: currentEmail, role: 'admin' })
  return 'admin'
}

async function fetchStudentData(userId: string, email?: string) {
  const { data: student } = await supabase
    .from('students')
    .select('*, rooms(room_number, floor, type), beds(bed_number)')
    .eq('user_id', userId)
    .maybeSingle()

  if (student) return student

  if (email) {
    const { data: byEmail } = await supabase
      .from('students')
      .select('*, rooms(room_number, floor, type), beds(bed_number)')
      .eq('email', email)
      .maybeSingle()

    if (byEmail) {
      await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('id', byEmail.id)
      return { ...byEmail, user_id: userId }
    }
  }

  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'super_admin' | 'admin' | 'student' | null>(null)
  const [studentData, setStudentData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const checkRole = async (user: User | null) => {
    if (!user) {
      setRole(null)
      setStudentData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const resolvedRole = await resolveRoleFromProfile(user.id)
      setRole(resolvedRole)

      if (resolvedRole === 'student') {
        const data = await fetchStudentData(user.id, user.email)
        setStudentData(data)
      } else {
        setStudentData(null)
      }
    } catch (err) {
      console.error('[AuthContext] checkRole failed:', err)
      setRole(null)
      setStudentData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) checkRole(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        checkRole(session.user)
      } else {
        setRole(null)
        setStudentData(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, role, studentData, signOut, loading }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">HostelOS</p>
              <p className="text-xs text-slate-400 mt-0.5">Verifying your account...</p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
