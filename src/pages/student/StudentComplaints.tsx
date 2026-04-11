import React, { useEffect, useState } from 'react'
import { MessageSquareWarning, Plus, Send, Loader2, Clock, Wrench, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Complaint } from '../../types'
import toast from 'react-hot-toast'

export function StudentComplaints() {
  const { studentData } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchData = async (sId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('student_id', sId)
      .order('created_at', { ascending: false })
    
    setComplaints((data as Complaint[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    if (studentData) fetchData(studentData.id)
  }, [studentData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentData || !title || !description) return
    setAdding(true)
    try {
      const { error } = await supabase.from('complaints').insert({
        hostel_id: studentData.hostel_id,
        student_id: studentData.id,
        title,
        description,
        priority: 'low',
        status: 'pending'
      })
      if (error) throw error
      toast.success('Complaint submitted successfully')
      setTitle('')
      setDescription('')
      fetchData(studentData.id)
    } catch {
      toast.error('Failed to submit complaint')
    } finally {
      setAdding(false)
    }
  }

  if (!studentData) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <MessageSquareWarning className="h-8 w-8 text-rose-600" /> Complaints
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Raise issues directly to management and track resolution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Raise Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 lg:sticky lg:top-6">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Raise Issue
            </h3>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Issue Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. AC not cooling"
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Detailed Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} placeholder="Describe the problem clearly..."
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
            </div>

            <button type="submit" disabled={adding} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {adding ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="h-4 w-4" /> Submit Issue</>}
            </button>
          </form>
        </div>

        {/* Complaints List */}
        <div className="lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4 px-2">Your Past Complaints</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1,2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl" />)}
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              No issues tracked. Everything looks good!
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                    {c.status === 'pending' && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-700"><Clock className="h-3 w-3"/> Pending</span>}
                    {c.status === 'in-progress' && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-blue-100 text-blue-700"><Wrench className="h-3 w-3"/> In Progress</span>}
                    {c.status === 'resolved' && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3"/> Resolved</span>}
                  </div>
                  <div className="pr-24">
                    <h4 className="font-bold text-slate-900">{c.title}</h4>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Submitted on {new Date(c.created_at).toLocaleDateString('en-IN')}</p>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
