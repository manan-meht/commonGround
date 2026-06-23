/**
 * AI intake conversation service — server-only.
 */

import OpenAI from 'openai'
import { buildIntakeSystemPrompt, buildSummaryGenerationPrompt, type IntakeContext } from './intakePrompt'
import { getEnv } from '@/lib/env'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function getClient(): OpenAI {
  const { OPENAI_API_KEY } = getEnv()
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured.')
  return new OpenAI({ apiKey: OPENAI_API_KEY })
}

export async function continueIntake(
  ctx: IntakeContext,
  history: ChatMessage[]
): Promise<string> {
  const { OPENAI_MODEL, DEMO_MODE } = getEnv()

  if (DEMO_MODE && !process.env['OPENAI_API_KEY']) {
    return getDemoResponse(history.length)
  }

  const client = getClient()
  const systemPrompt = buildIntakeSystemPrompt(ctx)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    max_tokens: 400,
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI.')
  return content
}

export async function generateIntakeSummary(
  ctx: IntakeContext,
  transcript: string
): Promise<string> {
  const { OPENAI_MODEL, DEMO_MODE } = getEnv()

  if (DEMO_MODE && !process.env['OPENAI_API_KEY']) {
    return JSON.stringify(getDemoSummary(ctx))
  }

  const client = getClient()
  const prompt = buildSummaryGenerationPrompt(ctx, transcript)

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 1200,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Empty summary response from OpenAI.')

  JSON.parse(content)  // validate it is valid JSON
  return content
}

function getDemoResponse(turn: number): string {
  const responses = [
    "Hello, and welcome. This is a private, confidential space. Nothing you share here will be seen by the other participant directly. To begin, could you describe what happened — focusing on the specific events rather than interpretations?",
    "Thank you for sharing that. It sounds like there were some moments that felt particularly significant to you. How did those events impact you emotionally and practically?",
    "I appreciate you being so open. When you reflect on the situation, is there anything the other person may have misunderstood about what you were trying to communicate or do?",
    "That's really helpful context. What would you most like to be acknowledged for in this situation, and what outcome are you hoping for from this process?",
    "Thank you — I think I have a good understanding of your experience now. I'm ready to generate a summary for you to review. Shall I do that?",
  ]
  return responses[Math.min(turn, responses.length - 1)] ?? responses[0] ?? ''
}

function getDemoSummary(ctx: IntakeContext): Record<string, unknown> {
  return {
    whatHappened: `${ctx.participantName} described a series of events related to "${ctx.topic}" that they felt were handled in a way that overlooked their perspective.`,
    emotionalImpact: 'They described feeling unheard and frustrated, with some anxiety about the situation continuing unresolved.',
    theirNeeds: ['To feel heard and acknowledged', 'Clearer communication going forward', 'A fair process for resolving the issue'],
    theirInterpretation: `They interpreted ${ctx.otherPartyName}'s actions as indicating a lack of consideration for their perspective.`,
    whatOtherPartyMayHaveExperienced: `${ctx.participantName} acknowledged that ${ctx.otherPartyName} may have been under pressure and may not have intended to come across as dismissive.`,
    theirContribution: 'They reflected that they could have raised their concerns earlier rather than letting the situation build.',
    desiredOutcome: 'A mutually respectful resolution where both parties feel their perspective has been considered.',
    keyThemes: ['Communication breakdown', 'Unmet expectations', 'Need for acknowledgement'],
  }
}
