'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SiteHeaderProps {
  showExit?: boolean
  exitLabel?: string
  exitHref?: string
  userEmail?: string | null
  logoHref?: string
}

export function SiteHeader({
  showExit = true,
  exitLabel = 'Exit',
  exitHref = '/',
  userEmail,
  logoHref,
}: SiteHeaderProps) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-surface sticky top-0 z-50 shadow-sm">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link href={logoHref ?? (userEmail ? '/dashboard' : '/')} className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
          <Image src="/logo.png" alt="Urushi Labs logo" width={28} height={28} className="rounded-sm" />
          Urushi Labs
        </Link>
        <div className="flex items-center gap-4">
          {userEmail ? (
            <>
              <Link href="/dashboard" className="text-on-surface-variant font-label-md hover:text-secondary transition-colors hidden md:flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                My cases
              </Link>
              <button
                onClick={() => void signOut()}
                className="text-on-surface-variant font-label-md flex items-center gap-1 hover:text-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span className="hidden md:inline">Sign out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth"
                className="inline-block bg-primary text-on-primary px-6 py-2 rounded-xl font-headline-md shadow-md active:opacity-80 transition-opacity"
              >
                Sign in
              </Link>
              {showExit && (
                <Link
                  href={exitHref}
                  className="text-on-surface-variant font-label-md flex items-center gap-1 hover:text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                  {exitLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-stack-md mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-stack-sm text-center md:text-left max-w-container-max mx-auto">
        <div className="font-headline-md text-headline-md text-primary font-bold">Urushi Labs</div>
        <div className="flex flex-wrap justify-center gap-4 text-label-sm text-on-surface-variant">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/safety" className="hover:text-primary transition-colors">Safety</Link>
        </div>
        <p className="text-label-sm text-on-surface-variant opacity-70">
          © 2025 Urushi Labs. Not a substitute for legal, therapeutic, or professional advice.
        </p>
      </div>
    </footer>
  )
}
