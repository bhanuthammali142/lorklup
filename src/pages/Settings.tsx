import React, { useEffect, useState } from 'react'
import { Building, Shield, Bell, CreditCard, User, LogOut, Save, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, updateHostel } from '../lib/api'
import type { Hostel } from '../types'
import toast from 'react-hot-toast'

type Tab = 'Hostel Details' | 'Profile' | 'Notifications' | 'Security' | 'Billing'

export function Settings() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('Hostel Details')
  const [hostel, setHostel] = useState<Hostel | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', contact_phone: '', contact_email: '' })

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(h => {
      if (h) {
        setHostel(h)
        setForm({
          name: h.name ?? '',
          address: h.address ?? '',
          contact_phone: h.contact_phone ?? '',
          contact_email: h.contact_email ?? user.email ?? '',
        })
      }
    })
  }, [user])

  const handleSave = async () => {
    if (!hostel) return
    setSaving(true)
    try {
      await updateHostel(hostel.id, {
        name: form.name,
        address: form.address,
        contact_phone: form.contact_phone,
      })
      toast.success('Hostel details saved successfully!')
    } catch {
      toast.error('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { icon: React.ElementType; label: Tab }[] = [
    { icon: Building, label: 'Hostel Details' },
    { icon: User, label: 'Profile' },
    { icon: Bell, label: 'Notifications' },
    { icon: Shield, label: 'Security' },
    { icon: CreditCard, label: 'Billing' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your hostel preferences and account.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mt-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex flex-col gap-1">
          {tabs.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === label ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("h-4 w-4", activeTab === label ? "text-blue-600" : "text-slate-400")} />
              {label}
            </button>
          ))}
          <div className="h-px bg-slate-200 my-2 mx-2" />
          <button onClick={signOut} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left">
            <LogOut className="h-4 w-4" />Sign Out
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 card-premium p-6 sm:p-8">
          {activeTab === 'Hostel Details' && (
            <>
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Hostel Details</h2>
                <p className="text-sm text-slate-500">Update your primary hostel's public information.</p>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Hostel Name</label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Contact Number</label>
                    <input type="text" value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <textarea rows={3} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Contact Email</label>
                  <input type="email" value={form.contact_email} disabled
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
                  <p className="text-xs text-slate-400">Email changes require re-authentication.</p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 min-w-[130px] justify-center">
                    {saving ? <><Loader2 className="animate-spin h-4 w-4" />Saving...</> : <><Save className="h-4 w-4" />Save Changes</>}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab !== 'Hostel Details' && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                {(() => {
                  const t = tabs.find(t => t.label === activeTab)
                  return t ? <t.icon className="h-6 w-6 text-slate-400" /> : null
                })()}
              </div>
              <p className="font-medium">{activeTab}</p>
              <p className="text-sm text-center">This section will be available after full backend integration.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
