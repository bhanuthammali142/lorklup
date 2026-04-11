// @ts-nocheck
import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Bed, Wallet, BarChart3, Settings, LogOut, CheckSquare, MessageSquareWarning, Megaphone, ShieldCheck } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Rooms & Beds', href: '/rooms', icon: Bed },
  { name: 'Fees', href: '/fees', icon: Wallet },
  { name: 'Attendance', href: '/attendance', icon: CheckSquare },
  { name: 'Complaints', href: '/complaints', icon: MessageSquareWarning },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight text-slate-900">HostelOS</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-colors", 
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )} 
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 shadow-sm bg-slate-50">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm uppercase">
            {user?.email?.charAt(0) ?? 'H'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate">{user?.email ?? 'Owner'}</span>
            <span className="text-xs text-slate-500">Pro Plan</span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
