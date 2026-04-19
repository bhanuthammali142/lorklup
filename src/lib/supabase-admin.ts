/**
 * supabase-admin.ts
 *
 * SECURITY: The service role key MUST NOT be bundled into browser code.
 * All privileged operations are handled by the admin-operations Edge Function.
 *
 * Deploy the Edge Function with:
 *   supabase functions deploy admin-operations
 *
 * This file intentionally exports null to prevent any accidental import
 * from using a real admin client in the browser.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: null = null
