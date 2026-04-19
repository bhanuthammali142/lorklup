import { useState, useEffect } from 'react';
import { Server, CheckCircle2, XCircle, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export function EdgeFunctionStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [expanded, setExpanded] = useState(false);

  const checkStatus = async () => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-operations`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      });
      // Accept any non-network-error as online - since a 401 Unauthorized means it at least exists and fired our auth check!
      // But now we bypassed auth for ping, so it should return 200 OK.
      if (res.ok || res.status === 401 || res.status === 403) {
        setStatus('online');
        setExpanded(false);
      } else {
        setStatus('offline');
      }
    } catch (err) {
      setStatus('offline');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-500 animate-pulse">
        <Server className="h-3 w-3" />
        Checking Edge Functions...
      </div>
    );
  }

  if (status === 'online') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700 shadow-sm">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Edge Functions: Online
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" />
        Edge Functions: Not Deployed
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="absolute top-full right-0 mt-2 w-[340px] bg-white border border-rose-200 rounded-xl shadow-xl z-50 overflow-hidden text-left">
          <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
            <h4 className="font-bold text-rose-800 text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Deploy Required
            </h4>
          </div>
          <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed select-all">
            <span className="text-slate-500"># 1. Login to Supabase CLI</span><br />
            supabase login<br /><br />
            
            <span className="text-slate-500"># 2. Link your project</span><br />
            supabase link --project-ref YOUR_PROJECT_ID<br /><br />
            
            <span className="text-slate-500"># 3. Set service role key secret</span><br />
            supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx<br /><br />
            
            <span className="text-slate-500"># 4. Deploy the function</span><br />
            supabase functions deploy admin-operations
          </div>
        </div>
      )}
    </div>
  );
}
