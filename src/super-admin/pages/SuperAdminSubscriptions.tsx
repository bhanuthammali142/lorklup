// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { CreditCard, CheckCircle2, Clock, Building2, TrendingUp } from 'lucide-react'

import toast from 'react-hot-toast'

const PLANS = [
  { name: 'Starter',    price: 999,  color: 'bg-slate-100 text-slate-700', max: '≤50 students' },
  { name: 'Growth',     price: 2999, color: 'bg-blue-100 text-blue-700',   max: '≤200 students' },
  { name: 'Enterprise', price: 7999, color: 'bg-indigo-100 text-indigo-700', max: 'Unlimited' },
]

export function SuperAdminSubscriptions() {
  const [hostels, setHostels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('hostels').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setHostels(data || []); setLoading(false) })
  }, [])

  const totalMRR = hostels.length * 2999

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-indigo-600" /> Subscriptions & billing
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Track all hostel subscription plans and platform revenue.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Monthly recurring revenue', value: `₹${totalMRR.toLocaleString()}`, icon: TrendingUp, color: 'from-indigo-600 to-purple-600' },
          { label: 'Active subscribers',         value: hostels.length,                 icon: CheckCircle2, color: 'from-emerald-600 to-teal-600' },
          { label: 'Pending payments',            value: 0,                              icon: Clock,        color: 'from-amber-500 to-orange-500' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg`}>
              <Icon className="h-6 w-6 mb-3 opacity-80" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">{s.label}</p>
              <p className="text-3xl font-black mt-1">{loading ? '...' : s.value}</p>
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Available plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${plan.color}`}>{plan.name}</span>
              <p className="text-3xl font-black text-slate-900 mt-4">
                ₹{plan.price.toLocaleString()}<span className="text-sm text-slate-400 font-medium">/mo</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{plan.max}</p>
              <button onClick={() => toast('Plan assignment UI coming in a future release. Contact support@hostelos.com to assign manually.', { icon: '📋', duration: 5000 })} className="mt-4 w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 transition">
                Assign to hostel
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" /> Hostel subscriptions
          </h3>
        </div>
        <div className="md:overflow-x-auto">
          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-slate-50/50">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-slate-400">Loading...</div>
            ) : hostels.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No subscribers yet.</div>
            ) : (
              hostels.map(h => (
                <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <p className="font-bold text-slate-900 truncate flex-1">{h.name}</p>
                    <span className="inline-flex shrink-0 items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs font-semibold mb-0.5">Plan</span>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full w-max">Growth</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-slate-400 text-xs font-semibold mb-0.5">Amount</span>
                      <span className="font-bold text-slate-700">₹2,999</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <table className="w-full text-sm text-left hidden md:table">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Hostel</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center animate-pulse text-slate-400">Loading...</td></tr>
              ) : hostels.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No subscribers yet.</td></tr>
              ) : (
                hostels.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{h.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Growth</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">₹2,999</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
