// @ts-nocheck
import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, MessageSquareWarning, LogOut, User } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { cn } from '../../lib/utils'

const nav = [
  { name: 'Home', href: '/student', icon: LayoutDashboard },
  { name: 'My Fees', href: '/student/fees', icon: Wallet },
  { name: 'Complaints', href: '/student/complaints', icon: MessageSquareWarning },
  { name: 'Profile', href: '/student/profile', icon: User },
]

export function StudentLayout() {
  const { signOut, studentData } = useAuth()

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
            {studentData?.full_name?.charAt(0) || 'S'}
          </div>
          <span className="font-semibold">{studentData?.full_name || 'Student Portal'}</span>
        </div>
        <button onClick={signOut} className="p-1.5 hover:bg-slate-800 rounded-lg"><LogOut className="h-5 w-5"/></button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between text-slate-300">
        <div>
          <div className="p-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Student Portal
            </span>
          </div>
          <nav className="px-4 space-y-1">
            {nav.map((item) => (
              <NavLink key={item.name} to={item.href} end={item.href === '/student'}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800 hover:text-white"
                )}>
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button onClick={signOut} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0 relative">
        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-20">
        <div className="flex justify-around items-center px-2 py-3">
          {nav.map(item => (
            <NavLink key={item.name} to={item.href} end={item.href === '/student'}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-colors min-w-[4rem]",
                isActive ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}>
              <item.icon className={cn("h-5 w-5 mb-1")} />
              <span className="text-[10px] leading-tight">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
