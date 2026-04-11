// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getRevenueByMonth, getOccupancyByMonth, getDashboardStats } from '../lib/api'
import toast from 'react-hot-toast'

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export function Analytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<{ name: string; amount: number }[]>([])
  const [occupancyData, setOccupancyData] = useState<{ name: string; value: number }[]>([])
  const [stats, setStats] = useState({ totalStudents: 0, totalBeds: 0, occupiedBeds: 0, monthlyRevenue: 0, pendingFees: 0, overdueFees: 0 })

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(async h => {
      if (!h) return
      setLoading(true)
      const [rev, occ, st] = await Promise.all([
        getRevenueByMonth(h.id),
        getOccupancyByMonth(h.id),
        getDashboardStats(h.id),
      ])
      setRevenueData(rev)
      setOccupancyData(occ)
      setStats(st)
      setLoading(false)
    })
  }, [user])

  const occupancyRate = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">AI-powered insights and business intelligence.</p>
        </div>
        <button onClick={() => toast.success('Generating AI report...')} className="flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-100 transition-colors">
          <Sparkles className="h-4 w-4" />Generate AI Report
        </button>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: loading ? '...' : String(stats.totalStudents) },
          { label: 'Occupancy Rate', value: loading ? '...' : `${occupancyRate}%` },
          { label: 'Monthly Revenue', value: loading ? '...' : fmt(stats.monthlyRevenue) },
          { label: 'Overdue Fees', value: loading ? '...' : fmt(stats.overdueFees) },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">{k.label}</p>
            <h3 className={`text-2xl font-bold mt-1 ${loading ? 'text-slate-200 animate-pulse' : 'text-slate-900'}`}>{k.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="card-premium col-span-2 p-6 flex flex-col h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Revenue Collected</h2>
              <p className="text-sm text-slate-500">By month (paid fees only)</p>
            </div>
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-300"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : revenueData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No paid fees recorded yet.</div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `₹${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [fmt(Number(v)), 'Revenue']} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card-premium p-6 flex flex-col bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">AI Insights</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div className="bg-white/80 p-4 rounded-xl border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 text-purple-800 font-semibold text-sm mb-1">
                <TrendingUp className="h-4 w-4" /> Revenue Forecast
              </div>
              <p className="text-sm text-slate-600">
                {stats.monthlyRevenue > 0
                  ? `Based on current data, projected next-month revenue is ${fmt(Math.round(stats.monthlyRevenue * 1.05))}.`
                  : 'Start recording fee payments to unlock revenue forecasts.'}
              </p>
            </div>
            {stats.overdueFees > 0 && (
              <div className="bg-white/80 p-4 rounded-xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-1">
                  <AlertCircle className="h-4 w-4" /> Overdue Warning
                </div>
                <p className="text-sm text-slate-600">{fmt(stats.overdueFees)} in overdue fees. Send reminders to improve collection.</p>
              </div>
            )}
            <div className="bg-white/80 p-4 rounded-xl border border-emerald-100 shadow-sm">
              <div className="text-emerald-800 font-semibold text-sm mb-1">🏠 Occupancy</div>
              <p className="text-sm text-slate-600">
                {stats.totalBeds === 0
                  ? 'Add rooms and beds to track occupancy.'
                  : `Occupancy is at ${occupancyRate}%. ${occupancyRate < 80 ? 'Market vacant beds to boost revenue.' : 'Excellent utilization!'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Occupancy Area Chart */}
        <div className="card-premium p-6 col-span-1 lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Bed Occupancy Rate</h2>
            <p className="text-sm text-slate-500">Live snapshot across months</p>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-300"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`${Number(v)}%`, 'Occupancy']} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colOcc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
