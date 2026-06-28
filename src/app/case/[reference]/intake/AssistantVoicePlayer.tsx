'use client'

import { useEffect, useRef, useState } from 'react'

type PlayerState = 'idle' | 'loading' | 'ready' | 'error'

// Module-level registry so only one clip plays at a time across all players.
let currentlyPlaying: HTMLAudioElement | null = null

interface Props {
  messageId: string
}

export function AssistantVoicePlayer({ messageId }: Props) {
  const [state, setState] = useState<PlayerState>('idle')
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  // Cleanup on unmount: stop audio and revoke object URL.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        if (currentlyPlaying === audioRef.current) currentlyPlaying = null
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  async function loadAndPlay() {
    setState('loading')
    try {
      const res = await fetch(`/api/intake/messages/${messageId}/speech`)
      if (!res.ok) throw new Error('speech failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      urlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setPlaying(false)
        if (currentlyPlaying === audio) currentlyPlaying = null
      }
      audio.onpause = () => setPlaying(false)
      audio.onplay = () => setPlaying(true)

      setState('ready')
      startPlayback()
    } catch {
      setState('error')
    }
  }

  function startPlayback() {
    const audio = audioRef.current
    if (!audio) return
    // Pause any other clip first — one at a time.
    if (currentlyPlaying && currentlyPlaying !== audio) {
      currentlyPlaying.pause()
    }
    currentlyPlaying = audio
    void audio.play()
  }

  function handlePlayPause() {
    const audio = audioRef.current
    if (!audio) {
      void loadAndPlay()
      return
    }
    if (playing) {
      audio.pause()
    } else {
      startPlayback()
    }
  }

  function handleRestart() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    startPlayback()
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 mt-2 text-label-sm text-on-surface-variant" role="alert">
        <span>The voice version could not be created. You can still read the response.</span>
        <button
          onClick={() => void loadAndPlay()}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Retry
        </button>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <button
        onClick={() => void loadAndPlay()}
        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-label-sm"
        aria-label="Listen to this response"
      >
        <span className="material-symbols-outlined text-[18px]">volume_up</span>
        Listen
      </button>
    )
  }

  if (state === 'loading') {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm opacity-70"
        aria-label="Preparing voice"
      >
        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
        Preparing…
      </button>
    )
  }

  // ready
  return (
    <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-surface-container">
      <button
        onClick={handlePlayPause}
        className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {playing ? 'pause' : 'play_arrow'}
        </span>
      </button>
      <button
        onClick={handleRestart}
        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
        aria-label="Restart"
      >
        <span className="material-symbols-outlined text-[18px]">replay</span>
      </button>
      <span className="text-label-sm text-on-surface-variant pr-2">AI-generated voice</span>
    </div>
  )
}
