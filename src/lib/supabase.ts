/**
 * supabase.ts — DISABLED
 * Supabase has been removed. This file is kept to prevent import errors
 * from any file that might still reference it during the transition.
 * All actual API calls now go through src/lib/api-client.ts
 */

// Null stub — any code that still imports supabase will get a clear error
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    throw new Error(
      `[Supabase REMOVED] You are calling supabase.${String(prop)}() but Supabase has been replaced with the MySQL REST API. ` +
      `Use functions from src/lib/api-client.ts or src/lib/api.ts instead.`
    )
  }
})
