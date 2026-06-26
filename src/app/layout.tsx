import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Urushi Labs — AI-Assisted Communication Facilitation',
  description:
    'Urushi Labs helps two people independently share their perspective with an impartial AI facilitator, then generates a neutral shared report.',
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-surface min-h-screen">
        {children}
      </body>
    </html>
  )
}
