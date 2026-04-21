// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AdminSidebar } from './components/AdminSidebar'
import { AdminOnboardingWizard } from './components/AdminOnboardingWizard'
import { Menu, X } from 'lucide-react'

export function AdminLayout() {
  const [showWizard, setShowWizard] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Simulate first login detection with localStorage
    if (!localStorage.getItem('admin_onboarded')) {
      setShowWizard(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('admin_onboarded', '1')
    setShowWizard(false)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen bg-[#fcfcfd] relative overflow-hidden text-[#111827]">
      {/* Ambient background */}
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-400/5 blur-[120px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="hidden md:block z-20">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden w-64 bg-white ${mobileMenuOpen ? 'translate-x-0 cursor-default' : '-translate-x-full'}`}
        role="navigation"
        aria-label="Mobile navigation menu"
        aria-hidden={!mobileMenuOpen}
      >
        <AdminSidebar isMobile onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Top Navbar */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 sm:px-6 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-2 text-blue-600">
            <span className="text-lg font-black tracking-tight text-slate-900">HostelOS</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
            {showWizard && <AdminOnboardingWizard onComplete={handleComplete} />}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
