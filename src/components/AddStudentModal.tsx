import React, { useEffect, useState, useRef } from 'react'
import { X, CheckCircle2, ChevronRight, Check, Loader2, Upload } from 'lucide-react'
import { cn } from '../lib/utils'
import { addStudent, updateStudent, getRoomsWithBeds, uploadStudentDoc } from '../lib/api'
import toast from 'react-hot-toast'

interface AddStudentModalProps {
  isOpen: boolean
  hostelId: string | null
  onClose: () => void
  onSuccess: () => void
}

interface RoomOption { id: string; room_number: string; monthly_fee: number; beds: { id: string; bed_number: string; status: string }[] }

type OTPState = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified'

function PhotoUploadField({ label, value, onChange }: { label: string; value: File | null; onChange: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
      >
        {value ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {value.name.length > 24 ? value.name.substring(0, 24) + '...' : value.name}
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-400" />
            <span className="text-xs text-slate-500">Click to upload or capture photo</span>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]) }}
        />
      </div>
    </div>
  )
}

export function AddStudentModal({ isOpen, hostelId, onClose, onSuccess }: AddStudentModalProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [rooms, setRooms] = useState<RoomOption[]>([])

  // Phone OTP state
  const [phoneOTPState, setPhoneOTPState] = useState<OTPState>('idle')
  const [phoneOTP, setPhoneOTP] = useState('')
  const [parentOTPState, setParentOTPState] = useState<OTPState>('idle')
  const [parentOTP, setParentOTP] = useState('')

  // Photo files
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [idCardFile, setIdCardFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    full_name: '', aadhaar_number: '', phone: '', parent_phone: '', email: '',
    id_number: '', college_name: '', branch: '',
    joining_date: new Date().toISOString().split('T')[0],
    room_id: '', bed_id: '',
  })

  useEffect(() => {
    if (hostelId && step === 3) {
      getRoomsWithBeds(hostelId).then(r => setRooms(r as RoomOption[]))
    }
  }, [hostelId, step])

  if (!isOpen) return null

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const simulateSendOTP = async (type: 'phone' | 'parent') => {
    const setState = type === 'phone' ? setPhoneOTPState : setParentOTPState
    setState('sending')
    await new Promise(r => setTimeout(r, 1200))
    setState('sent')
    toast.success(`OTP sent to ${type === 'phone' ? form.phone : form.parent_phone}`)
  }

  const simulateVerifyOTP = async (type: 'phone' | 'parent') => {
    const otp = type === 'phone' ? phoneOTP : parentOTP
    const setState = type === 'phone' ? setPhoneOTPState : setParentOTPState
    if (otp.length < 4) return toast.error('Enter the OTP first')
    setState('verifying')
    await new Promise(r => setTimeout(r, 800))
    setState('verified')
    toast.success(`${type === 'phone' ? 'Student' : 'Parent'} phone verified!`)
  }

  const handleSave = async () => {
    if (!hostelId) return
    if (!form.full_name || !form.phone || !form.email) return toast.error('Name, phone, and email are required.')
    if (phoneOTPState !== 'verified') return toast.error('Please verify the student phone number first.')
    setSaving(true)
    try {
      const newStudent = await addStudent({
        hostel_id: hostelId,
        full_name: form.full_name,
        aadhaar_number: form.aadhaar_number || null,
        phone: form.phone,
        parent_phone: form.parent_phone || null,
        email: form.email || undefined,
        id_number: form.id_number || null,
        college_name: form.college_name || null,
        branch: form.branch || null,
        joining_date: form.joining_date,
        room_id: form.room_id || null,
        bed_id: form.bed_id || null,
        profile_photo: null,
        aadhaar_photo: null,
        id_card_photo: null,
        is_verified: phoneOTPState === 'verified',
        parent_phone_verified: parentOTPState === 'verified',
      } as any)

      // Upload photos if provided
      if (newStudent && aadhaarFile) {
        try {
          const url = await uploadStudentDoc(hostelId, newStudent.id, aadhaarFile, 'aadhaar')
          await updateStudent(newStudent.id, { aadhaar_photo: url } as any)
        } catch { /* storage bucket may not be set up yet - photos skipped */ }
      }
      if (newStudent && idCardFile) {
        try {
          const url = await uploadStudentDoc(hostelId, newStudent.id, idCardFile, 'id_card')
          await updateStudent(newStudent.id, { id_card_photo: url } as any)
        } catch { /* storage bucket may not be set up yet - photos skipped */ }
      }

      const autoFeeMsg = form.room_id ? ' Fee record auto-created.' : ''
      toast.success(`${form.full_name} added!${autoFeeMsg}`)
      onSuccess()
      resetForm()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save student.')
    } finally { setSaving(false) }
  }

  const resetForm = () => {
    setStep(1)
    setPhoneOTPState('idle'); setPhoneOTP('')
    setParentOTPState('idle'); setParentOTP('')
    setAadhaarFile(null); setIdCardFile(null)
    setForm({ full_name: '', aadhaar_number: '', phone: '', parent_phone: '', email: '', id_number: '', college_name: '', branch: '', joining_date: new Date().toISOString().split('T')[0], room_id: '', bed_id: '' })
  }

  const availableBeds = rooms.find(r => r.id === form.room_id)?.beds.filter(b => b.status === 'available') ?? []
  const selectedRoomFee = rooms.find(r => r.id === form.room_id)?.monthly_fee ?? 0

  const OTPBox = ({ type, state, otp, setOTP, onSend, onVerify }: {
    type: string; state: OTPState; otp: string; setOTP: (v: string) => void; onSend: () => void; onVerify: () => void
  }) => (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{type} Phone Verification</span>
        {state === 'verified' && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Verified</span>}
      </div>
      {state === 'idle' && (
        <button onClick={onSend} className="w-full text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-100 transition">
          Send OTP
        </button>
      )}
      {state === 'sending' && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-2">
          <Loader2 className="animate-spin h-4 w-4" /> Sending...
        </div>
      )}
      {(state === 'sent' || state === 'verifying') && (
        <div className="flex gap-2">
          <input
            type="text" maxLength={6}
            value={otp} onChange={e => setOTP(e.target.value)}
            placeholder="Enter OTP"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button onClick={onVerify} disabled={state === 'verifying'}
            className="px-3 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-70">
            {state === 'verifying' ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify'}
          </button>
        </div>
      )}
      {state === 'verified' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center text-sm text-emerald-700 font-medium">✓ Phone number confirmed</div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-slate-100 p-5 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
            <p className="text-sm text-slate-500 mt-0.5">Secure 3-step admission process</p>
          </div>
          <button onClick={() => { resetForm(); onClose() }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center">
          {[{ num: 1, label: 'Details & Docs' }, { num: 2, label: 'Verification' }, { num: 3, label: 'Room Allocation' }].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={cn("flex items-center gap-2", step >= s.num ? "text-blue-600 font-semibold" : "text-slate-400")}>
                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border",
                  step > s.num ? "bg-blue-600 text-white border-blue-600" :
                  step === s.num ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 bg-slate-50 text-slate-400")}>
                  {step > s.num ? <Check className="h-3 w-3" /> : s.num}
                </div>
                <span className="text-sm hidden sm:block">{s.label}</span>
              </div>
              {i < 2 && <ChevronRight className="h-4 w-4 mx-2 text-slate-300" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 h-[400px] overflow-y-auto">

          {/* STEP 1 - Details & Docs */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Full Name *</label>
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Aadhaar Number</label>
                  <input value={form.aadhaar_number} onChange={e => set('aadhaar_number', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0000 0000 0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Student Phone *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Parent Phone</label>
                  <input value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="+91" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Student Portal Email (Magic Link Auth) *</label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/30" placeholder="student@example.com" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">ID / Roll No.</label>
                  <input value={form.id_number} onChange={e => set('id_number', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="CST-24-001" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">College</label>
                  <input value={form.college_name} onChange={e => set('college_name', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="JNTUH" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Branch</label>
                  <input value={form.branch} onChange={e => set('branch', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="CSE" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Joining Date</label>
                <input type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="h-px bg-slate-100" />
              <div className="grid grid-cols-2 gap-3">
                <PhotoUploadField label="📷 Aadhaar Card Photo" value={aadhaarFile} onChange={setAadhaarFile} />
                <PhotoUploadField label="🪪 Student ID Card Photo" value={idCardFile} onChange={setIdCardFile} />
              </div>
            </div>
          )}

          {/* STEP 2 - OTP Verification for both phones */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold">Phone Verification Required</p>
                <p className="text-xs mt-1 text-blue-600">Both student and parent numbers must be verified before proceeding. Student phone is mandatory.</p>
              </div>

              <OTPBox
                type="Student"
                state={phoneOTPState}
                otp={phoneOTP}
                setOTP={setPhoneOTP}
                onSend={() => simulateSendOTP('phone')}
                onVerify={() => simulateVerifyOTP('phone')}
              />

              {form.parent_phone && (
                <OTPBox
                  type="Parent"
                  state={parentOTPState}
                  otp={parentOTP}
                  setOTP={setParentOTP}
                  onSend={() => simulateSendOTP('parent')}
                  onVerify={() => simulateVerifyOTP('parent')}
                />
              )}

              {!form.parent_phone && (
                <div className="text-xs text-slate-400 text-center">No parent phone entered — only student verification required.</div>
              )}
            </div>
          )}

          {/* STEP 3 - Room & Bed Allocation */}
          {step === 3 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <span className="text-lg">🏠</span>
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Auto Fee Assignment</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Selecting a room will <strong>automatically create this month's fee record</strong> based on the room's monthly rate. Bed status will change to Occupied.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Select Room</label>
                  <select value={form.room_id} onChange={e => { set('room_id', e.target.value); set('bed_id', '') }}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">— No room (skip fee) —</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} — ₹{Number(r.monthly_fee).toLocaleString('en-IN')}/mo</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Select Bed</label>
                  <select value={form.bed_id} onChange={e => set('bed_id', e.target.value)} disabled={!form.room_id}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
                    <option value="">— No bed —</option>
                    {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bed_number} (Available)</option>)}
                  </select>
                </div>
              </div>
              {form.room_id && selectedRoomFee > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-800">✓ Fee will be auto-created</p>
                  <p className="text-emerald-700 text-sm mt-1">
                    Amount: <strong>₹{Number(selectedRoomFee).toLocaleString('en-IN')}</strong> · Month: <strong>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</strong> · Status: Pending
                  </p>
                </div>
              )}
              {form.room_id && availableBeds.length === 0 && (
                <p className="text-sm text-rose-500">⚠️ No available beds in this room. All beds are occupied.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button onClick={() => step > 1 ? setStep(step - 1) : (resetForm(), onClose())} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button onClick={() => {
              if (step === 2 && phoneOTPState !== 'verified') return toast.error('Please verify student phone first.')
              setStep(step + 1)
            }} className="btn-primary min-w-[120px]">
              Continue →
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[150px] flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="animate-spin h-4 w-4" /> Saving...</> : '✓ Save Admission'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
