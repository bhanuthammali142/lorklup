// @ts-nocheck
import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Bed,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  CheckSquare,
  MessageSquareWarning,
  Megaphone,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Rooms & Beds', href: '/admin/rooms', icon: Bed },
  { name: 'Fees', href: '/admin/fees', icon: Wallet },
  { name: 'Attendance', href: '/admin/attendance', icon: CheckSquare },
  { name: 'Complaints', href: '/admin/complaints', icon: MessageSquareWarning },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`flex h-screen flex-col border-r border-slate-200 bg-white/90 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5 text-blue-600">
            <ShieldCheck className="h-6 w-6 shrink-0" />
            <span className="text-xl font-black tracking-tight text-slate-900">HostelOS</span>
          </div>
        )}
        {collapsed && <ShieldCheck className="h-6 w-6 text-blue-600 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="mx-4 mt-3 mb-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Admin Portal</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                {!collapsed && <span>{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
              {user?.email?.charAt(0) ?? 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">{user?.email}</span>
              <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
