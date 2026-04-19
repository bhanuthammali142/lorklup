// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { Plus, Search, Filter, MessageCircle, FileDown, CheckCircle2, Clock, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getFees, processPayment, autoMarkOverdue, generateBulkFees } from '../lib/api'
import type { Fee } from '../types'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function getDaysLate(dueDateStr: string) {
  const diffTime = Date.now() - new Date(dueDateStr).getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function Fees() {
  const { user } = useAuth()
  const [hostelId, setHostelId] = useState<string | null>(null)
  // Remove local fees state, use React Query
  // Removed duplicate loading state; use React Query loading only
  const [activeTab, setActiveTab] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals state
  const [collectingFee, setCollectingFee] = useState<Fee | null>(null)
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0])
  const [collectionAmount, setCollectionAmount] = useState<number>(0)
  const [savingMsg, setSavingMsg] = useState(false)

  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [genMonthDate, setGenMonthDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [genDueDate, setGenDueDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 5).toISOString().split('T')[0]
  })


  // React Query: fetch fees
  const queryClient = useQueryClient()
  const {
    data: feesData = [],
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['fees', hostelId],
    queryFn: async () => {
      if (!hostelId) return []
      await autoMarkOverdue(hostelId)
      return getFees(hostelId)
    },
    enabled: !!hostelId,
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(h => { if (h) setHostelId(h.id) })
  }, [user])

  const handleMarkPaid = async () => {
    if (!hostelId || !collectingFee) return
    if (!collectionDate) return toast.error('Collection date is required')
    if (collectionAmount <= 0) return toast.error('Amount must be greater than zero')
    if (collectionAmount > Number(collectingFee.due_amount)) return toast.error("Cannot pay more than the due amount")
    setSavingMsg(true)
    try {
      const res = await processPayment(
        collectingFee.id, 
        hostelId, 
        collectingFee.student_id, 
        collectionAmount, 
        Number(collectingFee.amount), 
        Number(collectingFee.paid_amount || 0), 
        'cash', 
        collectionDate
      )
      toast.success(res.newStatus === 'paid' ? `Fully Paid! Receipt: ${res.receipt_id}` : `Partial payment recorded!`)
      setCollectingFee(null)
      queryClient.invalidateQueries({ queryKey: ['fees', hostelId] })
    } catch { toast.error('Failed to process payment.') }
    finally { setSavingMsg(false) }
  }

  const handleBulkGenerate = async () => {
    if (!hostelId) return;
    setSavingMsg(true);
    try {
      const res = await generateBulkFees(hostelId, genMonthDate, genDueDate);
      if (res.created > 0) {
        toast.success(`Successfully generated ${res.created} new fee records!`);
        queryClient.invalidateQueries({ queryKey: ['fees', hostelId] })
      } else {
        toast('All active students already have fees assigned for this month.', { icon: '🙌' });
      }
      setShowGenerateModal(false);
    } catch (e: any) {
      toast.error('Failed to generate fees: ' + e.message);
    } finally {
      setSavingMsg(false);
    }
  }

  const generatePDF = (fee: Fee) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Fee Receipt', 14, 22)
    doc.setFontSize(11)
    doc.text(`Receipt ID: ${fee.receipt_id ?? 'N/A'}`, 14, 35)
    doc.text(`Collection Date: ${fee.paid_at ? new Date(fee.paid_at).toLocaleDateString('en-IN') : ''}`, 14, 43)
    autoTable(doc, {
      startY: 55,
      head: [['Field', 'Details']],
      body: [
        ['Student', fee.students?.full_name ?? ''],
        ['Room', fee.students?.rooms?.room_number ?? 'N/A'],
        ['Month', new Date(fee.month).toLocaleString('default', { month: 'short', year: 'numeric' })],
        ['Amount Paid', fmt(Number(fee.amount))],
        ['Status', fee.status.toUpperCase()],
      ],
    })
    doc.save(`receipt-${fee.receipt_id}.pdf`)
  }

  const filtered = feesData
    .filter(f => activeTab === 'All' || f.status.toLowerCase() === activeTab.toLowerCase())
    .filter(f => !searchTerm || f.students?.full_name.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalCollected = feesData.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0)
  const totalPending = feesData.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0)
  const totalOverdue = feesData.filter(f => f.status === 'overdue').reduce((s, f) => s + Number(f.amount), 0)
  const totalExpected = totalCollected + totalPending + totalOverdue

  // Use React Query loading state
  const loading = isLoading || isFetching

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BULK GENERATE MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="h-5 w-5 text-blue-600" /> Auto-Generate Monthly Fees</h2>
              <button onClick={() => setShowGenerateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                This will automatically scan through all your active students and generate a pending fee record for the specified month based on their assigned room's monthly fee. 
                <br/><br/><em>Students who already have a record for this exact month will be safely skipped.</em>
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Fee Month (1st Day)</label>
                  <input type="date" value={genMonthDate} onChange={e => setGenMonthDate(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Due Date</label>
                  <input type="date" value={genDueDate} onChange={e => setGenDueDate(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={handleBulkGenerate} disabled={savingMsg} className="btn-primary min-w-[140px]">
                {savingMsg ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : 'Generate for All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT FEE MODAL */}
      {collectingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Collect Fee</h2>
              <button onClick={() => setCollectingFee(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-sm">
                <p className="text-blue-800"><span className="font-semibold">Student:</span> {collectingFee.students?.full_name}</p>
                <p className="text-blue-800"><span className="font-semibold">Room:</span> {collectingFee.students?.rooms?.room_number ?? 'N/A'}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200 border-dashed">
                  <p className="text-blue-800 font-semibold">Total Fee: {fmt(Number(collectingFee.amount))}</p>
                  <p className="text-rose-600 font-bold">Due: {fmt(Number(collectingFee.due_amount))}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Amount Paying Now *</label>
                <input type="number" 
                  value={collectionAmount || ''} 
                  onChange={e => setCollectionAmount(Number(e.target.value))} 
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                  max={Number(collectingFee.due_amount)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Date of Collection *</label>
                <p className="text-xs text-slate-500 mb-2">Backdate this if the payment was collected earlier.</p>
                <input type="date" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => setCollectingFee(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={handleMarkPaid} disabled={savingMsg} className="btn-primary min-w-[120px] !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-600/20">
                {savingMsg ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fee Management</h1>
          <p className="text-slate-500 mt-1">Track payments, automatically bill mass students, and find defaulters.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerateModal(true)} className="btn-primary flex items-center gap-2 !bg-blue-600">
            <RefreshCw className="h-4 w-4" />Bulk Generate Fees
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Expected (All Time)', value: fmt(totalExpected), color: '' },
          { label: 'Collected (All Time)', value: fmt(fees.reduce((s,f) => s + Number(f.paid_amount || 0), 0)), color: 'text-emerald-600' },
          { label: 'Currently Pending', value: fmt(totalExpected - fees.reduce((s,f) => s + Number(f.paid_amount || 0), 0)), color: 'text-amber-600' },
          { label: 'Currently Overdue', value: fmt(totalOverdue), color: 'text-rose-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
            <div className={cn("absolute right-0 top-0 w-2 h-full", s.color ? `bg-${s.color.split('-')[1]}-500/10` : "bg-slate-100")}></div>
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <h3 className={cn("text-xl font-bold tracking-tight mt-1", s.color || "text-slate-900")}>{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="card-premium">
        <div className="border-b border-slate-100 p-4 bg-slate-50/50 rounded-t-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              {['All', 'Paid', 'Pending', 'Overdue', 'Partial'].map(tab => {
                // Add counts next to filter
                const count = fees.filter(f => tab === 'All' || f.status.toLowerCase() === tab.toLowerCase()).length;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("px-4 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2",
                      activeTab === tab ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100")}>
                    {tab} <span className={cn("px-1.5 py-0.5 rounded text-[10px]", activeTab === tab ? "bg-slate-700" : "bg-slate-200")}>{count}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast('WhatsApp integration not yet configured. Export the defaulters list and message them manually.', { icon: '📋', duration: 4000 })}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                title="WhatsApp integration coming soon"
              >
                <MessageCircle className="h-4 w-4" />
                Remind Defaulters
              </button>
              <div className="relative w-64 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search by student name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 gap-3 text-slate-400"><Loader2 className="animate-spin h-5 w-5" /><span>Loading fee ledger...</span></div>
        ) : (
          <div className="md:overflow-x-auto min-h-[300px]">
            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden p-4 bg-slate-50/30">
              {filtered.length === 0 ? (
                <div className="text-center text-slate-500 font-medium py-8">
                  No matching fee records found.
                </div>
              ) : (
                filtered.map(fee => {
                  const daysLate = fee.status === 'overdue' ? getDaysLate(fee.due_date) : 0;
                  return (
                    <div key={fee.id} className="bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 truncate">{fee.students?.full_name ?? 'Unknown Student'}</span>
                          <span className="text-xs font-medium text-slate-500">Room: <span className="text-slate-700">{fee.students?.rooms?.room_number ?? 'N/A'}</span></span>
                        </div>
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border shrink-0",
                            fee.status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            fee.status === 'partial' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            fee.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                            {fee.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-slate-400 font-medium">Billed Amount</span>
                          <span className="text-slate-900 font-bold">{fmt(Number(fee.amount))}</span>
                          <span className="text-slate-500 font-medium text-[10px] mt-0.5">{new Date(fee.month).toLocaleString('default', { month: 'short', year: 'numeric' })} Bill</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-slate-400 font-medium">Amount Due</span>
                          <span className={cn("font-bold", fee.due_amount > 0 ? "text-rose-600" : "text-emerald-600")}>{fmt(Number(fee.due_amount))}</span>
                          <div className="mt-0.5">
                            {fee.status === 'paid' ? (
                              <span className="text-emerald-600 font-medium text-[10px]">Collected: {new Date(fee.paid_at!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            ) : (
                              <span className={cn("font-medium text-[10px]", fee.status === 'overdue' && "text-rose-600")}>
                                Due: {new Date(fee.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        {fee.status !== 'paid' ? (
                          <>
                            <button onClick={() => toast(`Copy ${fee.students?.full_name}'s number: ${fee.students?.phone ?? 'N/A'} and message manually.`, { duration: 5000 })} className="p-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-center flex items-center justify-center"><MessageCircle className="h-4 w-4" /></button>
                            <button onClick={() => { setCollectionDate(new Date().toISOString().split('T')[0]); setCollectionAmount(Number(fee.due_amount)); setCollectingFee(fee); }} className="flex-1 text-xs font-bold bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm text-center">Collect Payment</button>
                          </>
                        ) : (
                          <button onClick={() => generatePDF(fee)} className="w-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-lg hover:bg-blue-100 transition shadow-sm flex items-center justify-center gap-1.5"><FileDown className="h-4 w-4" /> Download Receipt</button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Desktop Table View */}
            <table className="w-full text-left text-sm whitespace-nowrap hidden md:table">
              <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4">Student & Details</th>
                  <th className="px-6 py-4">Amount & Month</th>
                  <th className="px-6 py-4">Status & Days Late</th>
                  <th className="px-6 py-4 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No matching fee records found. Use "Bulk Generate Fees" to create them for all students.
                    </td>
                  </tr>
                ) : (
                  filtered.map(fee => {
                    const daysLate = fee.status === 'overdue' ? getDaysLate(fee.due_date) : 0;
                    return (
                      <tr key={fee.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-[15px]">{fee.students?.full_name ?? 'Unknown Student'}</span>
                            <span className="text-xs font-medium text-slate-500">Room: <span className="text-slate-700">{fee.students?.rooms?.room_number ?? 'N/A'}</span></span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{fmt(Number(fee.amount))}</span>
                            <span className="text-[11px] font-bold text-slate-400">Due: <span className="text-slate-600">{fmt(Number(fee.due_amount))}</span></span>
                            <span className="text-xs font-medium text-slate-500 mt-1">{new Date(fee.month).toLocaleString('default', { month: 'long', year: 'numeric' })} Bill</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 flex flex-col justify-center items-start h-full pt-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                            fee.status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" :
                            fee.status === 'partial' ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" :
                            fee.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm" : "bg-rose-50 text-rose-700 border-rose-200 shadow-sm animate-pulse-slow")}>
                            {fee.status === 'paid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {fee.status === 'partial' && <Clock className="h-3.5 w-3.5" />}
                            {fee.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                            {fee.status === 'overdue' && <AlertCircle className="h-3.5 w-3.5" />}
                            {fee.status.toUpperCase()}
                          </span>
                          
                          {/* Rich Dates Display */}
                          <div className="mt-2 text-[11px] font-medium text-slate-500">
                            {fee.status === 'paid' ? (
                              <span className="text-emerald-600 block">Collected: {new Date(fee.paid_at!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            ) : (
                              <>
                                <span className={cn("block", fee.status === 'overdue' && "text-rose-600 font-bold")}>
                                  Due: {new Date(fee.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </span>
                                {daysLate > 0 && <span className="block text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded mt-0.5 w-max">{daysLate} Days Late</span>}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end justify-center gap-2">
                            {fee.status !== 'paid' && (
                              <>
                                <button onClick={() => { setCollectionDate(new Date().toISOString().split('T')[0]); setCollectionAmount(Number(fee.due_amount)); setCollectingFee(fee); }} className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm hover:shadow active:scale-95">Collect Payment</button>
                                <button onClick={() => toast(`Copy ${fee.students?.full_name}'s number: ${fee.students?.phone ?? 'N/A'} and message manually.`, { duration: 5000 })} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 hover:bg-slate-50 px-2 py-1 rounded transition w-max">
                                  <MessageCircle className="h-3 w-3" /> Copy Number
                                </button>
                              </>
                            )}
                            {fee.status === 'paid' && (
                              <button onClick={() => generatePDF(fee)} className="text-xs font-bold bg-white text-blue-700 px-4 py-2 rounded-lg border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition flex items-center gap-1.5 shadow-sm active:scale-95">
                                <FileDown className="h-4 w-4" /> Download Receipt
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
