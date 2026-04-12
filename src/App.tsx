import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './lib/AuthContext'
import { AdminRoute, StudentRoute, SuperAdminRoute } from './lib/RouteGuards'

// ── Auth (shared entry point) ────────────────────────────────────────────────
import { AuthPage } from './auth/AuthPage'
import { AuthCallbackPage } from './auth/AuthCallbackPage'

// ── Admin Module (self-contained) ────────────────────────────────────────────
import { AdminLayout } from './admin/AdminLayout'
import {
  AdminDashboard,
  AdminStudents,
  AdminRooms,
  AdminFees,
  AdminAnalytics,
  AdminAttendance,
  AdminComplaints,
  AdminAnnouncements,
  AdminSettings,
} from './admin/pages/index'

// ── Student Module (self-contained) ─────────────────────────────────────────
import { StudentLayout } from './student/StudentLayout'
import {
  StudentDashboard,
  StudentFees,
  StudentComplaints,
  StudentAnnouncements,
  StudentFoodMenu,
  StudentProfile,
} from './student/pages/index'
// ── Super Admin Module ────────────────────────────────────────────────────────
import { SuperAdminLayout } from './super-admin/SuperAdminLayout'
import { SuperAdminDashboard } from './super-admin/pages/SuperAdminDashboard'
import { SuperAdminHostels } from './super-admin/pages/SuperAdminHostels'
import { SuperAdminSubscriptions } from './super-admin/pages/SuperAdminSubscriptions'
import { SuperAdminTickets } from './super-admin/pages/SuperAdminTickets'
import { SuperAdminSettings } from './super-admin/pages/SuperAdminSettings'

/**
 * App Router — Strict role-based routing.
 *
 * /auth          → AuthPage (public)
 * /admin/*       → AdminRoute guard → AdminLayout → admin pages
 * /student/*     → StudentRoute guard → StudentLayout → student pages
 *
 * Root / → /auth (unauthenticated redirect handled by guards)
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', background: '#1e293b', color: '#f8fafc', fontSize: '13px' },
          }}
        />
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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
