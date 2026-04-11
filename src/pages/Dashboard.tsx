import React, { useEffect, useState } from 'react'
import { Users, Bed, CreditCard, TrendingUp, Sparkles, AlertCircle, BarChart3, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getDashboardStats } from '../lib/api'

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export function Dashboard() {
  const { user } = useAuth()
  const [hostelId, setHostelId] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalStudents: 0, totalBeds: 0, occupiedBeds: 0, monthlyRevenue: 0, pendingFees: 0, overdueFees: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(h => {
      if (h) setHostelId(h.id)
    })
  }, [user])

  useEffect(() => {
    if (!hostelId) return
    setLoading(true)
    getDashboardStats(hostelId)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [hostelId])

  const occupancyRate = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0

  const cards = [
    { name: 'Total Students', value: loading ? '...' : String(stats.totalStudents), icon: Users, change: 'Registered residents', positive: true },
    { name: 'Occupancy Rate', value: loading ? '...' : `${occupancyRate}%`, icon: Bed, change: `${stats.occupiedBeds} / ${stats.totalBeds} beds`, positive: true },
    { name: 'Monthly Revenue', value: loading ? '...' : fmt(stats.monthlyRevenue), icon: TrendingUp, change: 'Collected this month', positive: true },
    { name: 'Pending Fees', value: loading ? '...' : fmt(stats.pendingFees + stats.overdueFees), icon: CreditCard, change: `${fmt(stats.overdueFees)} overdue`, positive: false },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => hostelId && getDashboardStats(hostelId).then(setStats)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Refresh
          </button>
          <button onClick={() => toast('No new alerts.', { icon: '🔔' })} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            {stats.overdueFees > 0 ? 'Overdue Fees!' : 'No Alerts'}
          </button>
          <button onClick={() => toast.success('Connecting to Gemini AI...')} className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow hover:bg-blue-700 transition-all">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card-premium p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <Icon className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <h3 className={`text-2xl font-bold tracking-tight mt-1 ${loading ? 'animate-pulse text-slate-300' : 'text-slate-900'}`}>{stat.value}</h3>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
                <span className={stat.positive ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                  {stat.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-premium flex flex-col col-span-2 min-h-[350px]">
          <div className="border-b border-slate-100 p-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Revenue Overview</h2>
          </div>
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <BarChart3 className="w-10 h-10 opacity-40" />
            <p className="text-sm">Full chart available in <a href="/admin/analytics" className="text-blue-500 hover:underline">Analytics</a></p>
          </div>
        </div>

        <div className="card-premium flex flex-col bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <div className="border-b border-purple-100 p-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">AI Suggestions</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {stats.overdueFees > 0 && (
              <div className="rounded-lg bg-rose-50 border border-rose-100 p-4">
                <h4 className="font-semibold text-rose-900 text-sm">⚠️ Overdue Fees</h4>
                <p className="text-sm text-rose-700 mt-1">{fmt(stats.overdueFees)} in overdue payments. Send WhatsApp reminders now.</p>
                <button onClick={() => toast.success('Sending WhatsApp reminders...')} className="mt-3 text-xs font-semibold bg-rose-600 text-white px-3 py-1.5 rounded hover:bg-rose-700 transition">Send Reminders</button>
              </div>
            )}
            {stats.pendingFees > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <h4 className="font-semibold text-blue-900 text-sm">📋 Pending Collection</h4>
                <p className="text-sm text-blue-700 mt-1">{fmt(stats.pendingFees)} pending this month. Follow up with students.</p>
                <button onClick={() => toast.success('Executing automated WhatsApp reminders...')} className="mt-3 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition">Execute Now</button>
              </div>
            )}
            {stats.pendingFees === 0 && stats.overdueFees === 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <h4 className="font-semibold text-emerald-900 text-sm">✅ All Clear!</h4>
                <p className="text-sm text-emerald-700 mt-1">No pending or overdue fees this month. Great collection rate!</p>
              </div>
            )}
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-4">
              <h4 className="font-semibold text-purple-900 text-sm">🏠 Occupancy</h4>
              <p className="text-sm text-purple-700 mt-1">Current occupancy is {occupancyRate}%. {occupancyRate < 80 ? 'Consider marketing to fill vacant beds.' : 'Excellent utilization!'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
