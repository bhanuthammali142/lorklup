import React from 'react'
import { User, LogOut, FileText, Phone, Building } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

export function StudentProfile() {
  const { studentData, signOut } = useAuth()

  if (!studentData) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <User className="h-8 w-8 text-blue-600" /> Profile
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">View your personal details and account settings.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-8">
          <div className="flex items-center gap-4">
            {studentData.profile_photo ? (
               <img src={studentData.profile_photo} alt="Profile" className="h-20 w-20 rounded-full border-4 border-slate-800 object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-600 border-4 border-slate-800 flex items-center justify-center text-2xl font-bold text-white">
                {studentData.full_name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{studentData.full_name}</h2>
              <p className="text-slate-400 font-medium mt-1">Room {studentData.rooms?.room_number ?? 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Academic Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Building className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 font-medium">College Name</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{studentData.college_name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Roll Number / ID</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{studentData.id_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Personal Phone</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{studentData.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Parent Phone</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{studentData.parent_phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button onClick={signOut} className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 font-bold py-3 px-4 rounded-xl hover:bg-rose-100 transition-colors">
              <LogOut className="h-5 w-5" /> Sign Out from Device
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
