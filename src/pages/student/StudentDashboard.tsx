import React, { useEffect, useState } from 'react'
import { Bell, Bed, Wallet, AlertCircle, MessageSquareWarning, ArrowRight, Calendar, CheckCircle2, Clock, Plus, Loader2 } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

export function StudentDashboard() {
  const { studentData } = useAuth()
  
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [complaints, setComplaints] = useState<any[]>([])
  const [attendancePercent, setAttendancePercent] = useState(100)
  const [loading, setLoading] = useState(true)

  // Complaint State
  const [compTitle, setCompTitle] = useState('')
  const [compDesc, setCompDesc] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [showCompModal, setShowCompModal] = useState(false)

  const fetchData = async () => {
    if (!studentData?.hostel_id || !studentData?.id) return
    
    const [annRes, feeRes, compRes, attRes] = await Promise.all([
      supabase.from('announcements').select('*').eq('hostel_id', studentData.hostel_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('fees').select('*').eq('student_id', studentData.id).order('created_at', { ascending: false }),
      supabase.from('complaints').select('*').eq('student_id', studentData.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('attendance').select('status').eq('student_id', studentData.id)
    ])

    setAnnouncements(annRes.data || [])
    setFees(feeRes.data || [])
    setComplaints(compRes.data || [])

    if (attRes.data && attRes.data.length > 0) {
      const presents = attRes.data.filter(a => a.status === 'present').length
      setAttendancePercent(Math.round((presents / attRes.data.length) * 100))
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [studentData])

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compTitle || !compDesc) return
    setSubmitLoading(true)
    const { error } = await supabase.from('complaints').insert({
      hostel_id: studentData.hostel_id,
      student_id: studentData.id,
      title: compTitle,
      description: compDesc,
      status: 'pending'
    })
    setSubmitLoading(false)
    if (error) {
      toast.error('Failed to submit issue')
    } else {
      toast.success('Issue reported successfully')
      setShowCompModal(false)
      setCompTitle(''); setCompDesc('');
      fetchData()
    }
  }

  if (!studentData) return null

  const totalDue = fees.reduce((sum, f) => sum + Number(f.due_amount), 0)
  const progressPercent = fees.length > 0 ? (fees.reduce((sum, f) => sum + Number(f.paid_amount), 0) / fees.reduce((sum, f) => sum + Number(f.amount), 0)) * 100 : 0

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500 max-w-lg mx-auto md:max-w-none">
      
      {/* ─── Premium Header ─── */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-0 z-30 mb-8 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center font-bold text-white shadow-md">
            {studentData.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-500">Welcome back,</h1>
            <h2 className="text-lg font-black text-slate-900 leading-tight">{studentData.full_name?.split(' ')[0]}</h2>
          </div>
        </div>
        <button className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center relative border border-slate-200">
          <Bell className="h-5 w-5 text-slate-700" />
          {announcements.length > 0 && <span className="absolute top-2 right-2.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white"></span>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* ─── Left Column (Mobile main) ─── */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Quick Summary Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                  <Bed className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Room Allocation</p>
                  <p className="text-2xl font-black text-slate-900 leading-none mt-1">{studentData.rooms?.room_number ?? 'Not Assigned'}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">Bed {studentData.beds?.bed_number ?? 'N/A'}</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Attendance</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-2xl font-black text-slate-900 leading-none">{attendancePercent}%</p>
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Present Metric</p>
                </div>
              </div>
            </div>

            {/* Premium Fees Section */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-8 h-32 w-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-slate-400 text-sm font-semibold mb-1">Total Outstanding Dues</h3>
                  <h2 className="text-4xl font-black tracking-tighter">₹{totalDue.toLocaleString('en-IN')}</h2>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-400 tracking-wider mb-2">
                  <span>CLEARED: {progressPercent.toFixed(0)}%</span>
                  <span>TOTAL BILL: ₹{fees.reduce((s,f) => s + Number(f.amount), 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              {totalDue > 0 && (
                <button className="w-full bg-white text-slate-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition shadow-[0_4px_14px_0_rgba(255,255,255,0.2)]">
                  Make Payment Now <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Complaints Section */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-black text-slate-900">Recent Complaints</h3>
                <button onClick={() => setShowCompModal(true)} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition">
                  <Plus className="h-4 w-4" /> Raise Issue
                </button>
              </div>

              {complaints.length === 0 ? (
                <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-6 text-center text-slate-400 shadow-sm">
                  <MessageSquareWarning className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">All good. Perfect environment!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map(c => (
                    <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between group hover:border-slate-300 transition">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", 
                          c.status === 'resolved' ? "bg-emerald-50 text-emerald-600" :
                          c.status === 'in-progress' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>
                          {c.status === 'resolved' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{c.description}</p>
                        </div>
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md", 
                        c.status === 'resolved' ? "bg-emerald-50 text-emerald-700" : 
                        c.status === 'in-progress' ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ─── Right Column (Desktop Sidebar) ─── */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-rose-500" /> Administrative Notices
              </h3>
              
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No new notices.</div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {announcements.map((a, i) => (
                    <div key={a.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 md:-ml-5">
                       <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm ml-12 md:ml-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900 text-sm">{a.title}</h4>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mb-2">{new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-slate-100">{a.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Floating Create Complaint Modal */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95">
            <button onClick={() => setShowCompModal(false)} className="absolute top-4 right-4 h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100">✕</button>
            <h3 className="text-xl font-black text-slate-900 mb-1">Report Issue</h3>
            <p className="text-xs font-medium text-slate-400 mb-6">Let us know what's broken and we'll fix it.</p>
            
            <form onSubmit={submitComplaint} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Issue Type / Title</label>
                <input type="text" required value={compTitle} onChange={e=>setCompTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Broken AC in Room" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Details</label>
                <textarea required value={compDesc} onChange={e=>setCompDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24" placeholder="Describe the issue specifically..."></textarea>
              </div>
              <button disabled={submitLoading} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition flex justify-center mt-2 shadow-[0_4px_14px_0_rgba(15,23,42,0.2)]">
                {submitLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
