'use client'

import Link from 'next/link'
import type { SharedReport } from '@/lib/db/types'

const CATEGORY_MESSAGES: Record<string, { title: string; body: string }> = {
  possible_coercion_or_abuse: {
    title: 'Your safety comes first',
    body: 'This report identified patterns that may indicate a power imbalance, coercion, or controlling behaviour. In situations like this, a "meet in the middle" approach may not be appropriate or safe. We strongly recommend speaking with a qualified professional — a counsellor, social worker, or domestic abuse support service — before taking any action.',
  },
  possible_self_harm_or_violence: {
    title: 'We are concerned about your safety',
    body: 'This report identified content that may indicate risk of self-harm or physical violence. Please reach out to a crisis support service or emergency services if you or someone else is in immediate danger. Common Ground cannot assess immediate risk or provide crisis support.',
  },
  possible_child_safety_issue: {
    title: 'Child safety concern identified',
    body: 'This report identified content that may indicate a risk to a child. Please contact the appropriate child protection services or law enforcement in your area without delay. This is beyond what an AI tool can appropriately address.',
  },
  legal_or_professional_support_needed: {
    title: 'Professional support recommended',
    body: "The situation you've described involves legal, financial, or specialist considerations that go beyond what this tool can address. We recommend consulting a qualified professional — a lawyer, financial adviser, or licensed mediator — before proceeding.",
  },
}

export function SafetyScreen({ report }: { report: SharedReport }) {
  const FALLBACK = {
    title: 'Professional support recommended',
    body: "The situation you've described involves considerations that go beyond what this tool can address.",
  }
  const msg =
    CATEGORY_MESSAGES[report.safetyCategory] ??
    CATEGORY_MESSAGES['legal_or_professional_support_needed'] ??
    FALLBACK

  return (
    <main className="flex-grow max-w-2xl mx-auto px-margin-mobile py-stack-lg flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center mb-stack-md">
        <span
          className="material-symbols-outlined text-error text-[48px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          safety_check
        </span>
      </div>

      <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-4">
        {msg.title}
      </h1>

      <p className="font-body-lg text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
        {msg.body}
      </p>

      <div className="bg-error-container/20 border border-error/20 rounded-xl p-6 mb-8 text-left w-full max-w-md">
        <h2 className="font-label-md font-bold text-on-error-container mb-2">What you can do now</h2>
        <ul className="space-y-2 font-body-md text-on-error-container/80">
          <li>• Contact emergency services if there is immediate danger</li>
          <li>• Speak with a local support organisation (search &ldquo;domestic violence helpline&rdquo; or &ldquo;crisis support&rdquo; in your area)</li>
          <li>• Consult a qualified professional before any direct confrontation</li>
        </ul>
      </div>

      <p className="text-label-sm text-on-surface-variant mb-6 max-w-md">
        {report.safetyExplanation}
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/safety"
          className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md font-bold text-center"
        >
          View safety resources
        </Link>
        <Link
          href="/"
          className="w-full text-on-surface-variant py-3 font-label-md text-center hover:text-on-surface transition-colors"
        >
          Return to home
        </Link>
      </div>

      <p className="text-label-sm text-on-surface-variant mt-8 max-w-md opacity-70">
        Common Ground is an AI communication tool. It cannot verify facts, assess danger, or replace
        qualified professional support.
      </p>
    </main>
  )
}
