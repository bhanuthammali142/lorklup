// @ts-nocheck
import React, { useState } from 'react'
import {
  X, Building2, User, Bed, UtensilsCrossed,
  Eye, EyeOff, CheckCircle2, Loader2, ChevronRight, ChevronLeft,
  Copy, Check
} from 'lucide-react'
import { createAdminUser, createHostelFull } from '../../lib/admin-api'
import toast from 'react-hot-toast'

// ── Temp password generator ──────────────────────────────────
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']

const STEPS = [
  { id: 1, label: 'Hostel Info',   icon: Building2 },
  { id: 2, label: 'Owner Details', icon: User },
  { id: 3, label: 'Rooms & Beds',  icon: Bed },
  { id: 4, label: 'Food Menu',     icon: UtensilsCrossed },
]

const DEFAULT_MENU = Object.fromEntries(
  DAYS.map(day => [day, Object.fromEntries(MEALS.map(m => [m, '']))])
)

// ── Main Modal ───────────────────────────────────────────────
export function AddHostelModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Step 1 — Hostel
  const [hostelName, setHostelName] = useState('')
  const [address, setAddress] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Step 2 — Owner
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [tempPassword] = useState(generateTempPassword)

  // Step 3 — Rooms & Beds
  const [floors, setFloors] = useState<{ floorName: string; rooms: { roomNumber: string; type: 'AC' | 'Non-AC'; beds: number }[] }[]>([
    { floorName: 'Ground Floor', rooms: [{ roomNumber: '101', type: 'Non-AC', beds: 3 }] }
  ])

  // Step 4 — Food Menu
  const [menu, setMenu] = useState<Record<string, Record<string, string>>>(DEFAULT_MENU)

  // ── Floor/Room helpers ────────────────────────────────────
  const addFloor = () => setFloors(f => [...f, { floorName: `Floor ${f.length + 1}`, rooms: [{ roomNumber: `${f.length + 1}01`, type: 'Non-AC', beds: 3 }] }])

  const addRoom = (fi: number) => setFloors(f => f.map((fl, i) => i === fi
    ? { ...fl, rooms: [...fl.rooms, { roomNumber: `${fi + 1}${String(fl.rooms.length + 1).padStart(2, '0')}`, type: 'Non-AC', beds: 3 }] }
    : fl))

  const removeRoom = (fi: number, ri: number) => setFloors(f => f.map((fl, i) => i === fi
    ? { ...fl, rooms: fl.rooms.filter((_, j) => j !== ri) }
    : fl))

  const updateFloor = (fi: number, key: string, val: any) => setFloors(f => f.map((fl, i) => i === fi ? { ...fl, [key]: val } : fl))
  const updateRoom = (fi: number, ri: number, key: string, val: any) => setFloors(f => f.map((fl, i) => i === fi
    ? { ...fl, rooms: fl.rooms.map((r, j) => j === ri ? { ...r, [key]: val } : r) }
    : fl))

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // 1. Create admin user via edge function (service key stays server-side)
      const { data: adminResult, error: adminErr } = await createAdminUser(
        ownerEmail,
        tempPassword,
        ownerName,
      )

      if (adminErr) {
        throw new Error(adminErr)
      }

      const ownerId = adminResult!.userId
      const isExistingUser = adminResult!.isExisting ?? false

      if (isExistingUser) {
        toast(`⚠️ Email already registered. Password has been reset.`, { icon: '🔄' })
      }

      // 2. Create hostel with rooms/beds via edge function
      const { data: hostelResult, error: hostelErr } = await createHostelFull({
        ownerId,
        hostelName,
        address,
        contactEmail: contactEmail || ownerEmail,
        contactPhone: contactPhone || ownerPhone,
        totalFloors: floors.length,
        floors,
        menu,
      })

      if (hostelErr) {
        throw new Error(hostelErr)
      }

      setDone({
        email: ownerEmail,
        password: tempPassword,
        isExistingUser,
        hostelCode: hostelResult?.hostelCode || 'HOS-xxx',
        summary: `${floors.length} floors · ${hostelResult?.roomsCreated ?? 0} rooms · ${hostelResult?.bedsCreated ?? 0} beds`,
      })
      toast.success(`✅ Hostel "${hostelName}" created with ${hostelResult?.roomsCreated ?? 0} rooms!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create hostel')
      setSubmitting(false)
    }
  }

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Login: ${done?.email}\nPassword: ${done?.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Success screen ────────────────────────────────────────
  if (done) {
    return (
      <ModalShell onClose={() => { onSuccess(); onClose() }}>
        <div className="p-8 text-center space-y-5">
          <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Hostel Created!</h2>
            <p className="text-slate-500 text-sm mt-1">Share these credentials with the hostel owner.</p>
            {done.hostelCode && (
              <span className="inline-block mt-2 bg-indigo-50 text-indigo-700 text-xs font-black px-3 py-1 rounded-full tracking-widest">
                {done.hostelCode}
              </span>
            )}
            {done.summary && (
              <p className="text-xs text-slate-400 font-semibold mt-1">{done.summary}</p>
            )}
          </div>

          {done.isExistingUser && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-semibold text-left">
              ⚠️ This email was already registered. Their password has been <strong>reset</strong> to the temporary password below.
            </div>
          )}

          <div className="bg-slate-900 text-left rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Email</p>
              <p className="text-white font-bold mt-0.5">{done.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporary Password</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-white font-bold font-mono tracking-wider">
                  {showPass ? done.password : '••••••••••••'}
                </p>
                <button onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-white transition">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <button onClick={copyCredentials}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Credentials</>}
          </button>
          <button onClick={() => { onSuccess(); onClose() }}
            className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
            Done
          </button>
        </div>
      </ModalShell>
    )
  }

  // ── Form ─────────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return hostelName.trim() && address.trim()
    if (step === 2) return ownerName.trim() && ownerEmail.trim() && ownerPhone.trim()
    if (step === 3) return floors.length > 0 && floors.every(f => f.rooms.length > 0)
    return true
  }

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-900">Add New Hostel</h2>
          <p className="text-xs text-slate-500 mt-0.5">Step {step} of {STEPS.length}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Step tabs */}
      <div className="flex border-b border-slate-100 px-6 pt-4 gap-1 shrink-0 overflow-x-auto">
        {STEPS.map(s => {
          const Icon = s.icon
          const active = step === s.id
          const done = step > s.id
          return (
            <button key={s.id} onClick={() => done && setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 -mb-px ${active ? 'border-indigo-600 text-indigo-600' : done ? 'border-emerald-400 text-emerald-600 cursor-pointer' : 'border-transparent text-slate-400'}`}>
              <Icon className="h-3.5 w-3.5" />
              {s.label}
              {done && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* STEP 1 — Hostel Info */}
        {step === 1 && (
          <div className="space-y-4">
            <SectionTitle>Hostel Information</SectionTitle>
            <Field label="Hostel Name *" value={hostelName} onChange={setHostelName} placeholder="e.g. Sri Ram Boys Hostel" />
            <Field label="Address *" value={address} onChange={setAddress} placeholder="Full address with city and PIN" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Email" value={contactEmail} onChange={setContactEmail} placeholder="hostel@email.com" type="email" />
              <Field label="Contact Phone" value={contactPhone} onChange={setContactPhone} placeholder="9XXXXXXXXX" />
            </div>
          </div>
        )}

        {/* STEP 2 — Owner Details */}
        {step === 2 && (
          <div className="space-y-4">
            <SectionTitle>Owner / Admin Details</SectionTitle>
            <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl p-3">
              A login account will be created with the email below and a temporary password. The owner can change it after first login.
            </p>
            <Field label="Full Name *" value={ownerName} onChange={setOwnerName} placeholder="Owner full name" />
            <Field label="Email Address *" value={ownerEmail} onChange={setOwnerEmail} placeholder="owner@email.com" type="email" />
            <Field label="Phone Number *" value={ownerPhone} onChange={setOwnerPhone} placeholder="9XXXXXXXXX" />
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Temporary Password (auto-generated)</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 tracking-wider">
                  {showPass ? tempPassword : '••••••••••••'}
                </div>
                <button onClick={() => setShowPass(!showPass)} className="px-3 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Rooms & Beds */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <SectionTitle>Floors, Rooms & Beds</SectionTitle>
              <button onClick={addFloor} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl transition">
                + Add Floor
              </button>
            </div>
            {floors.map((floor, fi) => (
              <div key={fi} className="border border-slate-200 rounded-2xl overflow-hidden">
                {/* Floor header */}
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                  <input value={floor.floorName} onChange={e => updateFloor(fi, 'floorName', e.target.value)}
                    className="bg-transparent font-bold text-slate-900 text-sm outline-none w-40" />
                  <button onClick={() => addRoom(fi)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg transition">
                    + Add Room
                  </button>
                </div>
                {/* Rooms */}
                <div className="p-3 space-y-2">
                  {floor.rooms.map((room, ri) => (
                    <div key={ri} className="grid grid-cols-12 gap-2 items-center bg-white border border-slate-100 rounded-xl px-3 py-2.5">
                      <div className="col-span-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Room No.</p>
                        <input value={room.roomNumber} onChange={e => updateRoom(fi, ri, 'roomNumber', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-1 focus:ring-indigo-400 outline-none" />
                      </div>
                      <div className="col-span-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                        <select value={room.type} onChange={e => updateRoom(fi, ri, 'type', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-1 focus:ring-indigo-400 outline-none">
                          <option>Non-AC</option>
                          <option>AC</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Beds</p>
                        <input type="number" min={1} max={10} value={room.beds} onChange={e => updateRoom(fi, ri, 'beds', Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-1 focus:ring-indigo-400 outline-none" />
                      </div>
                      <div className="col-span-1 flex justify-center pt-4">
                        {floor.rooms.length > 1 && (
                          <button onClick={() => removeRoom(fi, ri)} className="text-rose-400 hover:text-rose-600 transition">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 font-semibold">
              📊 Total: {floors.length} floors · {floors.reduce((a, f) => a + f.rooms.length, 0)} rooms · {floors.reduce((a, f) => a + f.rooms.reduce((b, r) => b + r.beds, 0), 0)} beds
            </div>
          </div>
        )}

        {/* STEP 4 — Food Menu */}
        {step === 4 && (
          <div className="space-y-4">
            <SectionTitle>Weekly Food Menu</SectionTitle>
            <p className="text-xs text-slate-500">The hostel owner can edit this anytime from their dashboard.</p>
            {DAYS.map(day => (
              <div key={day} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{day}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  {MEALS.map(meal => (
                    <div key={meal}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{meal}</p>
                      <input value={menu[day][meal]} onChange={e => setMenu(m => ({ ...m, [day]: { ...m[day], [meal]: e.target.value } }))}
                        placeholder={`e.g. Idli, Sambar`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-400 outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40 shadow-lg shadow-indigo-500/20">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-60 shadow-lg">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? 'Creating...' : 'Create Hostel'}
          </button>
        )}
      </div>
    </ModalShell>
  )
}

// ── Shared sub-components ─────────────────────────────────────
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{children}</h3>
}

function Field({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition placeholder:text-slate-300" />
    </div>
  )
}
