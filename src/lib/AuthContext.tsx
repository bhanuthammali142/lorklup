import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { ChangePasswordPrompt } from '../components/ChangePasswordPrompt'
import { supabase } from './supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  role: 'super_admin' | 'admin' | 'student' | null
  studentData: any | null
  needsPasswordChange: boolean
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  studentData: null,
  needsPasswordChange: false,
  signOut: async () => {},
  loading: true,
})

/**
 * Resolve role from the `profiles` table — single source of truth.
 *
 * Why profiles table?
 * The old heuristic (check hostel ownership → check students table → fallback
 * to 'admin') was the root cause of the bug: when a student clicks the email
 * invite link, their user_id may not yet be written to the students row, so
 * the check fails and silently defaults to 'admin'. A dedicated profiles row
 * written at account-creation time is immune to that race condition.
 */
async function resolveRoleFromProfile(userId: string): Promise<'super_admin' | 'admin' | 'student' | null> {
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email
  const roleFromMetadata = userData.user?.user_metadata?.role

  // ---- PLATFORM OWNER OVERRIDE ----
  // No SQL migration needed! The owner email becomes Super Admin automatically.
  if (email === 'bhanuthammali2601@gmail.com' || email === 'admin@hostelos.com') {
    // Ensure profile row exists to satisfy foreign keys, but keep DB constrained to 'admin'
    await supabase.from('profiles').upsert({ id: userId, email: email || '', role: 'admin' })
    return 'super_admin'
  }

  // ---- RLS-PROOF METADATA CHECK ----
  // If the role was stamped onto the user's JWT metadata at creation time, trust it immediately.
  if (roleFromMetadata === 'student' || roleFromMetadata === 'admin') {
    await supabase.from('profiles').upsert({ id: userId, email: email || '', role: roleFromMetadata })
    return roleFromMetadata
  }

  // ---- SELF-HEALING LOGIC ----
  // If the user's email exists in the students table, they are DEFINITELY a student.
  // This auto-corrects any profiles that were mistakenly set to 'admin' due to bugs.
  if (email) {
    const { data: studentMatch } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (studentMatch) {
      await supabase.from('profiles').upsert({ id: userId, email, role: 'student' })
      return 'student'
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[AuthContext] profiles lookup failed:', error.message)
    return null
  }

  if (data?.role === 'admin' || data?.role === 'student') {
    return data.role
  }

  // No profile row yet — this is a legacy user or a first-time admin signup.
  // Try auto-detecting and writing a profile rather than defaulting blindly.
  return await detectAndWriteProfile(userId)
}

/**
 * Fallback for users who existed before the profiles table was created.
 * 1. If they own a hostel → admin
 * 2. If they are in students table → student
 * 3. No match at all → admin (only admins self-register; students only come via invite email)
 */
async function detectAndWriteProfile(userId: string): Promise<'admin' | 'student'> {
  // Check hostel ownership
  const { data: hostel } = await supabase
    .from('hostels')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (hostel) {
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: userId,
      email: user.user?.email ?? '',
      role: 'admin',
    })
    return 'admin'
  }

  // Check students table (try user_id first, then email)
  const { data: userData } = await supabase.auth.getUser()
  const currentEmail = userData.user?.email ?? ''

  let studentQuery = supabase.from('students').select('id, email, user_id').eq('user_id', userId)
  if (currentEmail) {
    studentQuery = supabase.from('students').select('id, email, user_id').or(`user_id.eq.${userId},email.eq.${currentEmail}`)
  }
  
  const { data: student } = await studentQuery.maybeSingle()

  if (student) {
    await supabase.from('profiles').upsert({
      id: userId,
      email: currentEmail || student.email || '',
      role: 'student',
    })
    
    // Also pair the auth ID back to the student record if it was missing
    if (!student.user_id) {
      await supabase.from('students').update({ user_id: userId }).eq('id', student.id)
    }
    
    return 'student'
  }

  // Last resort: no hostel, no student record found.
  // This is a self-registered user (students only come via email invite
  // and always have a student row written before they accept). Treat as admin.
  console.warn('[AuthContext] No hostel/student record — writing admin profile for self-registered user:', userId)
  await supabase.from('profiles').upsert({
    id: userId,
    email: currentEmail,
    role: 'admin',
  })
  return 'admin'
}

/**
 * Fetch student record after confirming role === 'student'.
 * Tries user_id first, then email fallback with backfill.
 */
async function fetchStudentData(userId: string, email?: string) {
  // Try direct user_id match
  const { data: student } = await supabase
    .from('students')
    .select('*, rooms(room_number, floor, type), beds(bed_number)')
    .eq('user_id', userId)
    .maybeSingle()

  if (student) return student

  // Fallback: email match (invite accepted but user_id not yet backfilled)
  if (email) {
    const { data: byEmail } = await supabase
      .from('students')
      .select('*, rooms(room_number, floor, type), beds(bed_number)')
      .eq('email', email)
      .maybeSingle()

    if (byEmail) {
      // Backfill user_id so future lookups are direct
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
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkRole = async (user: User | null) => {
    if (!user) {
      setRole(null)
      setStudentData(null)
      setLoading(false)
      return
    }

    // Set loading=true BEFORE the async profile lookup so the AuthPage
    // useEffect doesn't fire prematurely (with role=null) and fail to navigate.
    setLoading(true)

    try {
      const resolvedRole = await resolveRoleFromProfile(user.id)
      setRole(resolvedRole)

      if (resolvedRole === 'student') {
        const data = await fetchStudentData(user.id, user.email)
        setStudentData(data)

        // Check if student needs to change their temporary password
        const metadata = user.user_metadata
        const needsChange = metadata?.needs_password_change !== false && metadata?.role === 'student'
        setNeedsPasswordChange(needsChange)
      } else {
        setStudentData(null)
        setNeedsPasswordChange(false)
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const handlePasswordChanged = () => {
    setNeedsPasswordChange(false)
  }

  return (
    <AuthContext.Provider value={{ session, user, role, studentData, needsPasswordChange, signOut, loading }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">HostelOS</p>
              <p className="text-xs text-slate-400 mt-0.5">Verifying your account...</p>
            </div>
          </div>
        </div>
      ) : needsPasswordChange && role === 'student' ? (
        <ChangePasswordPrompt onComplete={handlePasswordChanged} />
      ) : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
