import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Ticket,
  CreditCard,
  LogOut,
  ShieldCheck,
  Settings,
  Menu,
  Terminal,
  X
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { cn } from '../lib/utils'
import { EdgeFunctionStatus } from '../components/EdgeFunctionStatus'

const BASE_NAV = [
  { name: 'Platform Overview', href: '/superadmin/dashboard', icon: LayoutDashboard, end: true },
  { name: 'Hostel Profiles', href: '/superadmin/hostels', icon: Building2, end: false },
  { name: 'Subscriptions', href: '/superadmin/subscriptions', icon: CreditCard, end: false },
  { name: 'Support Tickets', href: '/superadmin/tickets', icon: Ticket, end: false },
  { name: 'System Settings', href: '/superadmin/settings', icon: Settings, end: false },
]

export function SuperAdminLayout() {
  const { signOut, user } = useAuth()
  const initial = user?.email?.charAt(0).toUpperCase() || 'S'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [edgeOffline, setEdgeOffline] = useState(false)
  const location = useLocation()
  
  useEffect(() => {
    const checkEdge = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-operations`
        const res = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'ping' }) })
        setEdgeOffline(!(res.ok || res.status === 401 || res.status === 403))
      } catch {
        setEdgeOffline(true)
      }
    }
    checkEdge()
    const interval = setInterval(checkEdge, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const NAV = edgeOffline 
    ? [...BASE_NAV, { name: 'Deploy Guide', href: '/superadmin/deploy', icon: Terminal, end: false }] 
    : BASE_NAV

  const SidebarContent = ({ isMobile, onClose }: { isMobile?: boolean, onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 relative shadow-2xl">
      {/* Glow effect */}
      <div className="absolute top-0 -left-4 w-72 h-32 bg-indigo-500/20 blur-[60px] pointer-events-none" />

      {/* Logo */}
      <div className="px-5 py-4 h-14 md:h-16 border-b border-slate-800/60 relative z-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">HostelOS <span className="text-indigo-400">HQ</span></span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800/50">
            <X className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
      
      <div className="px-5 py-4 border-b border-slate-800/60 relative z-10">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center font-black text-white shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">Super Admin</p>
            <p className="text-[10px] text-emerald-400 truncate font-semibold uppercase tracking-widest">Platform Owner</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto w-full relative z-10">
        {NAV.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px]',
              isActive
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-800/60 relative z-10">
        <button
          onClick={signOut}
          className="flex items-center justify-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all min-h-[44px]"
        >
          <LogOut className="h-4 w-4" />
          Terminate Session
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#fcfcfd] relative overflow-hidden text-[#111827]">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 z-20 shrink-0">
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
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden w-64 bg-slate-950 ${mobileMenuOpen ? 'translate-x-0 cursor-default shadow-2xl' : '-translate-x-full'}`}>
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
              {NAV.find(n => n.href === location.pathname)?.name || 'HQ Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <EdgeFunctionStatus />
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1">
              <ShieldCheck className="h-3 w-3 text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-700">HQ Access</span>
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
