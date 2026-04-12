// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Building2, Plus, Search, ShieldCheck, RefreshCw, Eye } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import { AddHostelModal } from '../components/AddHostelModal'
import toast from 'react-hot-toast'

const supabase = supabaseAdmin // bypass RLS

export function SuperAdminHostels() {
  const [hostels, setHostels] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('hostels').select('*').order('created_at', { ascending: false })
    setHostels(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(hostels.filter(h =>
      h.name?.toLowerCase().includes(q) ||
      h.address?.toLowerCase().includes(q) ||
      h.id?.toLowerCase().includes(q)
    ))
  }, [search, hostels])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" /> Platform Hostels
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{hostels.length} hostel{hostels.length !== 1 ? 's' : ''} registered on the platform.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Add New Hostel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by hostel name, address, or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Hostel</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-bold text-slate-400">{search ? 'No hostels match your search.' : 'No hostels yet. Click "Add New Hostel" to get started!'}</p>
                  </td>
                </tr>
              ) : filtered.map(hostel => (
                <tr key={hostel.id} className="hover:bg-slate-50/80 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
                        {hostel.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{hostel.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {hostel.id?.substring(0,8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate">{hostel.address || '—'}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700 font-medium">{hostel.contact_email || '—'}</p>
                    <p className="text-xs text-slate-400">{hostel.contact_phone || ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      <ShieldCheck className="h-3 w-3" /> Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                    {new Date(hostel.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 font-bold text-xs hover:text-indigo-800 transition inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <AddHostelModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { load(); setShowAddModal(false) }}
        />
      )}
    </div>
  )
}
