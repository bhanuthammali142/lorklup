import React from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './components/AdminSidebar'

/**
 * AdminLayout — exclusively for admin users.
 * Renders sidebar + main content area. Never shown to students.
 */
export function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-50/50 relative overflow-hidden text-slate-900">
      {/* Ambient background */}
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-400/5 blur-[120px] pointer-events-none" />

      <AdminSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1440px] mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
