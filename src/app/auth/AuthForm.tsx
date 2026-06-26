'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'signin' | 'signup'

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorParam === 'oauth_error' ? 'OAuth sign-in failed. Please try again.' : '')
  const [message, setMessage] = useState('')

  const supabase = createClient()

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (tab === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('Check your email to confirm your account, then sign in.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(next)
    router.refresh()
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email address first.'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage('Password reset link sent — check your email.')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/40 p-6">
      <div className="text-center mb-6">
        {tab === 'signin' && <h1 className="font-headline-lg text-on-surface mb-2">Welcome back</h1>}
        <p className="text-on-surface-variant font-body-md">A safe place for resolution. Log in to<br />continue your journey.</p>
      </div>
      {/* Tab toggle */}
      <div className="flex bg-surface-container-low rounded-xl p-1 mb-6">
        {(['signin', 'signup'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setMessage('') }}
            className={`flex-1 py-2 rounded-lg text-label-md font-medium transition-all ${
              tab === t ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {error && <p className="text-error text-label-md mb-4 text-center">{error}</p>}
      {message && <p className="text-primary text-label-md mb-4 text-center">{message}</p>}

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {tab === 'signup' && (
          <div className="space-y-1">
            <label className="block font-label-md text-on-surface-variant">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full h-12 px-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="block font-label-md text-on-surface-variant">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
            className="w-full h-12 px-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block font-label-md text-on-surface-variant">Password</label>
            {tab === 'signin' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-label-md text-secondary hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
            className="w-full h-12 px-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary text-white rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-label-sm text-outline">OR CONTINUE WITH</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => void handleOAuth('google')}
          disabled={loading}
          className="flex items-center justify-center gap-2 h-12 bg-white border border-outline-variant rounded-xl font-label-md text-on-surface hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <button
          onClick={() => void handleOAuth('facebook')}
          disabled={loading}
          className="flex items-center justify-center gap-2 h-12 bg-white border border-outline-variant rounded-xl font-label-md text-on-surface hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>
    </div>
  )
}
