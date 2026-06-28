import { describe, it, expect } from 'vitest'
import {
  selectRecordingMimeType,
  baseMimeType,
  isAllowedAudioMimeType,
  isAllowedAudioSize,
  formatDuration,
  prepareTtsInput,
  MAX_AUDIO_BYTES,
  MAX_TTS_INPUT_CHARS,
} from './voice'

describe('selectRecordingMimeType', () => {
  it('prefers audio/webm;codecs=opus when supported', () => {
    expect(selectRecordingMimeType(() => true)).toBe('audio/webm;codecs=opus')
  })

  it('falls back to audio/webm when opus is not supported', () => {
    expect(selectRecordingMimeType((t) => t === 'audio/webm' || t === 'audio/mp4')).toBe('audio/webm')
  })

  it('falls back to audio/mp4 when only mp4 is supported', () => {
    expect(selectRecordingMimeType((t) => t === 'audio/mp4')).toBe('audio/mp4')
  })

  it('returns empty string (browser default) when nothing is supported', () => {
    expect(selectRecordingMimeType(() => false)).toBe('')
  })
})

describe('baseMimeType', () => {
  it('strips codec params and lowercases', () => {
    expect(baseMimeType('audio/webm;codecs=opus')).toBe('audio/webm')
    expect(baseMimeType('AUDIO/MP4')).toBe('audio/mp4')
  })
})

describe('isAllowedAudioMimeType', () => {
  it('accepts allowlisted types including with codec params', () => {
    expect(isAllowedAudioMimeType('audio/webm')).toBe(true)
    expect(isAllowedAudioMimeType('audio/webm;codecs=opus')).toBe(true)
    expect(isAllowedAudioMimeType('audio/mp4')).toBe(true)
    expect(isAllowedAudioMimeType('video/webm')).toBe(true)
  })

  it('rejects non-allowlisted types', () => {
    expect(isAllowedAudioMimeType('application/json')).toBe(false)
    expect(isAllowedAudioMimeType('image/png')).toBe(false)
    expect(isAllowedAudioMimeType('')).toBe(false)
  })
})

describe('isAllowedAudioSize', () => {
  it('rejects zero and negative', () => {
    expect(isAllowedAudioSize(0)).toBe(false)
    expect(isAllowedAudioSize(-1)).toBe(false)
  })

  it('accepts sizes within the cap', () => {
    expect(isAllowedAudioSize(1024)).toBe(true)
    expect(isAllowedAudioSize(MAX_AUDIO_BYTES)).toBe(true)
  })

  it('rejects sizes over the cap', () => {
    expect(isAllowedAudioSize(MAX_AUDIO_BYTES + 1)).toBe(false)
  })

  it('rejects NaN', () => {
    expect(isAllowedAudioSize(NaN)).toBe(false)
  })
})

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(5)).toBe('0:05')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(180)).toBe('3:00')
  })

  it('clamps negative input to zero', () => {
    expect(formatDuration(-10)).toBe('0:00')
  })
})

describe('prepareTtsInput', () => {
  it('trims and reports no truncation for short text', () => {
    expect(prepareTtsInput('  hello  ')).toEqual({ input: 'hello', truncated: false })
  })

  it('truncates text over the limit', () => {
    const long = 'a'.repeat(MAX_TTS_INPUT_CHARS + 100)
    const result = prepareTtsInput(long)
    expect(result.truncated).toBe(true)
    expect(result.input.length).toBe(MAX_TTS_INPUT_CHARS)
  })
})
