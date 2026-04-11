import React from 'react'
import { Outlet } from 'react-router-dom'
import { StudentNav } from './components/StudentNav'

/**
 * StudentLayout — exclusively for student users.
 * Mobile-first layout with bottom nav + desktop sidebar.
 * NEVER imported in admin module.
 */
export function StudentLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      <StudentNav />

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
