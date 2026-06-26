import Link from 'next/link'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { getUser } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Urushi Labs — Understand each other before deciding what comes next',
}

export default async function LandingPage() {
  const isDemoMode = process.env['DEMO_MODE'] === 'true'
  const user = await getUser()

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader showExit={false} userEmail={user?.email} />

      {isDemoMode && (
        <div className="bg-secondary-container text-on-secondary-container text-center py-2 text-label-sm font-label-sm tracking-widest uppercase">
          Demo Mode — No external credentials required
        </div>
      )}

      <main className="relative flex-grow">
        {/* Hero */}
        <section className="gradient-mesh px-margin-mobile pt-stack-lg pb-stack-md text-center">
          <div className="max-w-2xl mx-auto">
            <span className="inline-block bg-primary-container/20 text-on-primary-container px-3 py-1 rounded-full font-label-sm mb-4">
              AI-POWERED FACILITATION
            </span>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-6 leading-tight">
              Understand each other before deciding what comes next
            </h1>
            <p className="text-on-surface-variant font-body-lg mb-8 max-w-md mx-auto">
              De-escalate conflict and find common ground through a private, neutral AI facilitator
              designed for safety and clarity.
            </p>
            <Link
              href={user ? '/start' : '/auth?next=/start'}
              className="inline-block w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-headline-md shadow-md active:opacity-80 transition-opacity"
            >
              Start a conversation
            </Link>
          </div>
          <div className="mt-12 relative h-72 w-full rounded-2xl overflow-hidden soft-shadow bg-surface-container max-w-2xl mx-auto">
            <div
              className="w-full h-full bg-cover opacity-80"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA4Z6y5z3Gc2_na9dg0x4KqdvscUxrvCgfXDzoJJHZdzBE83MhwS3CPhRQoKOmoPdjAtp9BiSd4wuDc8TorKsN6aL9jQRYVHoWtpG3KlltbqOlpsIPnqzWw_Wk0V6YiizHBVgYY97R1mqMDMonXxbSb9HEHSMKl9ftQE0caMnYQ3-2sZGIv0xycUGO3s5-OlRY2D5cRJ1wnuy6pePgKfzNqBs6fpKk97cctVHoTV2ancDoPeKohdwmtPAElesLcQfOYjSRSpTRfacg')",
                backgroundPosition: 'center calc(50% - 70px)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-40" />
          </div>
        </section>

        {/* Process */}
        <section className="px-margin-mobile py-stack-lg max-w-2xl mx-auto">
          <h2 className="font-headline-md text-on-surface mb-stack-md text-center">Our Neutral Process</h2>
          <div className="flex flex-col gap-8">
            {[
              {
                icon: 'lock',
                title: '1. Share privately',
                desc: 'Each person shares their perspective with the AI facilitator in a private, pressure-free space.',
                bg: 'bg-primary-container/20',
                color: 'text-primary',
              },
              {
                icon: 'person_add',
                title: '2. Invite',
                desc: 'Once you\'re ready, securely invite the other party to share their view. The AI remains neutral to both.',
                bg: 'bg-secondary-container/30',
                color: 'text-secondary',
              },
              {
                icon: 'assignment',
                title: '3. Review report',
                desc: 'Receive a synthesised report highlighting areas of alignment and concrete paths forward.',
                bg: 'bg-tertiary-container/30',
                color: 'text-tertiary',
              },
            ].map((step) => (
              <div
                key={step.title}
                className="bg-surface-container-lowest p-6 rounded-2xl soft-shadow border border-outline-variant/30"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 shrink-0 ${step.bg} rounded-full flex items-center justify-center ${step.color}`}>
                    <span className="material-symbols-outlined">{step.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-on-surface mb-1">{step.title}</h3>
                    <p className="text-on-surface-variant">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust signals */}
        <section className="bg-surface-container-low px-margin-mobile py-stack-lg">
          <div className="max-w-md mx-auto text-center mb-10">
            <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <h2 className="font-headline-md text-on-surface mb-4">Built on Psychological Safety</h2>
            <p className="text-on-surface-variant">
              We don&apos;t pick sides. This process helps turn emotional friction into productive dialogue.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {[
              { icon: 'encrypted', label: 'Encrypted & Protected' },
              { icon: 'balance', label: 'Balanced by Design' },
              { icon: 'visibility_off', label: 'No Cross-Access' },
              { icon: 'volunteer_activism', label: 'Non-Adversarial' },
            ].map((item) => (
              <div key={item.label} className="bg-surface p-4 rounded-xl border border-outline-variant text-center">
                <span className="material-symbols-outlined text-secondary mb-2">{item.icon}</span>
                <p className="font-label-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section className="px-margin-mobile py-stack-lg max-w-2xl mx-auto">
          <h2 className="font-headline-md text-on-surface mb-stack-md text-center">When to use Urushi Labs</h2>
          <div className="flex flex-col gap-4">
            {[
              {
                tag: 'Couples',
                tagBg: 'bg-primary-container/20 text-on-primary-container',
                quote: '"We\'re stuck in the same argument about our future. We need a way to talk that doesn\'t end in shouting."',
                linkColor: 'text-primary',
              },
              {
                tag: 'Co-workers',
                tagBg: 'bg-secondary-container/30 text-on-secondary-container',
                quote: '"We disagree on the project direction and it\'s stalling progress. We need a neutral view to realign."',
                linkColor: 'text-secondary',
              },
              {
                tag: 'Family',
                tagBg: 'bg-tertiary-container/30 text-on-tertiary-container',
                quote: '"A shared decision is causing tension. We want to preserve relationships while deciding together."',
                linkColor: 'text-tertiary',
              },
            ].map((item) => (
              <div key={item.tag} className="bg-white p-6 rounded-3xl soft-shadow">
                <div className="flex justify-between items-center mb-4">
                  <span className={`${item.tagBg} px-3 py-1 rounded-full font-label-sm`}>{item.tag}</span>
                </div>
                <p className="font-body-md text-on-surface">{item.quote}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-on-primary px-margin-mobile py-stack-lg mx-margin-mobile rounded-[2rem] mb-stack-lg text-center overflow-hidden relative max-w-2xl md:mx-auto">
          <div className="relative z-10">
            <h2 className="font-headline-lg text-white mb-4">Ready to find clarity?</h2>
            <p className="text-white/80 mb-8 max-w-xs mx-auto">
              Start your private session today. It takes less than 10 minutes to begin.
            </p>
            <Link
              href="/start"
              className="w-full block bg-white text-primary px-8 py-4 rounded-xl font-headline-md active:bg-surface-variant transition-colors"
            >
              Start Now
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
