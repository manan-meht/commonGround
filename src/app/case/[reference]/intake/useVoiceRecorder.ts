'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  selectRecordingMimeType,
  MAX_RECORDING_SECONDS,
  FOCUS_HINT_SECONDS,
} from '@/lib/voice'

export type RecorderState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'preview'
  | 'transcribing'
  | 'transcript-review'
  | 'error'

export interface VoiceRecorder {
  state: RecorderState
  supported: boolean
  elapsed: number
  showFocusHint: boolean
  audioUrl: string | null
  transcript: string
  error: string
  setTranscript: (t: string) => void
  start: () => Promise<void>
  stop: () => void
  cancel: () => void
  reRecord: () => void
  transcribe: () => Promise<void>
  setError: (msg: string) => void
}

export function useVoiceRecorder(): VoiceRecorder {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const urlRef = useRef<string | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimer()
      stopTracks()
      revokeUrl()
    }
  }, [clearTimer, stopTracks, revokeUrl])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    clearTimer()
  }, [clearTimer])

  const start = useCallback(async () => {
    if (!supported) {
      setError('Voice recording is not supported in this browser.')
      setState('error')
      return
    }
    setError('')
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = selectRecordingMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stopTracks()
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        blobRef.current = blob
        revokeUrl()
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setAudioUrl(url)
        setState('preview')
      }

      recorder.start()
      setElapsed(0)
      setState('recording')
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1
          if (next >= MAX_RECORDING_SECONDS) {
            // Auto-stop at the cap.
            if (recorderRef.current && recorderRef.current.state !== 'inactive') {
              recorderRef.current.stop()
            }
            clearTimer()
          }
          return next
        })
      }, 1000)
    } catch {
      stopTracks()
      setError('Microphone access was denied or unavailable.')
      setState('error')
    }
  }, [supported, stopTracks, revokeUrl, clearTimer])

  const cancel = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    clearTimer()
    stopTracks()
    revokeUrl()
    chunksRef.current = []
    blobRef.current = null
    setAudioUrl(null)
    setTranscript('')
    setElapsed(0)
    setError('')
    setState('idle')
  }, [clearTimer, stopTracks, revokeUrl])

  const reRecord = useCallback(() => {
    revokeUrl()
    setAudioUrl(null)
    blobRef.current = null
    chunksRef.current = []
    setTranscript('')
    setElapsed(0)
    void start()
  }, [revokeUrl, start])

  const transcribe = useCallback(async () => {
    const blob = blobRef.current
    if (!blob) return
    setState('transcribing')
    setError('')
    try {
      const form = new FormData()
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      form.append('audio', blob, `voice-note.${ext}`)
      const res = await fetch('/api/intake/transcribe', { method: 'POST', body: form })
      const data = (await res.json()) as { transcript?: string; error?: string }
      if (!res.ok || !data.transcript) {
        setError(data.error ?? 'Failed to transcribe audio.')
        setState('preview')
        return
      }
      setTranscript(data.transcript)
      setState('transcript-review')
    } catch {
      setError('A network error occurred while transcribing.')
      setState('preview')
    }
  }, [])

  return {
    state,
    supported,
    elapsed,
    showFocusHint: state === 'recording' && elapsed >= FOCUS_HINT_SECONDS,
    audioUrl,
    transcript,
    error,
    setTranscript,
    start,
    stop,
    cancel,
    reRecord,
    transcribe,
    setError,
  }
}
