// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

/**
 * AuthCallbackPage — /auth/callback
 *
 * Supabase redirects here after a student clicks their invite email link.
 * This page:
 *  1. Waits for the session to be established by Supabase (auto-handled via URL hash)
 *  2. Fetches the user's role from the `profiles` table
 *  3. Redirects to the correct dashboard — never defaults to admin
 *
 * Set this as the redirect URL in Supabase Auth settings:
 *   Site URL: http://localhost:5173  (or your production domain)
 *   Redirect URLs: http://localhost:5173/auth/callback
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const handleCallback = async () => {
      try {
        // Supabase automatically processes the token from the URL hash.
        // getSession() will have it ready once the onAuthStateChange fires,
        // but we poll getUser() to be safe with the invite flow.
        const { data: { user }, error: userErr } = await supabase.auth.getUser()

        if (userErr || !user) {
          // Give Supabase a moment to process the URL tokens
          timeoutId = setTimeout(handleCallback, 800)
          return
        }

        // Fetch role from profiles table — the ONLY source of truth
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileErr) {
          console.error('[Callback] profiles query failed:', profileErr.message)
          setError('Unable to verify your account role. Please try signing in again.')
          return
        }

        // ---- SELF-HEALING / LEGACY DETECTION PATH ----
        // Profile doesn't exist OR we need to double check if they are actually a student
        const email = user.email ?? ''
        
        // 1. Check students table first. If they are an invited student, they MUST be treated as a student.
        let studentQuery = supabase.from('students').select('id, email, user_id').eq('user_id', user.id)
        if (email) {
          studentQuery = supabase.from('students').select('id, email, user_id').or(`user_id.eq.${user.id},email.eq.${email}`)
        }
        
        const { data: student } = await studentQuery.maybeSingle()

        if (student) {
          await supabase.from('profiles').upsert({ id: user.id, email: email || student.email || '', role: 'student' })
          if (!student.user_id) {
            await supabase.from('students').update({ user_id: user.id }).eq('id', student.id)
          }
          navigate('/student/dashboard', { replace: true })
          return
        }

        // 2. If no student record, check if they own a hostel (admin)
        const { data: hostel } = await supabase
          .from('hostels')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

        if (hostel) {
          await supabase.from('profiles').upsert({ id: user.id, email, role: 'admin' })
          navigate('/admin/dashboard', { replace: true })
          return
        }

        // 3. Fallback: if they just signed up and have no profile and no student record, default new users to admin
        if (!profile) {
          await supabase.from('profiles').upsert({ id: user.id, email, role: 'admin' })
          navigate('/admin/dashboard', { replace: true })
          return
        }

        // ── CLEAN ROLE-BASED REDIRECT ─────────────────────────────────────
        if (profile.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else if (profile.role === 'student') {
          navigate('/student/dashboard', { replace: true })
        } else {
          setError(`Unknown role "${profile.role}". Please contact support.`)
        }
      } catch (err: any) {
        console.error('[Callback] Unexpected error:', err)
        setError('Something went wrong during login. Please try again.')
      }
    }

    // Listen for when Supabase has processed the URL hash tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
        handleCallback()
      }
    })

    // Also trigger immediately in case session is already set
    handleCallback()

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Login Error</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4">
        <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-900 mb-1">Verifying your account</h2>
          <p className="text-sm text-slate-500">Setting up your personalized dashboard...</p>
        </div>
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-400 text-center">
          You'll be redirected automatically. Please don't close this tab.
        </p>
      </div>
    </div>
  )
}
