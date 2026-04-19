// @ts-nocheck
/**
 * StudentAnnouncements.tsx
 *
 * Changes: added Supabase Realtime subscription — new announcements appear
 * instantly without the student needing to refresh the page.
 */
import React, { useEffect, useState } from 'react'
import { Bell, Megaphone, Loader2 } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'

const BADGE_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
]

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export function StudentAnnouncements() {
  const { studentData } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    if (!studentData?.hostel_id) return

    // Initial fetch
    const fetchAnnouncements = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('hostel_id', studentData.hostel_id)
        .order('created_at', { ascending: false })
      setAnnouncements(data || [])
      setLoading(false)
    }

    fetchAnnouncements()

    // Realtime subscription — new announcements appear without refresh
    const channel = supabase
      .channel(`announcements:${studentData.hostel_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: `hostel_id=eq.${studentData.hostel_id}`,
        },
        (payload) => {
          setAnnouncements(prev => [payload.new, ...prev])
          setNewCount(n => n + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentData?.hostel_id])

  if (!studentData) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-indigo-600" />
            Announcements
            {newCount > 0 && (
              <span className="ml-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {newCount}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Stay up-to-date with hostel notices. Updates appear in real time.
          </p>
        </div>
        {newCount > 0 && (
          <button
            onClick={() => setNewCount(0)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Count badge */}
      {!loading && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1 rounded-full">
            <Megaphone className="h-3.5 w-3.5" />
            {announcements.length} total notices
          </span>
          {announcements.length > 0 && (
            <span className="text-xs text-slate-400">
              Latest: {new Date(announcements[0].created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500 text-lg">No announcements yet</p>
          <p className="text-slate-400 text-sm mt-1">Management hasn't posted any notices.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, idx) => (
            <div
              key={a.id}
              onClick={() => setSelected(selected?.id === a.id ? null : a)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:border-indigo-200 hover:shadow-md transition"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${BADGE_COLORS[idx % BADGE_COLORS.length]}`}>
                    {String(announcements.length - idx).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-slate-900 text-base leading-snug">{a.title}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                        {daysSince(a.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(a.created_at).toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <div className={`mt-3 text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 ${selected?.id === a.id ? 'block' : 'line-clamp-2'}`}>
                      {a.message}
                    </div>
                    <p className="text-[11px] text-indigo-500 font-semibold mt-2">
                      {selected?.id === a.id ? '▲ Click to collapse' : '▼ Click to read more'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
