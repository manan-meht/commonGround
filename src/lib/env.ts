/**
 * Server-side environment variable validation.
 * Call validateEnv() once at startup to surface missing vars clearly.
 * Never import this file from client components.
 */

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

export interface EnvConfig {
  NEXT_PUBLIC_APP_URL: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  OPENAI_API_KEY: string
  OPENAI_MODEL: string
  SUBMISSION_ENCRYPTION_KEY: string
  SESSION_SECRET: string
  CRON_SECRET: string
  DEMO_MODE: boolean
  WHATSAPP_ACCESS_TOKEN?: string
  WHATSAPP_PHONE_NUMBER_ID?: string
  WHATSAPP_API_VERSION?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
}

const REQUIRED_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUBMISSION_ENCRYPTION_KEY',
  'SESSION_SECRET',
  'CRON_SECRET',
] as const

export function validateEnv(): void {
  const demoMode = getVar('DEMO_MODE') === 'true'

  const missing: string[] = []

  for (const key of REQUIRED_VARS) {
    if (!getVar(key)) {
      missing.push(key)
    }
  }

  if (!demoMode && !getVar('OPENAI_API_KEY')) {
    missing.push('OPENAI_API_KEY')
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n')
    missing.forEach((v) => console.error(`  • ${v}`))
    console.error('\nCopy .env.example to .env.local and fill in the values.\n')
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  const encKey = getVar('SUBMISSION_ENCRYPTION_KEY')
  if (encKey && !/^[0-9a-f]{64}$/i.test(encKey)) {
    throw new Error('SUBMISSION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).')
  }
}

export function getEnv(): EnvConfig {
  return {
    NEXT_PUBLIC_APP_URL: getVar('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: getVar('NEXT_PUBLIC_SUPABASE_URL') ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? '',
    SUPABASE_SERVICE_ROLE_KEY: getVar('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    OPENAI_API_KEY: getVar('OPENAI_API_KEY') ?? '',
    OPENAI_MODEL: getVar('OPENAI_MODEL') ?? 'gpt-4o',
    SUBMISSION_ENCRYPTION_KEY: getVar('SUBMISSION_ENCRYPTION_KEY') ?? '',
    SESSION_SECRET: getVar('SESSION_SECRET') ?? '',
    CRON_SECRET: getVar('CRON_SECRET') ?? '',
    DEMO_MODE: getVar('DEMO_MODE') === 'true',
    WHATSAPP_ACCESS_TOKEN: getVar('WHATSAPP_ACCESS_TOKEN'),
    WHATSAPP_PHONE_NUMBER_ID: getVar('WHATSAPP_PHONE_NUMBER_ID'),
    WHATSAPP_API_VERSION: getVar('WHATSAPP_API_VERSION') ?? 'v21.0',
    RESEND_API_KEY: getVar('RESEND_API_KEY'),
    EMAIL_FROM: getVar('EMAIL_FROM'),
  }
}
