// @ts-nocheck
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Calendar } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { getAnnouncements } from '../../lib/api'
import toast from 'react-hot-toast'

export function StudentAnnouncements() {
  const { hostelId } = useAuth()

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', hostelId],
    queryFn: () => hostelId ? getAnnouncements(hostelId) : Promise.resolve([]),
    enabled: !!hostelId,
    staleTime: 1000 * 60,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><p className="text-slate-500">Loading announcements...</p></div>
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Megaphone className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500">No announcements yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {announcements.map(ann => (
        <div key={ann.id} className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{ann.title}</h3>
          <p className="text-slate-600 mb-4">{ann.message}</p>
          <div className="flex items-center text-sm text-slate-500">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(ann.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  )
}
