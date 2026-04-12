// @ts-nocheck
/**
 * STUDENT DASHBOARD — Home
 * Shows ONLY this student's personal data.  No admin stats.
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, Bed, Bell, Calendar, Clock, CheckCircle2,
  ArrowRight, AlertTriangle, UtensilsCrossed, MessageSquareWarning,
  Sparkles, TrendingUp, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export function StudentDashboard() {
  const { studentData } = useAuth()
  const navigate = useNavigate()

  const [fees, setFees] = useState<any[]>([])
  const [recentComplaints, setRecentComplaints] = useState<any[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([])
  const [attendancePct, setAttendancePct] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentData?.id || !studentData?.hostel_id) return

    const load = async () => {
      const [feeRes, compRes, annRes, attRes] = await Promise.all([
        supabase.from('fees').select('*').eq('student_id', studentData.id).order('month', { ascending: false }),
        supabase.from('complaints').select('id,title,status,created_at').eq('student_id', studentData.id).order('created_at', { ascending: false }).limit(2),
        supabase.from('announcements').select('id,title,message,created_at').eq('hostel_id', studentData.hostel_id).order('created_at', { ascending: false }).limit(2),
        supabase.from('attendance').select('status').eq('student_id', studentData.id),
      ])

      setFees(feeRes.data || [])
      setRecentComplaints(compRes.data || [])
      setRecentAnnouncements(annRes.data || [])

      if (attRes.data && attRes.data.length > 0) {
        const pct = Math.round((attRes.data.filter(a => a.status === 'present').length / attRes.data.length) * 100)
        setAttendancePct(pct)
      }

      setLoading(false)
    }

    load()
  }, [studentData])

  if (!studentData) return null

  const totalDue = fees.reduce((s, f) => s + Number(f.due_amount), 0)
  const totalPaid = fees.reduce((s, f) => s + Number(f.paid_amount), 0)
  const totalBill = fees.reduce((s, f) => s + Number(f.amount), 0)
  const paidPct = totalBill > 0 ? Math.round((totalPaid / totalBill) * 100) : 100
  const nextDue = fees.find(f => f.status === 'pending' || f.status === 'overdue')
  const overdueFees = fees.filter(f => f.status === 'overdue')

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Welcome Banner ─────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-slate-400 text-sm font-medium mb-1">Good day,</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
            {studentData.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-400 text-sm">
            {studentData.rooms?.floor ? `${studentData.rooms.floor} · ` : ''}Room <strong className="text-slate-200">{studentData.rooms?.room_number ?? '—'}</strong> · Bed <strong className="text-slate-200">{studentData.beds?.bed_number ?? '—'}</strong>
          </p>
          {overdueFees.length > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 rounded-xl px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="text-sm text-rose-300 font-semibold">
                {overdueFees.length} overdue fee{overdueFees.length > 1 ? 's' : ''} — Pay immediately to avoid penalty
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Stats Row ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Floor / Room',
            value: studentData.rooms ? `${studentData.rooms.floor ? `${studentData.rooms.floor} / ` : ''}${studentData.rooms.room_number}` : 'N/A',
            sub: `Bed ${studentData.beds?.bed_number ?? '—'}`,
            icon: Bed,
            color: 'bg-indigo-50 text-indigo-600',
          },
          {
            label: 'Attendance',
            value: loading ? '...' : attendancePct !== null ? `${attendancePct}%` : 'N/A',
            sub: 'Present Rate',
            icon: Calendar,
            color: attendancePct !== null && attendancePct < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Total Due',
            value: loading ? '...' : fmt(totalDue),
            sub: totalDue === 0 ? 'All Clear ✅' : 'Outstanding',
            icon: Wallet,
            color: totalDue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Complaints',
            value: loading ? '...' : String(recentComplaints.length > 0 ? recentComplaints.filter(c => c.status !== 'resolved').length : 0),
            sub: 'Pending Issues',
            icon: MessageSquareWarning,
            color: 'bg-amber-50 text-amber-600',
          },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className={`text-xl font-black text-slate-900 mt-0.5 ${loading ? 'animate-pulse text-slate-200' : ''}`}>{card.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Fee Status Card ─────────────────────── */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition" onClick={() => navigate('/student/fees')}>
          <div className="absolute -top-8 -right-8 h-32 w-32 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="flex items-start justify-between mb-5 relative">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Outstanding Dues</p>
              <p className="text-4xl font-black tracking-tighter">{loading ? '...' : fmt(totalDue)}</p>
            </div>
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
              <span>PAID: {paidPct}%</span>
              <span>TOTAL: {fmt(totalBill)}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>

          {nextDue && (
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2 mb-4">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-300 font-semibold">
                Due by {new Date(nextDue.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {fmt(Number(nextDue.due_amount))}
              </span>
            </div>
          )}

          {totalDue > 0 ? (
            <button className="w-full bg-white text-slate-900 font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition shadow-[0_4px_14px_rgba(255,255,255,0.15)] active:scale-[0.98]">
              Pay Now <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-full bg-emerald-500/20 border border-emerald-500/30 py-3 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">All fees cleared!</span>
            </div>
          )}
        </div>

        {/* ── Recent Announcements ───────────────── */}
        <div
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
          onClick={() => navigate('/student/announcements')}
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Announcements</h3>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No new notices.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentAnnouncements.map(a => (
                <div key={a.id} className="px-5 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── My Recent Complaints ───────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4 text-rose-500" />
              <h3 className="font-bold text-slate-900">My Complaints</h3>
            </div>
            <button
              onClick={() => navigate('/student/complaints')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Raise Issue <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400 opacity-50" />
              <p className="text-sm font-medium">No complaints. All good! 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentComplaints.map(c => (
                <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c.title}</p>
                    <p className="text-[11px] text-slate-400">{new Date(c.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                    c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                    c.status === 'in-progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Actions ──────────────────────── */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" /> Quick Actions
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'View Full Fee History', path: '/student/fees', icon: Wallet, color: 'bg-blue-600' },
              { label: "Today's Food Menu", path: '/student/food', icon: UtensilsCrossed, color: 'bg-emerald-600' },
              { label: 'Raise a Complaint', path: '/student/complaints', icon: MessageSquareWarning, color: 'bg-rose-600' },
              { label: 'View All Announcements', path: '/student/announcements', icon: Bell, color: 'bg-indigo-600' },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all text-left active:scale-[0.98]"
                >
                  <div className={`h-7 w-7 ${action.color} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{action.label}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
