'use client'

import Link from 'next/link'

interface SiteHeaderProps {
  showExit?: boolean
  exitLabel?: string
  exitHref?: string
}

export function SiteHeader({
  showExit = true,
  exitLabel = 'Exit',
  exitHref = '/',
}: SiteHeaderProps) {
  return (
    <header className="bg-surface sticky top-0 z-50 shadow-sm">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
          Common Ground
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
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-stack-md mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-stack-sm text-center md:text-left max-w-container-max mx-auto">
        <div className="font-headline-md text-headline-md text-primary font-bold">Common Ground</div>
        <div className="flex flex-wrap justify-center gap-4 text-label-sm text-on-surface-variant">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/safety" className="hover:text-primary transition-colors">Safety</Link>
        </div>
        <p className="text-label-sm text-on-surface-variant opacity-70">
          © 2025 Common Ground. Not a substitute for legal, therapeutic, or professional advice.
        </p>
      </div>
    </footer>
  )
}
