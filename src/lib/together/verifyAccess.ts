/**
 * Verify access to a together session — accepts either:
 *   - Supabase auth user who owns the case (Person A / creator)
 *   - together_participant cookie (Person B, separate-device mode)
 *
 * Returns the verified speaker identity, or null if unauthorized.
 */

import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { getParticipantSession } from '@/lib/auth/togetherParticipantSession'

export type TogetherAccessResult =
  | { speaker: 'person_a'; userId: string }
  | { speaker: 'person_b'; sessionId: string }

export async function verifyTogetherAccess(sessionId: string): Promise<TogetherAccessResult | null> {
  // Try Supabase auth first (Person A / owner)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const db = getServiceClient()
    const { data: session } = await db
      .from('together_sessions')
      .select('cases!inner(user_id)')
      .eq('id', sessionId)
      .single()

    if (session) {
      type S = typeof session & { cases: { user_id: string } }
      if ((session as S).cases.user_id === user.id) {
        return { speaker: 'person_a', userId: user.id }
      }
    }
  }

  // Fall back to participant cookie (Person B)
  const participant = await getParticipantSession()
  if (participant && participant.sessionId === sessionId && participant.speaker === 'person_b') {
    return { speaker: 'person_b', sessionId }
  }

  return null
}
