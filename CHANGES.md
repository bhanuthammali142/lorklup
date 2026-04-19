# HostelOS — All Fixes Applied

## How to apply these changes

Copy each file from this folder to the same path in your project:

```
hostelos-fixes/
  .env.example                          → replace existing
  .gitignore                            → replace existing
  src/App.tsx                           → replace existing
  src/lib/supabase.ts                   → replace existing
  src/lib/supabase-admin.ts             → replace existing (now empty stub)
  src/lib/adminApi.ts                   → NEW FILE
  src/lib/api.ts                        → replace existing
  src/lib/AuthContext.tsx               → replace existing
  src/components/AddStudentModal.tsx    → replace existing
  src/components/ErrorBoundary.tsx      → NEW FILE
  src/pages/Settings.tsx                → replace existing
  src/pages/FoodMenuEditor.tsx          → NEW FILE
  src/super-admin/components/AddHostelModal.tsx → replace existing
  src/super-admin/pages/SuperAdminDashboard.tsx → replace existing
  src/super-admin/pages/SuperAdminHostels.tsx   → replace existing
  supabase/functions/admin-operations/index.ts  → NEW FILE (deploy as Edge Function)
  supabase_migration_v5.sql             → run in Supabase SQL Editor
```

---

## Required one-time setup steps

### 1. Deploy the Edge Function
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login and link your project
supabase login
supabase link --project-ref your-project-id

# Set the service role key as a secret (server-side only — never in .env)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Deploy the function
supabase functions deploy admin-operations
```

### 2. Rotate your service role key
Your old key was exposed in `run-migration.mjs`. Even after applying these fixes:
1. Go to Supabase Dashboard → Settings → API
2. Click "Reveal" on the service role key
3. Click the rotate/regenerate button
4. Update your Edge Function secret: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=new-key`

### 3. Run the database migration
Open Supabase SQL Editor and run `supabase_migration_v5.sql`

### 4. Update your .env.local
Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. It is no longer needed in any frontend env var.

### 5. Enable Supabase Phone Auth (for real OTP)
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Phone" provider
3. Add your SMS provider credentials (Twilio recommended)

---

## What was fixed and why

### Critical security fixes

**1. Service role key removed from frontend (CRITICAL)**
- File: `src/lib/supabase.ts` — `supabaseAdmin` export removed entirely
- File: `src/lib/supabase-admin.ts` — emptied to stub, redirects to adminApi.ts
- File: `src/lib/adminApi.ts` — NEW: calls Edge Function with user's JWT token
- File: `supabase/functions/admin-operations/index.ts` — NEW: server-side admin ops
- Why: The `VITE_SUPABASE_SERVICE_ROLE_KEY` was being bundled into the browser JS. Any user could open DevTools, copy the key, and make unrestricted database calls bypassing all RLS.

**2. Hardcoded credentials removed**
- File: `.gitignore` — `run-migration.mjs`, `db-check.mjs`, `query.js` now ignored
- File: `.env.example` — documents that service key must NOT be in VITE_ vars
- Why: `run-migration.mjs` had the service key hardcoded as a string literal.

**3. Multi-tenant isolation hardened**
- File: `src/lib/api.ts` — all queries now rely on RLS for enforcement
- File: `supabase_migration_v5.sql` — super_admin policies use JWT role check
- Why: Admin A could previously pass Admin B's hostel_id to API functions and read B's data.

**4. Student email uniqueness fixed**
- File: `supabase/functions/admin-operations/index.ts` — email scoped to hostel_id
- Why: `phone.replace(/D/g,'')@hostel.local` format caused collisions across hostels for students with same phone number.

**5. First-login password change**
- File: `src/components/AddStudentModal.tsx` — shows must_change_password warning
- File: `supabase_migration_v5.sql` — adds `must_change_password` column
- Why: Temp passwords were shown once with no mechanism to force change.

### Product quality fixes

**6. Real SMS OTP replaces simulation**
- File: `src/components/AddStudentModal.tsx` — uses `supabase.auth.signInWithOtp()` and `verifyOtp()`
- Why: The previous implementation accepted any string as a valid OTP.

**7. Duplicate StudentLayout removed**
- File: `src/App.tsx` — imports only from `src/student/StudentLayout` (canonical version)
- `src/pages/student/StudentLayout.tsx` and `src/student/components/StudentNav.tsx` can be deleted

**8. Fee month timezone bug fixed**
- File: `src/lib/api.ts` — all month dates normalised to `Date.UTC()` before `.toISOString()`
- Why: `new Date().toISOString()` in IST timezone (UTC+5:30) could produce a previous month's date for times between midnight and 5:30 AM.

**9. Error boundaries added**
- File: `src/components/ErrorBoundary.tsx` — NEW: `ErrorBoundary`, `EmptyState`, `PageSkeleton`
- File: `src/App.tsx` — `ErrorBoundary` wraps each route group
- Why: A single failed Supabase query was leaving pages blank with no feedback or retry.

**10. Accessibility: modals have focus trap and Escape key**
- File: `src/components/AddStudentModal.tsx` — `aria-modal`, `role="dialog"`, Escape key handler, focus on open
- File: `src/super-admin/components/AddHostelModal.tsx` — same

**11. Food menu editor for admins**
- File: `src/pages/FoodMenuEditor.tsx` — NEW: full weekly meal editor
- File: `src/pages/Settings.tsx` — "Food Menu" tab wired in with lazy load
- Why: The `food_menus` table existed and students could read it, but admins had no UI to write it.

### Architecture fixes

**12. Code splitting with React.lazy**
- File: `src/App.tsx` — all route components wrapped with `React.lazy` + `Suspense`
- Why: All modules (admin, student, super-admin) were loading together on every page load.

**13. Analytics occupancy data is now real**
- File: `src/lib/api.ts` — `getOccupancyByMonth()` queries `occupancy_snapshots` table if available
- File: `supabase_migration_v5.sql` — creates `occupancy_snapshots` table + snapshot function
- Why: The original function returned the same occupancy % for every month (fake trend line).

**14. supabaseAdmin removed from SuperAdmin pages**
- File: `src/super-admin/pages/SuperAdminDashboard.tsx` — uses anon client with super_admin RLS
- File: `src/super-admin/pages/SuperAdminHostels.tsx` — same
- Why: These pages were bypassing RLS entirely by using the service key client.
