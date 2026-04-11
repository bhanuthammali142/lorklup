// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { MessageSquareWarning, Clock, Wrench, CheckCircle2, Loader2, AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getComplaints, updateComplaintStatus } from '../lib/api'
import type { Complaint } from '../types'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'high') return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200"><AlertOctagon className="h-3 w-3"/> High</span>
  if (priority === 'medium') return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200"><AlertTriangle className="h-3 w-3"/> Med</span>
  return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"><AlertCircle className="h-3 w-3"/> Low</span>
}

export function Complaints() {
  const { user } = useAuth()
  const [hostelId, setHostelId] = useState<string | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async (hId: string) => {
    setLoading(true)
    try {
      const data = await getComplaints(hId)
      setComplaints(data as Complaint[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(h => { if (h) { setHostelId(h.id); fetchData(h.id) } })
  }, [user])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateComplaintStatus(id, { status: newStatus })
      toast.success('Status updated!')
      if (hostelId) fetchData(hostelId)
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const columns = [
    { title: 'Pending', status: 'pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { title: 'In Progress', status: 'in-progress', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Resolved', status: 'resolved', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquareWarning className="h-8 w-8 text-rose-600" /> Issue Board
          </h1>
          <p className="text-slate-500 mt-1">Track and resolve student complaints efficiently.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-400"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columns.map(col => {
            const colItems = complaints.filter(c => c.status === col.status)
            const Icon = col.icon
            return (
              <div key={col.status} className="card-premium flex flex-col h-full bg-slate-50/50">
                <div className={cn("p-4 border-b flex justify-between items-center", col.border, col.bg)}>
                  <h3 className={cn("font-bold flex items-center gap-2", col.color)}>
                    <Icon className="h-5 w-5" /> {col.title}
                  </h3>
                  <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs font-bold text-slate-700">{colItems.length}</span>
                </div>
                
                <div className="p-4 flex-1 space-y-4">
                  {colItems.length === 0 ? (
                     <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">No tickets</div>
                  ) : colItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3 cursor-default hover:shadow-md transition">
                      <div className="flex justify-between items-start gap-2">
                        <PriorityBadge priority={item.priority} />
                        <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 leading-tight">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 pb-2 border-b border-slate-100">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700">{item.students?.full_name}</span>
                          <span className="text-[10px] text-slate-500">Room {item.students?.rooms?.room_number ?? 'N/A'}</span>
                        </div>
                        
                        <div className="flex gap-1">
                          {col.status !== 'pending' && <button onClick={() => handleUpdateStatus(item.id, 'pending')} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-amber-600" title="Move to Pending"><Clock className="h-4 w-4" /></button>}
                          {col.status !== 'in-progress' && <button onClick={() => handleUpdateStatus(item.id, 'in-progress')} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-blue-600" title="Move to In Progress"><Wrench className="h-4 w-4" /></button>}
                          {col.status !== 'resolved' && <button onClick={() => handleUpdateStatus(item.id, 'resolved')} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-emerald-600" title="Mark as Resolved"><CheckCircle2 className="h-4 w-4" /></button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
