/**
 * Server-only OpenAI audio helpers: transcription (speech-to-text) and
 * speech synthesis (text-to-speech). Never import from client components.
 */

import OpenAI from 'openai'
import { getEnv } from '@/lib/env'
import { prepareTtsInput } from '@/lib/voice'

function getClient(): OpenAI {
  const { OPENAI_API_KEY } = getEnv()
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured.')
  return new OpenAI({ apiKey: OPENAI_API_KEY })
}

/**
 * Transcribes an audio File to text. Audio is held in memory only — never
 * persisted. Returns the transcript string.
 *
 * Uses fetch directly rather than the OpenAI SDK to ensure compatibility with
 * the Cloudflare Workers runtime, where the SDK's Node.js HTTP internals hang.
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  const { OPENAI_API_KEY } = getEnv()
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured.')

  const model = process.env['OPENAI_TRANSCRIPTION_MODEL'] ?? 'whisper-1'

  const form = new FormData()
  form.append('file', audioFile, audioFile.name)
  form.append('model', model)
  form.append('response_format', 'json')
  form.append('prompt', "This is a private conflict-resolution intake. Preserve the speaker's wording. Common names and terms may include Urushi. Do not summarize.")

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI transcription failed (${res.status}): ${text}`)
  }

  const data = await res.json() as { text?: string }
  if (!data.text) throw new Error('Empty transcript returned from OpenAI.')
  return data.text
}

const TTS_INSTRUCTIONS =
  'Speak calmly, warmly, and neutrally. Use a measured conversational pace with short natural pauses. Do not sound judgmental, theatrical, overly cheerful, clinical, or authoritative.'

/**
 * Synthesises speech (MP3) from text. Truncates to the TTS input limit.
 * Returns the audio bytes.
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const { input } = prepareTtsInput(text)
  const client = getClient()
  const voice = process.env['OPENAI_TTS_VOICE'] ?? 'coral'
  const mp3 = await client.audio.speech.create({
    model: process.env['OPENAI_TTS_MODEL'] ?? 'gpt-4o-mini-tts',
    voice: voice as 'coral',
    input,
    instructions: TTS_INSTRUCTIONS,
    response_format: 'mp3',
  })
  const arrayBuffer = await mp3.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
