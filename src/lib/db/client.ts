import { createClient } from '@supabase/supabase-js'

function getVar(name: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare')
    const ctx = getCloudflareContext() as { env: Record<string, string | undefined> }
    return ctx.env[name] ?? process.env[name]
  } catch {
    return process.env[name]
  }
}

/**
 * Server-only Supabase client that uses the service role key.
 * This client bypasses Row-Level Security — only use server-side.
 */
export function getServiceClient() {
  const url = getVar('SUPABASE_URL') ?? getVar('NEXT_PUBLIC_SUPABASE_URL')
  const key = getVar('SUPABASE_SERVICE_ROLE_KEY')

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
