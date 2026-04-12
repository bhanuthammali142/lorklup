import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Ticket,
  CreditCard,
  LogOut,
  ShieldCheck,
  Settings
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { cn } from '../lib/utils'

const NAV = [
  { name: 'Platform Overview', href: '/superadmin/dashboard', icon: LayoutDashboard, end: true },
  { name: 'Hostel Profiles', href: '/superadmin/hostels', icon: Building2, end: false },
  { name: 'Subscriptions', href: '/superadmin/subscriptions', icon: CreditCard, end: false },
  { name: 'Support Tickets', href: '/superadmin/tickets', icon: Ticket, end: false },
  { name: 'System Settings', href: '/superadmin/settings', icon: Settings, end: false },
]

export function SuperAdminLayout() {
  const { signOut, user } = useAuth()
  const initial = user?.email?.charAt(0).toUpperCase() || 'S'

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row overflow-hidden">
      {/* ── Mobile Header ─────────────────────────────── */}
      <header className="md:hidden bg-gradient-to-r from-slate-900 to-black text-white px-4 py-3 flex justify-between items-center z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-sm">
            {initial}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">Super Admin</p>
            <p className="text-sm font-bold leading-tight">HostelOS HQ</p>
          </div>
        </div>
        <button onClick={signOut} className="p-2 hover:bg-slate-800 rounded-xl transition">
          <LogOut className="h-4 w-4 text-slate-400" />
        </button>
      </header>

      {/* ── Desktop Sidebar ───────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-slate-950 flex-col shrink-0 border-r border-slate-800 relative shadow-2xl z-20">
        {/* Glow effect */}
        <div className="absolute top-0 -left-4 w-72 h-32 bg-indigo-500/20 blur-[60px] pointer-events-none" />

        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-800/60 relative z-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">HostelOS <span className="text-indigo-400">HQ</span></span>
          </div>
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
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto relative z-10">
          {NAV.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
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
            className="flex items-center justify-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 relative">
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full min-h-full pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-30">
        <div className="flex justify-around items-center px-1 py-2">
          {NAV.filter(n => ['Platform Overview', 'Hostel Profiles', 'Subscriptions'].includes(n.name)).map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              className={({ isActive }) => cn(
                'flex flex-col items-center justify-center px-2 py-1.5 rounded-2xl transition-all',
                isActive ? 'text-indigo-600' : 'text-slate-400'
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn('p-1.5 rounded-xl mb-0.5 transition-all', isActive ? 'bg-indigo-50' : '')}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-bold leading-none text-center">
                    {item.name.replace('Platform ', '').replace(' Profiles', '')}
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
