import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client that uses the service role key.
 * This client bypasses Row-Level Security — only use server-side.
 */
export function getServiceClient() {
  const url = process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!url || !key) {
    throw new Error('Supabase credentials are not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
