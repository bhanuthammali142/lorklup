import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  role: 'admin' | 'student' | null
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
async function resolveRoleFromProfile(userId: string): Promise<'admin' | 'student' | null> {
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
 * 3. Otherwise → null (show error, do NOT default to admin)
 */
async function detectAndWriteProfile(userId: string): Promise<'admin' | 'student' | null> {
  // Check hostel ownership
  const { data: hostel } = await supabase
    .from('hostels')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (hostel) {
    // Write admin profile so this never runs again
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: userId,
      email: user.user?.email ?? '',
      role: 'admin',
    })
    return 'admin'
  }

  // Check students table (try user_id first, then email)
  const { data: student } = await supabase
    .from('students')
    .select('id, email, user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (student) {
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: userId,
      email: user.user?.email ?? student.email ?? '',
      role: 'student',
    })
    return 'student'
  }

  // No match found — return null, never default to admin
  console.warn('[AuthContext] No profile, hostel, or student record found for user:', userId)
  return null
}

/**
 * Fetch student record after confirming role === 'student'.
 * Tries user_id first, then email fallback with backfill.
 */
async function fetchStudentData(userId: string, email?: string) {
  // Try direct user_id match
  const { data: student } = await supabase
    .from('students')
    .select('*, rooms(room_number), beds(bed_number)')
    .eq('user_id', userId)
    .maybeSingle()

  if (student) return student

  // Fallback: email match (invite accepted but user_id not yet backfilled)
  if (email) {
    const { data: byEmail } = await supabase
      .from('students')
      .select('*, rooms(room_number), beds(bed_number)')
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
  const [role, setRole] = useState<'admin' | 'student' | null>(null)
  const [studentData, setStudentData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const checkRole = async (user: User | null) => {
    if (!user) {
      setRole(null)
      setStudentData(null)
      setLoading(false)
      return
    }

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
      // NEVER default to admin — set null so the UI shows an error state
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

  return (
    <AuthContext.Provider value={{ session, user, role, studentData, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
