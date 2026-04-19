import { useState } from 'react'
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

export function AdminOnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [hostelName, setHostelName] = useState('')
  const [roomCount, setRoomCount] = useState(1)
  const [fee, setFee] = useState(5000)
  const [staffEmail, setStaffEmail] = useState('')

  const next = () => setStep(s => s + 1)
  const prev = () => setStep(s => s - 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-in zoom-in-95 relative">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-indigo-600" /> Admin Onboarding
        </h2>
        <div className="mb-6 text-slate-500 text-sm">Let's set up your hostel in 3 quick steps.</div>
        {step === 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">Hostel Name</label>
            <input value={hostelName} onChange={e => setHostelName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4" placeholder="e.g. Sunrise Hostel" />
            <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={!hostelName} onClick={next}>
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="block text-sm font-medium mb-2">Number of Rooms</label>
            <input type="number" min={1} value={roomCount} onChange={e => setRoomCount(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4" />
            <label className="block text-sm font-medium mb-2">Default Monthly Fee (₹)</label>
            <input type="number" min={0} value={fee} onChange={e => setFee(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4" />
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={prev}>Back</button>
              <button className="btn-primary flex-1" onClick={next}>Next <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <label className="block text-sm font-medium mb-2">Invite Staff (optional)</label>
            <input value={staffEmail} onChange={e => setStaffEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4" placeholder="staff@email.com" />
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={prev}>Back</button>
              <button className="btn-primary flex-1" onClick={onComplete}><CheckCircle2 className="h-4 w-4" /> Finish</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
