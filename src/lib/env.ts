/**
 * Server-side environment variable validation.
 * Call validateEnv() once at startup to surface missing vars clearly.
 * Never import this file from client components.
 */

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
  const demoMode = process.env['DEMO_MODE'] === 'true'

  const missing: string[] = []

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (!demoMode && !process.env['OPENAI_API_KEY']) {
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

  if (process.env['SUBMISSION_ENCRYPTION_KEY'] && !/^[0-9a-f]{64}$/i.test(process.env['SUBMISSION_ENCRYPTION_KEY'])) {
    throw new Error('SUBMISSION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).')
  }
}

export function getEnv(): EnvConfig {
  return {
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
    OPENAI_API_KEY: process.env['OPENAI_API_KEY'] ?? '',
    OPENAI_MODEL: process.env['OPENAI_MODEL'] ?? 'gpt-4o',
    SUBMISSION_ENCRYPTION_KEY: process.env['SUBMISSION_ENCRYPTION_KEY'] ?? '',
    SESSION_SECRET: process.env['SESSION_SECRET'] ?? '',
    CRON_SECRET: process.env['CRON_SECRET'] ?? '',
    DEMO_MODE: process.env['DEMO_MODE'] === 'true',
    WHATSAPP_ACCESS_TOKEN: process.env['WHATSAPP_ACCESS_TOKEN'],
    WHATSAPP_PHONE_NUMBER_ID: process.env['WHATSAPP_PHONE_NUMBER_ID'],
    WHATSAPP_API_VERSION: process.env['WHATSAPP_API_VERSION'] ?? 'v21.0',
    RESEND_API_KEY: process.env['RESEND_API_KEY'],
    EMAIL_FROM: process.env['EMAIL_FROM'],
  }
}
