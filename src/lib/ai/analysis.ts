/**
 * Analysis service — server-only.
 * Decrypts both submissions, calls OpenAI, validates output.
 */

import OpenAI from 'openai'
import {
  buildMediationSystemPrompt,
  buildMediationUserMessage,
  SharedReportSchema,
  MEDIATION_PROMPT_VERSION,
  type ValidatedSharedReport,
  type MediationContext,
} from './mediationPrompt'
import { getEnv } from '@/lib/env'
import { MOCK_REPORT } from './mockReport'

export async function runAnalysis(ctx: MediationContext): Promise<ValidatedSharedReport> {
  const { OPENAI_MODEL, OPENAI_API_KEY, DEMO_MODE } = getEnv()

  if (DEMO_MODE && !OPENAI_API_KEY) {
    await new Promise((r) => setTimeout(r, 1000))  // simulate processing time
    return MOCK_REPORT
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Cannot run analysis.')
  }

  const client = new OpenAI({ apiKey: OPENAI_API_KEY })
  const systemPrompt = buildMediationSystemPrompt()
  const userMessage = buildMediationUserMessage(ctx)

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
    temperature: 0.4,
  })

  const rawContent = response.choices[0]?.message?.content
  if (!rawContent) throw new Error('Empty response from OpenAI analysis.')

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    throw new Error('OpenAI returned invalid JSON in analysis response.')
  }

  const result = SharedReportSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`OpenAI analysis response failed schema validation: ${JSON.stringify(result.error.issues, null, 2)}`)
  }

  return result.data
}

export { MEDIATION_PROMPT_VERSION }
