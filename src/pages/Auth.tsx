import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'

export function Auth() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success("Welcome back!")
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success("Registration successful! You are now logged in.")
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">HostelOS SaaS</h1>
          <p className="text-slate-500 mt-1 text-sm text-center">
            {isLogin ? 'Sign in to your administration dashboard' : 'Create an owner account to configure your first hostel'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="admin@example.com"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
