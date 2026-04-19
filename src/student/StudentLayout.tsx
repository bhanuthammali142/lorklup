// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
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
  X
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { cn } from '../lib/utils'

const NAV = [
  { name: 'Home',        href: '/student/dashboard',      icon: LayoutDashboard,      end: true },
  { name: 'My Fees',     href: '/student/fees',           icon: Wallet,               end: false },
  { name: 'Complaints',  href: '/student/complaints',     icon: MessageSquareWarning, end: false },
  { name: 'Notices',     href: '/student/announcements',  icon: Bell,                 end: false },
  { name: 'Food Menu',   href: '/student/food',           icon: UtensilsCrossed,      end: false },
  { name: 'Profile',     href: '/student/profile',        icon: User,                 end: false },
]

export function StudentLayout() {
  const { signOut, studentData, user } = useAuth()
  const initial = studentData?.full_name?.charAt(0)?.toUpperCase() || 'S'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  
  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  if (!studentData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#fcfcfd] flex-col gap-4 p-6 text-center">
        <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mb-2">
          <MessageSquareWarning className="h-8 w-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Database Security Error</h2>
        <p className="text-slate-500 max-w-md">
          You are logged in, but the database's <strong>Row Level Security (RLS)</strong> policies are blocking you from seeing your own student profile.
        </p>
        <button onClick={signOut} className="mt-4 btn-primary">
          Sign Out
        </button>
      </div>
    )
  }

  const SidebarContent = ({ isMobile, onClose }: { isMobile?: boolean, onClose?: () => void }) => (
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
            <item.icon className="h-4.5 w-4.5 shrink-0" />
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
      
      {/* Desktop Sidebar */}
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
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden w-64 bg-white ${mobileMenuOpen ? 'translate-x-0 cursor-default shadow-2xl' : '-translate-x-full'}`}>
        <SidebarContent isMobile onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 md:h-16 items-center justify-between px-4 sm:px-6 md:px-8 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
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
              <span className="text-[10px] font-bold text-emerald-700">Verified</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] px-4 sm:px-6 md:px-8 py-6 sm:py-8 mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
