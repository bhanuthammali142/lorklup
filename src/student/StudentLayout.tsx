// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  MessageSquareWarning,
  User,
  LogOut,
  Bell,
  UtensilsCrossed,
  ShieldCheck,
  Menu,
  X,
  Eye,
  EyeOff,
  Lock,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

// Bottom nav tabs (mobile) — keep to 5 max
const BOTTOM_NAV = [
  { name: 'Home',       href: '/student/dashboard',     icon: LayoutDashboard },
  { name: 'Fees',       href: '/student/fees',          icon: Wallet },
  { name: 'Complaints', href: '/student/complaints',    icon: MessageSquareWarning },
  { name: 'Notices',    href: '/student/announcements', icon: Bell },
  { name: 'Profile',    href: '/student/profile',       icon: User },
]

const NAV = [
  { name: 'Home',        href: '/student/dashboard',      icon: LayoutDashboard,      end: true },
  { name: 'My Fees',     href: '/student/fees',           icon: Wallet,               end: false },
  { name: 'Complaints',  href: '/student/complaints',     icon: MessageSquareWarning, end: false },
  { name: 'Notices',     href: '/student/announcements',  icon: Bell,                 end: false },
  { name: 'Food Menu',   href: '/student/food',           icon: UtensilsCrossed,      end: false },
  { name: 'Profile',     href: '/student/profile',        icon: User,                 end: false },
]

// ── Password Change Prompt ────────────────────────────────────────────────────
function ChangePasswordPrompt({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [saving, setSaving]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8)     return toast.error('Password must be at least 8 characters')
    if (password !== confirm)    return toast.error('Passwords do not match')
    setSaving(true)
    try {
      // Password update via API
      const { apiAuth } = await import('../lib/api-client')
      await apiAuth.changePassword(password)
      toast.success('Password updated! Welcome to HostelOS.')
      onDone()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Set Your Password</h1>
          <p className="text-sm text-slate-500 text-center">
            You're using a temporary password. Please set a permanent one to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={8}
                placeholder="Min 8 characters"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required minLength={8}
              placeholder="Re-enter password"
              className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:opacity-90 transition flex items-center justify-center gap-2 mt-2"
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── StudentLayout ─────────────────────────────────────────────────────────────
export function StudentLayout() {
  const { signOut, studentData } = useAuth()
  const initial = studentData?.full_name?.charAt(0)?.toUpperCase() || 'S'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mustChangeDone, setMustChangeDone] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Show error if studentData never loads
  if (!studentData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#fcfcfd] flex-col gap-4 p-6 text-center">
        <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mb-2">
          <MessageSquareWarning className="h-8 w-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Database Security Error</h2>
        <p className="text-slate-500 max-w-md">
          You are logged in, but the database's <strong>Row Level Security (RLS)</strong> policies are blocking
          you from seeing your own student profile. Please contact your hostel admin.
        </p>
        <button onClick={signOut} className="mt-4 btn-primary">Sign Out</button>
      </div>
    )
  }

  // Show password change prompt for new students
  if (studentData.must_change_password && !mustChangeDone) {
    return <ChangePasswordPrompt onDone={() => setMustChangeDone(true)} />
  }

  const SidebarContent = ({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) => (
    <div className="flex h-full flex-col w-64 bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="px-5 py-4 h-14 md:h-16 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#2563eb] to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight">HostelOS</span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-black text-blue-700 shrink-0 border border-blue-200">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{studentData?.full_name || 'Student'}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {studentData?.rooms ? `${studentData.rooms.floor || 'Floor'} · Rm ${studentData.rooms.room_number}` : 'Room —'} · Bed {studentData?.beds?.bed_number ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto w-full">
        {NAV.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px]',
              isActive
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#fcfcfd] relative overflow-hidden text-[#111827]">

      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:block z-20">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden w-64 bg-white ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <SidebarContent isMobile onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 md:h-16 items-center justify-between px-4 sm:px-6 md:px-8 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
              {NAV.find(n => n.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">
                {studentData?.is_verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area — pb-20 leaves room for mobile bottom tab bar */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-24 md:pb-8 mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex items-stretch safe-area-inset-bottom">
          {BOTTOM_NAV.map(item => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/student/dashboard'}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 text-[10px] font-semibold transition-colors',
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-5 w-5', isActive && 'text-blue-600')} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
