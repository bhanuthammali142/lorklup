import React, { useEffect, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Megaphone, Plus, Trash2, Loader2, Send } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getAnnouncements, addAnnouncement, deleteAnnouncement } from '../lib/api'

import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function Announcements() {
  const { user } = useAuth()
  const [hostelId, setHostelId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const queryClient = useQueryClient()
  const {
    data: announcementsData = [],
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['announcements', hostelId],
    queryFn: () => hostelId ? getAnnouncements(hostelId) : Promise.resolve([]),
    enabled: !!hostelId,
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(h => { if (h) setHostelId(h.id) })
  }, [user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostelId || !title || !message) return
    setAdding(true)
    try {
      await addAnnouncement({ hostel_id: hostelId, title, message })
      toast.success('Announcement broadcasted successfully!')
      setTitle('')
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['announcements', hostelId] })
    } catch {
      toast.error('Failed to create announcement.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await deleteAnnouncement(id)
      toast.success('Announcement removed.')
      queryClient.invalidateQueries({ queryKey: ['announcements', hostelId] })
    } catch {
      toast.error('Failed to delete.')
    }
  }

  // Use React Query loading state
  const loading = isLoading || isFetching

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Megaphone className="h-8 w-8 text-blue-600" /> Announcements
            </h1>
            <p className="text-slate-500 mt-1">Broadcast important notices to the Student Portal instantly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleCreate} className="card-premium space-y-4 p-5 sticky top-6">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Announcement
              </h3>

              <div>
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Water Maintenance"
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} placeholder="Type the detailed message here..."
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
              </div>

            <button type="submit" disabled={adding} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {adding ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="h-4 w-4" /> Broadcast to Students</>}
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2">
          <div className="card-premium p-5 min-h-[400px]">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Past Announcements</h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-40 text-slate-400"><Loader2 className="animate-spin h-6 w-6" /></div>
            ) : announcementsData.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
                No announcements made yet.
              </div>
            ) : (
              <div className="space-y-4">
                {announcementsData.map(a => (
                  <div key={a.id} className="relative group bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-300 transition-colors">
                    <button onClick={() => handleDelete(a.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="pr-8">
                      <h4 className="font-semibold text-slate-900">{a.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      </div>
    </ErrorBoundary>
  )
}
