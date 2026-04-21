// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Ticket, CheckCircle2, Clock, Loader2, RefreshCw, Building2 } from 'lucide-react'

import toast from 'react-hot-toast'

const STATUS_COLORS = {
  open:          'bg-rose-50 text-rose-700',
  'in-progress': 'bg-amber-50 text-amber-700',
  resolved:      'bg-emerald-50 text-emerald-700',
}

export function SuperAdminTickets() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all')

  const load = async () => {
    setLoading(true)
    let q = supabase
      .from('platform_tickets')
      .select('*, hostels(name)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) {
      setTickets([])
    } else {
      setTickets(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('platform_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) toast.error('Failed to update ticket')
    else { toast.success('Ticket updated!'); load() }
  }

  const counts = {
    open: tickets.filter(t => t.status === 'open').length,
    'in-progress': tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-indigo-600" /> Support tickets
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage all hostel owner support requests in one place.</p>
        </div>
        <button onClick={load} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open',        count: counts.open,          color: 'border-rose-200 bg-rose-50',     text: 'text-rose-700' },
          { label: 'In progress', count: counts['in-progress'], color: 'border-amber-200 bg-amber-50',   text: 'text-amber-700' },
          { label: 'Resolved',    count: counts.resolved,      color: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`border ${s.color} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.text}`}>{s.count}</p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'in-progress', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${filter === f ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'}`}
          >
            {f === 'all' ? 'All tickets' : f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400 mx-auto" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No tickets found.</p>
            <p className="text-sm mt-1">When hostel owners submit support requests, they appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-5 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{ticket.subject}</p>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-semibold text-slate-400">
                          {ticket.hostels?.name || 'Unknown hostel'}
                        </span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS] || 'bg-slate-50 text-slate-600'}`}>
                      {ticket.status}
                    </span>
                    {ticket.status !== 'resolved' && (
                      <div className="flex gap-1">
                        {ticket.status === 'open' && (
                          <button onClick={() => updateStatus(ticket.id, 'in-progress')}
                            className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-100 transition">
                            Start
                          </button>
                        )}
                        <button onClick={() => updateStatus(ticket.id, 'resolved')}
                          className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-100 transition">
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
