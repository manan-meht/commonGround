import { Suspense } from 'react'
import { AuthForm } from './AuthForm'
import { SiteFooter } from '@/components/SiteHeader'
import Link from 'next/link'

export const metadata = { title: 'Sign In — Urushi Labs' }

export default function AuthPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
        <Link href="/" className="font-headline-md text-primary font-semibold">Urushi Labs</Link>
        <Link href="/" className="flex items-center gap-1 text-label-md text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Exit
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Suspense>
            <AuthForm />
          </Suspense>

          <p className="text-center text-label-sm text-on-surface-variant mt-6 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span><em>Your account helps us keep your conversations private and secure.</em></span>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
