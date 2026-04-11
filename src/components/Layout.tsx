import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex h-screen bg-slate-50/50 relative overflow-hidden text-slate-900">
      {/* Abstract decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/5 blur-[120px] pointer-events-none" />
      
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-8 border-t-[8px] border-transparent">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
