// src/components/ErrorBoundary.tsx
import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8">
          <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-rose-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900">Something went wrong</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{this.state.message}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Empty state component ─────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
      {Icon && (
        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center">
          <Icon className="h-6 w-6 text-slate-400" />
        </div>
      )}
      <div>
        <p className="font-semibold text-slate-700">{title}</p>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// ── Page-level loading skeleton ───────────────────────────────────────────────

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-xl" />
    </div>
  )
}
