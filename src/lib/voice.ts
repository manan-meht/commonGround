/**
 * Voice-note helpers shared between browser recording UI and server routes.
 * Pure functions — safe to import from client and server.
 */

/** Max audio upload size accepted by the transcribe endpoint. */
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024 // 20 MB

/** Max recording length in the browser, in seconds. */
export const MAX_RECORDING_SECONDS = 180 // 3 minutes

/** Point at which we nudge the user to focus, in seconds. */
export const FOCUS_HINT_SECONDS = 90

/** TTS input character ceiling (OpenAI limit is 4096). */
export const MAX_TTS_INPUT_CHARS = 4096

/** MIME types accepted by the transcribe endpoint. */
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp3',
  'audio/mpga',
  'video/webm', // webm container can be reported this way
] as const

/** MIME types we prefer for MediaRecorder, in priority order. */
export const PREFERRED_RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
] as const

/**
 * Picks the best supported MediaRecorder MIME type.
 * `isSupported` defaults to the browser's MediaRecorder.isTypeSupported.
 * Returns an empty string to signal "use the browser default".
 */
export function selectRecordingMimeType(
  isSupported?: (type: string) => boolean
): string {
  const check =
    isSupported ??
    (typeof MediaRecorder !== 'undefined'
      ? (t: string) => MediaRecorder.isTypeSupported(t)
      : () => false)

  for (const type of PREFERRED_RECORDING_MIME_TYPES) {
    if (check(type)) return type
  }
  return '' // browser default
}

/** Normalises a recording MIME type to a bare type without codec params. */
export function baseMimeType(mimeType: string): string {
  return mimeType.split(';')[0]?.trim().toLowerCase() ?? ''
}

/** True when the given MIME type is in the transcription allowlist. */
export function isAllowedAudioMimeType(mimeType: string): boolean {
  return (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(
    baseMimeType(mimeType)
  )
}

/** True when the file size is present and within the allowed range. */
export function isAllowedAudioSize(size: number): boolean {
  return Number.isFinite(size) && size > 0 && size <= MAX_AUDIO_BYTES
}

/** Formats a duration in seconds as m:ss. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Prepares text for TTS: trims and truncates to the input limit.
 * Returns the (possibly truncated) text plus a flag.
 */
export function prepareTtsInput(text: string): {
  input: string
  truncated: boolean
} {
  const trimmed = text.trim()
  if (trimmed.length <= MAX_TTS_INPUT_CHARS) {
    return { input: trimmed, truncated: false }
  }
  return { input: trimmed.slice(0, MAX_TTS_INPUT_CHARS), truncated: true }
}
