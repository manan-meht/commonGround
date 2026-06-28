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

export type MicError =
  | 'permission-denied'
  | 'no-device'
  | 'in-use'
  | 'unsupported'
  | 'insecure-context'
  | 'unavailable'

export interface VoiceRecorder {
  state: RecorderState
  supported: boolean
  elapsed: number
  showFocusHint: boolean
  audioUrl: string | null
  transcript: string
  error: MicError | string
  setTranscript: (t: string) => void
  start: () => Promise<void>
  stop: () => void
  cancel: () => void
  reRecord: () => void
  transcribe: () => Promise<void>
  setError: (msg: string) => void
}

function classifyError(err: unknown): MicError {
  const name = (err as { name?: string }).name
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'permission-denied'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'no-device'
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'in-use'
  return 'unavailable'
}


export function useVoiceRecorder(): VoiceRecorder {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<MicError | string>('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const urlRef = useRef<string | null>(null)
  // Guard: prevent concurrent getUserMedia calls
  const requestingRef = useRef(false)

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
      requestingRef.current = false
    }
  }, [clearTimer, stopTracks, revokeUrl])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    clearTimer()
  }, [clearTimer])

  const startRecording = useCallback((stream: MediaStream) => {
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
          if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop()
          }
          clearTimer()
        }
        return next
      })
    }, 1000)
  }, [stopTracks, revokeUrl, clearTimer])

  const start = useCallback(async () => {
    if (!supported) {
      setError('unsupported')
      setState('error')
      return
    }

    // Secure context check (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('insecure-context')
      setState('error')
      return
    }

    // Prevent concurrent permission requests
    if (requestingRef.current) return
    requestingRef.current = true

    setError('')
    setState('requesting')

    try {
      // getUserMedia is the authoritative permission request.
      // Calling it directly inside the click handler triggers the browser's
      // native Allow/Block prompt. The Permissions API is NOT used as a
      // pre-check because it can return 'denied' on some browsers even when
      // the user hasn't been asked yet, preventing the prompt from appearing.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      requestingRef.current = false
      startRecording(stream)
    } catch (err) {
      console.error('[useVoiceRecorder] getUserMedia failed:', (err as Error).name)
      stopTracks()
      requestingRef.current = false
      setError(classifyError(err))
      setState('error')
    }
  }, [supported, stopTracks, startRecording])

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
    requestingRef.current = false
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
