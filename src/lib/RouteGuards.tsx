// @ts-nocheck
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Loader2, ShieldAlert } from 'lucide-react'

/**
 * AdminRoute — protects all /admin/* routes.
 *
 * Access matrix:
 *   - Not logged in  → /auth
 *   - role=student   → /student/dashboard  (cross-role block)
 *   - role=null      → error state (no profile found — never default to admin)
 *   - role=admin     → renders admin page
 */
export function AdminRoute() {
  const { user, role, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  // STRICT: students cannot access any admin routes
  if (role === 'student') return <Navigate to="/student/dashboard" replace />

  // role === null means no profile row found — DO NOT default to admin
  if (role === null) {
    return <UnauthorizedScreen onSignOut={signOut} message="Your account does not have an admin role. Please contact support or check your login credentials." />
  }

  return <Outlet />
}

/**
 * StudentRoute — protects all /student/* routes.
 *
 * Access matrix:
 *   - Not logged in  → /auth
 *   - role=admin     → /admin/dashboard  (cross-role block)
 *   - role=null      → error state (no profile found)
 *   - role=student   → renders student page
 */
export function StudentRoute() {
  const { user, role, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  // STRICT: admins cannot access any student routes
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />

  // role === null means no profile row found
  if (role === null) {
    return <UnauthorizedScreen onSignOut={signOut} message="Your account role could not be verified. Please sign in again or contact your hostel administrator." />
  }

  return <Outlet />
}

/** Shown when role=null — prevents a blank/broken screen */
function UnauthorizedScreen({
  onSignOut,
  message,
}: {
  onSignOut: () => Promise<void>
  message: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 max-w-md w-full text-center">
        <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-7 w-7 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Role Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <button
          onClick={onSignOut}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Sign Out & Try Again
        </button>
      </div>
    </div>
  )
}
