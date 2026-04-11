// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { CheckSquare, Calendar, Loader2, Check, X, Plane } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getAttendanceByDate, markAttendance } from '../lib/api'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

export function Attendance() {
  const { user } = useAuth()
  const [hostelId, setHostelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const fetchData = async (hId: string, date: string) => {
    setLoading(true)
    try {
      const data = await getAttendanceByDate(hId, date)
      setStudents(data)
    } catch {
      toast.error('Failed to load attendance.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(h => { if (h) { setHostelId(h.id); fetchData(h.id, selectedDate) } })
  }, [user, selectedDate])

  const handleMark = async (studentId: string, status: 'present' | 'absent' | 'leave') => {
    if (!hostelId) return
    try {
      // Optimistic update
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return { ...s, attendance: [{ status }] }
        }
        return s
      }))
      await markAttendance(hostelId, studentId, selectedDate, status)
    } catch {
      toast.error('Failed to mark attendance')
      if (hostelId) fetchData(hostelId, selectedDate) // revert on fail
    }
  }

  const presentCount = students.filter(s => s.attendance?.[0]?.status === 'present').length
  const absentCount = students.filter(s => s.attendance?.[0]?.status === 'absent').length
  const leaveCount = students.filter(s => s.attendance?.[0]?.status === 'leave').length
  const unmarkedCount = students.length - (presentCount + absentCount + leaveCount)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-blue-600" /> Daily Attendance
          </h1>
          <p className="text-slate-500 mt-1">Mark and track student presence and leaves.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200">
          <Calendar className="h-5 w-5 text-slate-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-slate-700 outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1.5 h-full bg-slate-200"></div>
          <p className="text-sm font-medium text-slate-500">Total Unmarked</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{unmarkedCount}</h3>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1.5 h-full bg-emerald-500"></div>
          <p className="text-sm font-medium text-slate-500">Present</p>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">{presentCount}</h3>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1.5 h-full bg-rose-500"></div>
          <p className="text-sm font-medium text-slate-500">Absent</p>
          <h3 className="text-xl font-bold text-rose-600 mt-1">{absentCount}</h3>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1.5 h-full bg-amber-500"></div>
          <p className="text-sm font-medium text-slate-500">On Leave</p>
          <h3 className="text-xl font-bold text-amber-600 mt-1">{leaveCount}</h3>
        </div>
      </div>

      <div className="card-premium">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400"><Loader2 className="animate-spin h-6 w-6" /></div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4 text-center">Status Link</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No active students found in this hostel.</td>
                  </tr>
                ) : students.map(student => {
                  const status = student.attendance?.[0]?.status
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">{student.full_name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {student.rooms?.room_number ?? 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!status && <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">Unmarked</span>}
                        {status === 'present' && <span className="inline-flex px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold tracking-wider">Present</span>}
                        {status === 'absent' && <span className="inline-flex px-2 py-1 rounded bg-rose-100 text-rose-700 text-[10px] uppercase font-bold tracking-wider">Absent</span>}
                        {status === 'leave' && <span className="inline-flex px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] uppercase font-bold tracking-wider">Leave</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 bg-slate-100/50 p-1 rounded-lg w-fit ml-auto border border-slate-200/60">
                          <button 
                            onClick={() => handleMark(student.id, 'present')}
                            className={cn("p-2 rounded-md transition-all flex items-center gap-1.5", 
                              status === 'present' ? "bg-emerald-500 text-white shadow-sm" : "hover:bg-white text-slate-400 hover:text-emerald-600 hover:shadow-sm")}
                            title="Mark Present"
                          >
                            <Check className="h-4 w-4" /> <span className="text-xs font-semibold hidden sm:inline">P</span>
                          </button>
                          
                          <button 
                            onClick={() => handleMark(student.id, 'absent')}
                            className={cn("p-2 rounded-md transition-all flex items-center gap-1.5", 
                              status === 'absent' ? "bg-rose-500 text-white shadow-sm" : "hover:bg-white text-slate-400 hover:text-rose-600 hover:shadow-sm")}
                            title="Mark Absent"
                          >
                            <X className="h-4 w-4" /> <span className="text-xs font-semibold hidden sm:inline">A</span>
                          </button>
                          
                          <button 
                            onClick={() => handleMark(student.id, 'leave')}
                            className={cn("p-2 rounded-md transition-all flex items-center gap-1.5", 
                              status === 'leave' ? "bg-amber-500 text-white shadow-sm" : "hover:bg-white text-slate-400 hover:text-amber-600 hover:shadow-sm")}
                            title="Mark Leave"
                          >
                            <Plane className="h-4 w-4" /> <span className="text-xs font-semibold hidden sm:inline">L</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
