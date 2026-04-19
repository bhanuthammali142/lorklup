import React from 'react'
import { Terminal, Copy, Check, Server } from 'lucide-react'

export function DeployGuide() {
  const [copied, setCopied] = React.useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  const steps = [
    {
      title: 'Login to Supabase CLI',
      desc: 'Authenticate your local machine with your Supabase account.',
      code: 'supabase login',
    },
    {
      title: 'Link Your Project',
      desc: 'Connect your local workspace to your remote Supabase project. Find your project ID in the Supabase dashboard URL.',
      code: 'supabase link --project-ref YOUR_PROJECT_ID',
    },
    {
      title: 'Inject Secure Service Key',
      desc: 'Edge Functions need the service role key to bypass RLS for administrative actions. Get this from Settings > API.',
      code: 'supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here',
    },
    {
      title: 'Deploy the Edge Function',
      desc: 'Push the local admin-operations function to your live production environment. Wait for the green success check.',
      code: 'supabase functions deploy admin-operations',
    }
  ]

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-2">
          <Terminal className="h-6 w-6 text-indigo-600" />
          Deploy Guide
        </h1>
        <p className="text-slate-500">
          Your administrative features currently rely on the <code className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded font-bold">admin-operations</code> Edge Function.
          Follow these steps to deploy it securely.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <code className="text-sm font-mono text-emerald-400 select-all">{step.code}</code>
              <button
                onClick={() => handleCopy(step.code, i)}
                className="shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs font-bold"
              >
                {copied === i ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy Code</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
        <Server className="h-6 w-6 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-indigo-900">How do I verify it worked?</h4>
          <p className="text-sm text-indigo-700 mt-1">
            Once successfully deployed, the "Edge Functions" badge in the top right will turn green.
            You can then return to the hostels page and create new profiles!
          </p>
        </div>
      </div>
    </div>
  )
}
