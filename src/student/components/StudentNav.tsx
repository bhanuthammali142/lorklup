import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, MessageSquareWarning, User, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

/**
 * StudentBottomNav — mobile-optimized tab bar exclusively for students.
 * Never rendered in admin context.
 */

const NAV = [
  { name: 'Home', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Fees', href: '/student/fees', icon: Wallet },
  { name: 'Issues', href: '/student/complaints', icon: MessageSquareWarning },
  { name: 'Profile', href: '/student/profile', icon: User },
]

export function StudentNav() {
  const { studentData, signOut } = useAuth()

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-50 bg-slate-900 text-white px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-lg flex items-center justify-center font-black text-sm">
            {studentData?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Student Portal</p>
            <p className="text-sm font-bold leading-tight">{studentData?.full_name || 'Student'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col text-slate-300 border-r border-slate-800 shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">HostelOS</p>
          <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Student Portal
          </span>
        </div>

        {/* Student info card */}
        <div className="mx-4 my-4 p-4 rounded-2xl bg-slate-800 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-black text-white shrink-0">
              {studentData?.full_name?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{studentData?.full_name || 'Student'}</p>
              <p className="text-[11px] text-slate-400 font-medium">
                Room {studentData?.rooms?.room_number ?? 'Unassigned'} · Bed {studentData?.beds?.bed_number ?? 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center px-2 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-2xl min-w-[3.5rem] transition-all ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl mb-0.5 transition-all ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
