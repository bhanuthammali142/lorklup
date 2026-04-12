import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './lib/AuthContext'
import { AdminRoute, StudentRoute, SuperAdminRoute } from './lib/RouteGuards'
import { ErrorBoundary } from './components/ErrorBoundary'

// ── Auth (shared entry point — loaded eagerly since it's the landing page) ──
import { AuthPage } from './auth/AuthPage'
import { AuthCallbackPage } from './auth/AuthCallbackPage'

// ── Code-split modules (loaded on demand) ────────────────────────────────────
// Admin
const AdminLayout      = lazy(() => import('./admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminDashboard   = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminDashboard })))
const AdminStudents    = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminStudents })))
const AdminRooms       = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminRooms })))
const AdminFees        = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminFees })))
const AdminAnalytics   = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminAnalytics })))
const AdminAttendance  = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminAttendance })))
const AdminComplaints  = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminComplaints })))
const AdminAnnouncements = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminAnnouncements })))
const AdminSettings    = lazy(() => import('./admin/pages/index').then(m => ({ default: m.AdminSettings })))

// Student
const StudentLayout       = lazy(() => import('./student/StudentLayout').then(m => ({ default: m.StudentLayout })))
const StudentDashboard    = lazy(() => import('./student/pages/index').then(m => ({ default: m.StudentDashboard })))
const StudentFees         = lazy(() => import('./student/pages/index').then(m => ({ default: m.StudentFees })))
const StudentComplaints   = lazy(() => import('./student/pages/index').then(m => ({ default: m.StudentComplaints })))
const StudentAnnouncements = lazy(() => import('./student/pages/index').then(m => ({ default: m.StudentAnnouncements })))
const StudentFoodMenu     = lazy(() => import('./student/pages/index').then(m => ({ default: m.StudentFoodMenu })))
const StudentProfile      = lazy(() => import('./student/pages/index').then(m => ({ default: m.StudentProfile })))

// Super Admin
const SuperAdminLayout        = lazy(() => import('./super-admin/SuperAdminLayout').then(m => ({ default: m.SuperAdminLayout })))
const SuperAdminDashboard     = lazy(() => import('./super-admin/pages/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })))
const SuperAdminHostels       = lazy(() => import('./super-admin/pages/SuperAdminHostels').then(m => ({ default: m.SuperAdminHostels })))
const SuperAdminSubscriptions = lazy(() => import('./super-admin/pages/SuperAdminSubscriptions').then(m => ({ default: m.SuperAdminSubscriptions })))
const SuperAdminTickets       = lazy(() => import('./super-admin/pages/SuperAdminTickets').then(m => ({ default: m.SuperAdminTickets })))
const SuperAdminSettings      = lazy(() => import('./super-admin/pages/SuperAdminSettings').then(m => ({ default: m.SuperAdminSettings })))

/** Suspense fallback — shown while lazy chunks load */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-400 font-medium">Loading module...</p>
      </div>
    </div>
  )
}

/**
 * App Router — Strict role-based routing with code splitting.
 *
 * /auth          → AuthPage (public)
 * /admin/*       → AdminRoute guard → AdminLayout → admin pages
 * /student/*     → StudentRoute guard → StudentLayout → student pages
 * /superadmin/*  → SuperAdminRoute guard → SuperAdminLayout → super admin pages
 *
 * Root / → /auth (unauthenticated redirect handled by guards)
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: '12px', background: '#1e293b', color: '#f8fafc', fontSize: '13px' },
            }}
          />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* ── Public Auth ──────────────────────────────────────────────── */}
              <Route path="/auth" element={<AuthPage />} />
              {/* Supabase redirects here after email invite/magic link */}
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* ── Admin Module ─────────────────────────────────────────────── */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="students" element={<AdminStudents />} />
                  <Route path="rooms" element={<AdminRooms />} />
                  <Route path="fees" element={<AdminFees />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* ── Student Module ───────────────────────────────────────────── */}
              <Route element={<StudentRoute />}>
                <Route path="/student" element={<StudentLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard"     element={<StudentDashboard />} />
                  <Route path="fees"          element={<StudentFees />} />
                  <Route path="complaints"    element={<StudentComplaints />} />
                  <Route path="announcements" element={<StudentAnnouncements />} />
                  <Route path="food"          element={<StudentFoodMenu />} />
                  <Route path="profile"       element={<StudentProfile />} />
                  <Route path="*"             element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* ── Super Admin Module ───────────────────────────────────────── */}
              <Route element={<SuperAdminRoute />}>
                <Route path="/superadmin" element={<SuperAdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                  <Route path="hostels" element={<SuperAdminHostels />} />
                  <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
                  <Route path="tickets" element={<SuperAdminTickets />} />
                  <Route path="settings" element={<SuperAdminSettings />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* ── Catch-all → auth ─────────────────────────────────────────── */}
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
