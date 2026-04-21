/**
 * AuthContext.tsx — MySQL/JWT-based auth (Supabase removed completely)
 */
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  apiAuth, getToken, setToken, clearToken,
  getStoredUser, setStoredUser, type ApiUser
} from './api-client'

interface AuthContextType {
  user: ApiUser | null
  role: 'super_admin' | 'admin' | 'student' | null
  hostelId: string | null
  signOut: () => void
  loading: boolean
  // Legacy compat (pages use user.id, user.email)
  session: any
  studentData: any
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  hostelId: null,
  signOut: () => {},
  loading: true,
  session: null,
  studentData: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const stored = getStoredUser()

    if (token && stored) {
      setUser(stored)
      // Refresh from server in background
      apiAuth.me()
        .then(fresh => { setUser(fresh); setStoredUser(fresh) })
        .catch(() => { clearToken(); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const signOut = () => {
    clearToken()
    setUser(null)
    window.location.href = '/auth'
  }

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    hostelId: user?.hostel_id ?? null,
    signOut,
    loading,
    session: user ? { user } : null,   // legacy compat
    studentData: null,
  }

  return (
    <AuthContext.Provider value={value}>
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
