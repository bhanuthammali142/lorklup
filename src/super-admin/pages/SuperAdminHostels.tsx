// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Building2, Plus, Search, ShieldCheck, RefreshCw, Eye, X, MapPin, Phone, Mail, Calendar, Hash } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AddHostelModal } from '../components/AddHostelModal'

export function SuperAdminHostels() {
  const [hostels, setHostels] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewHostel, setViewHostel] = useState<any | null>(null)

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" /> Platform hostels
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{hostels.length} hostel{hostels.length !== 1 ? 's' : ''} registered.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Add new hostel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by hostel name, address, or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>
        </div>
        <div className="md:overflow-x-auto">
          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-slate-50/50">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-32 animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center p-8 text-slate-500 font-medium">No hostels match your search.</div>
            ) : (
              filtered.map(hostel => (
                <div key={hostel.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0">
                        {hostel.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col min-w-[120px]">
                        <p className="font-bold text-slate-900 truncate">{hostel.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {hostel.id?.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewHostel(hostel)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View hostel details">
                        <Eye className="h-4 w-4" />
                      </button>
                      <span className="inline-flex shrink-0 items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> Active
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-semibold mb-0.5">Address</span>
                      <span className="text-slate-700 truncate">{hostel.address || '—'}</span>
                    </div>
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-semibold mb-0.5">Contact</span>
                        <span className="text-slate-700 font-medium">{hostel.contact_email || '—'}</span>
                        <span className="text-slate-500">{hostel.contact_phone || ''}</span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="text-slate-400 font-semibold mb-0.5">Created</span>
                        <span className="text-slate-600 font-medium">{new Date(hostel.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <table className="w-full text-sm text-left hidden md:table">
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
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded-full animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-bold text-slate-400">
                      {search ? 'No hostels match your search.' : 'No hostels yet. Click "Add new hostel" to get started!'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(hostel => (
                  <tr key={hostel.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
                          {hostel.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{hostel.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {hostel.id?.substring(0, 8)}...</p>
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
                    <td className="px-6 py-4">
                      <button onClick={() => setViewHostel(hostel)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddHostelModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { load(); setShowAddModal(false) }}
        />
      )}

      {/* Hostel View Drawer */}
      {viewHostel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewHostel(null)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right-0 duration-300" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                  {viewHostel.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{viewHostel.name}</h2>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" /> Active
                  </span>
                </div>
              </div>
              <button onClick={() => setViewHostel(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {[
                { icon: MapPin,    label: 'Address',         value: viewHostel.address          || '—' },
                { icon: Mail,      label: 'Contact Email',   value: viewHostel.contact_email    || '—' },
                { icon: Phone,     label: 'Contact Phone',   value: viewHostel.contact_phone    || '—' },
                { icon: Hash,      label: 'Hostel ID',       value: viewHostel.id },
                { icon: Calendar,  label: 'Registered On',   value: new Date(viewHostel.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
                    <p className="text-sm text-slate-800 font-medium mt-0.5 break-all">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
