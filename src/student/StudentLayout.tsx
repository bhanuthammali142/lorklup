// @ts-nocheck
/**
 * STUDENT PORTAL — Layout
 * ─────────────────────────────────────────────────────────────────
 * TEAM RULES (NON-NEGOTIABLE):
 *   1. NEVER import from /admin/* — student and admin are isolated modules
 *   2. NEVER show hostel-wide data (no total students, no all-fees, no all-complaints)
 *   3. All data must be filtered by student's own student_id or hostel_id (read-only)
 *   4. Student can: view announcements, view food menu, pay fees, raise complaints
 *   5. Student CANNOT: see other students, change hostel settings, view analytics
 * ─────────────────────────────────────────────────────────────────
 */

import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  MessageSquareWarning,
  User,
  LogOut,
  Bell,
  UtensilsCrossed,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { cn } from '../../lib/utils'

const NAV = [
  { name: 'Home',        href: '/student/dashboard',      icon: LayoutDashboard,      end: true },
  { name: 'My Fees',     href: '/student/fees',           icon: Wallet,               end: false },
  { name: 'Complaints',  href: '/student/complaints',     icon: MessageSquareWarning, end: false },
  { name: 'Notices',     href: '/student/announcements',  icon: Bell,                 end: false },
  { name: 'Food Menu',   href: '/student/food',           icon: UtensilsCrossed,      end: false },
  { name: 'Profile',     href: '/student/profile',        icon: User,                 end: false },
]

export function StudentLayout() {
  const { signOut, studentData } = useAuth()
  const initial = studentData?.full_name?.charAt(0)?.toUpperCase() || 'S'

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row overflow-hidden">

      {/* ── Mobile Header ─────────────────────────────── */}
      <header className="md:hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-3 flex justify-between items-center shadow-lg z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center font-black text-sm shadow">
            {initial}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">Student Portal</p>
            <p className="text-sm font-bold leading-tight">{studentData?.full_name?.split(' ')[0] || 'Student'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2.5 py-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">Verified</span>
          </div>
          <button onClick={signOut} className="p-2 hover:bg-slate-700 rounded-xl transition">
            <LogOut className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </header>

      {/* ── Desktop Sidebar ───────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-slate-900 to-slate-950 flex-col shrink-0 border-r border-slate-800">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">HostelOS</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center font-black text-white shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{studentData?.full_name || 'Student'}</p>
              <p className="text-[11px] text-slate-400 truncate">
                Room {studentData?.rooms?.room_number ?? '—'} · Bed {studentData?.beds?.bed_number ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full min-h-full pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-30">
        <div className="flex justify-around items-center px-1 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              className={({ isActive }) => cn(
                'flex flex-col items-center justify-center px-2 py-1.5 rounded-2xl transition-all min-w-[3.5rem]',
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn('p-1.5 rounded-xl mb-0.5 transition-all', isActive ? 'bg-blue-50' : '')}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className={cn('text-[9px] font-bold leading-none', isActive ? 'text-blue-600' : 'text-slate-400')}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
