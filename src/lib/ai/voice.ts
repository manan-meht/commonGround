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
  return new OpenAI({ apiKey: OPENAI_API_KEY, fetch: globalThis.fetch })
}

/**
 * Transcribes an audio File to text. Audio is held in memory only — never
 * persisted. Returns the transcript string.
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  const client = getClient()
  const transcription = await client.audio.transcriptions.create({
    file: audioFile,
    model: process.env['OPENAI_TRANSCRIPTION_MODEL'] ?? 'gpt-4o-transcribe',
    response_format: 'json',
    prompt:
      'This is a private conflict-resolution intake. Preserve the speaker\'s wording. Common names and terms may include Urushi. Do not summarize.',
  })
  return transcription.text
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
