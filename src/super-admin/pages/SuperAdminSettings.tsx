// @ts-nocheck
import React, { useState } from 'react'
import { Settings, Mail, Globe, ShieldCheck, Bell, Save, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function SuperAdminSettings() {
  const [platformName, setPlatformName] = useState('HostelOS')
  const [supportEmail, setSupportEmail] = useState('support@hostelos.com')
  const [domain, setDomain] = useState('hostelos.com')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In production this would write to a platform_settings table
    toast.success('Settings saved successfully!')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-600" /> System Settings
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Configure platform-wide settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-widest">
            <Globe className="h-4 w-4 text-indigo-500" /> Platform Identity
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Platform Name</label>
              <input value={platformName} onChange={e => setPlatformName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Primary Domain</label>
              <input value={domain} onChange={e => setDomain(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Support Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4 text-indigo-500" /> Security & Alerts
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900 text-sm">Maintenance Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">All hostel dashboards show a maintenance notice</p>
              </div>
              <button onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-rose-500' : 'bg-slate-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-indigo-500" /> Email Notifications
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Receive alerts for new signups and tickets</p>
              </div>
              <button onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Super Admin Team */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-widest mb-4">
            <ShieldCheck className="h-4 w-4 text-indigo-500" /> Super Admin Access
          </h2>
          <div className="space-y-3">
            {[
              { email: 'bhanuthammali2601@gmail.com', role: 'Platform Owner', badge: 'bg-purple-100 text-purple-700' },
            ].map((member) => (
              <div key={member.email} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
                    {member.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{member.email}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${member.badge}`}>{member.role}</span>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            ))}
            <p className="text-xs text-slate-400 font-medium pt-1">To add team members, update the super-admin email list in AuthContext.tsx</p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'}`}>
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
