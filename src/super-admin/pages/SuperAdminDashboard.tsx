// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CreditCard, Users, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
const supabase = supabaseAdmin // Super Admin bypasses RLS

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalHostels: 0,
    activeStudents: 0,
    platformRevenue: 0,
    openTickets: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentHostels, setRecentHostels] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      const [hostelsRes, studentsRes] = await Promise.all([
        supabase.from('hostels').select('*', { count: 'exact' }),
        supabase.from('students').select('*', { count: 'exact' }),
      ])

      let openTickets = 0
      try {
        const { count } = await supabase
          .from('platform_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')
        openTickets = count || 0
      } catch (_) {}

      const hostels = hostelsRes.data || []
      setStats({
        totalHostels: hostelsRes.count || 0,
        activeStudents: studentsRes.count || 0,
        platformRevenue: (hostelsRes.count || 0) * 5000,
        openTickets,
      })
      setRecentHostels(hostels.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5))
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Command Center</h1>
        <p className="text-slate-500 mt-1 font-medium">Monitor and manage all HostelOS tenants from one dashboard.</p>
      </div>

      {/* ── KPI Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Hostels', value: stats.totalHostels, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Total Students', value: stats.activeStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Monthly MRR', value: fmt(stats.platformRevenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Support Tickets', value: stats.openTickets, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className={`bg-white rounded-2xl p-5 border ${stat.border} shadow-sm relative overflow-hidden group`}>
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-50 group-hover:opacity-100 transition duration-500`} />
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4 relative z-10`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-black text-slate-900 mt-1 ${loading ? 'animate-pulse text-slate-200' : ''}`}>
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Recent Hostels Onboarded ───────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" /> Recently Onboarded Hostels
            </h3>
            <button onClick={() => navigate('/superadmin/hostels')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : recentHostels.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No hostels onboarded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentHostels.map(hostel => (
                  <div key={hostel.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
                        {hostel.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{hostel.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 tracking-wide">ID: {hostel.id.substring(0,8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(hostel.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── System Status / Subscriptions ──────────── */}
        <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden relative border border-slate-800">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[50px]" />
          
          <div className="p-6 relative z-10">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-400" /> Subscription Health
            </h3>

            <div className="space-y-5">
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    <span>Active Subscriptions</span>
                    <span className="text-white">{loading ? '...' : stats.totalHostels}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }}></div>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    <span>Trialing Hostels</span>
                    <span className="text-white">0</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }}></div>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    <span>Churned (Past 30d)</span>
                    <span className="text-white">0</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '0%' }}></div>
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <button onClick={() => navigate('/superadmin/subscriptions')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                Manage Billing Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
