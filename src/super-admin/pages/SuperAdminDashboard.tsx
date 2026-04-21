// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, Building2, Users, DollarSign } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { apiHostels, apiStudents } from '../../lib/api-client'
import toast from 'react-hot-toast'

export function SuperAdminDashboard() {
  const { user } = useAuth()

  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      try {
        const hostels = await apiHostels.getAll()
        const students = await apiStudents.getAll('')
        return {
          hostels_count: hostels?.length || 0,
          students_count: students?.length || 0,
          revenue: 0,
        }
      } catch (err) {
        toast.error('Failed to load statistics')
        return { hostels_count: 0, students_count: 0, revenue: 0 }
      }
    },
  })

  if (!user || user.role !== 'super_admin') {
    return <div className="p-8 text-center text-slate-600">Access denied</div>
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">System-wide overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Building2 className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-sm text-slate-600">Hostels</p>
              <p className="text-3xl font-bold text-slate-900">{stats.hostels_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Users className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="text-sm text-slate-600">Students</p>
              <p className="text-3xl font-bold text-slate-900">{stats.students_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <DollarSign className="h-10 w-10 text-amber-600" />
            <div>
              <p className="text-sm text-slate-600">Revenue</p>
              <p className="text-3xl font-bold text-slate-900">₹0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
