/**
 * Server-only: resolve and validate a Together session by case reference.
 * Ensures the requesting user owns the case.
 */

import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import type { DbTogetherSession } from '@/lib/db/types'

export interface TogetherSessionAccess {
  session: DbTogetherSession
  caseId: string
  userId: string
}

export async function requireTogetherSession(reference: string): Promise<TogetherSessionAccess | { error: string; status: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.', status: 401 }

  const db = getServiceClient()

  const { data: caseRow } = await db
    .from('cases')
    .select('id, user_id, conversation_mode')
    .eq('public_reference', reference)
    .eq('conversation_mode', 'together')
    .single()

  if (!caseRow) return { error: 'Session not found.', status: 404 }
  if (caseRow.user_id !== user.id) return { error: 'Forbidden.', status: 403 }

  const { data: session } = await db
    .from('together_sessions')
    .select('*')
    .eq('case_id', caseRow.id)
    .single()

  if (!session) return { error: 'Session not found.', status: 404 }

  return { session: session as DbTogetherSession, caseId: caseRow.id, userId: user.id }
}

export function isAccessError(v: unknown): v is { error: string; status: number } {
  return typeof v === 'object' && v !== null && 'error' in v && 'status' in v
}
