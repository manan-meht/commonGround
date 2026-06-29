'use client'

import Link from 'next/link'
import type { DbTogetherSession, TogetherFinalReport } from '@/lib/db/types'

interface Props {
  session: DbTogetherSession
  caseReference: string
}

const SAFETY_RESOURCES = [
  'possible_coercion_or_abuse',
  'possible_self_harm_or_violence',
  'possible_child_safety_issue',
  'legal_or_professional_support_needed',
]

export function FinalReportView({ session }: Props) {
  const report = session.final_report as TogetherFinalReport | null

  if (!report) {
    return (
      <main className="flex-grow flex items-center justify-center flex-col gap-4 px-margin-mobile py-stack-lg">
        <span className="material-symbols-outlined text-error text-[48px]">error</span>
        <p className="font-body-md text-on-surface-variant text-center">Final report not available yet.</p>
      </main>
    )
  }

  const needsSafetyNote = SAFETY_RESOURCES.includes(report.safetyCategory)

  return (
    <main className="flex-grow w-full max-w-2xl mx-auto px-margin-mobile pt-stack-md pb-stack-lg space-y-8">

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
        </div>
        <h1 className="font-headline-md text-on-surface mb-2">Your Agreement</h1>
        <p className="font-body-md text-on-surface-variant">
          {session.person_a_name} and {session.person_b_name} — {session.topic}
        </p>
      </div>

      {/* Safety note */}
      {needsSafetyNote && report.safetyNote && (
        <div className="bg-error-container/20 border border-error-container rounded-xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-error shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div>
            <p className="font-label-md text-on-surface font-semibold mb-1">Important note</p>
            <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">{report.safetyNote}</p>
            <a href="/safety" className="text-label-sm text-secondary underline mt-1 inline-block">Safety resources →</a>
          </div>
        </div>
      )}

      {/* Shared understanding */}
      {report.sharedUnderstanding && (
        <section>
          <h2 className="font-label-sm text-outline uppercase tracking-widest mb-3">Shared understanding</h2>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <p className="font-body-md text-on-surface leading-relaxed">{report.sharedUnderstanding}</p>
          </div>
        </section>
      )}

      {/* Agreed */}
      {report.agreed.length > 0 && (
        <section aria-label="Agreed">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <h2 className="font-label-sm text-outline uppercase tracking-widest">Agreed</h2>
          </div>
          <div className="space-y-4">
            {report.agreed.map((item, i) => (
              <div key={i} className="bg-primary-container/10 rounded-xl border border-primary/20 p-5 space-y-3">
                <p className="font-label-md text-on-surface font-semibold">{item.title}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">{session.person_a_name} will</p>
                    <p className="font-body-md text-on-surface">{item.personAAction}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">{session.person_b_name} will</p>
                    <p className="font-body-md text-on-surface">{item.personBAction}</p>
                  </div>
                </div>
                {item.sharedAction && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">Together</p>
                    <p className="font-body-md text-on-surface text-sm">{item.sharedAction}</p>
                  </div>
                )}
                {(item.dueDate || item.reviewDate) && (
                  <div className="flex gap-4 text-label-sm text-on-surface-variant text-[12px]">
                    {item.dueDate && <span>By: {item.dueDate}</span>}
                    {item.reviewDate && <span>Review: {item.reviewDate}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Partially agreed */}
      {report.partiallyAgreed.length > 0 && (
        <section aria-label="Partially agreed">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>radio_button_partial</span>
            <h2 className="font-label-sm text-outline uppercase tracking-widest">Partially agreed</h2>
          </div>
          <div className="space-y-3">
            {report.partiallyAgreed.map((item, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 space-y-2">
                <p className="font-label-md text-on-surface font-semibold">{item.title}</p>
                <div>
                  <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">Agreed</p>
                  <p className="font-body-md text-on-surface-variant text-sm">{item.agreedParts}</p>
                </div>
                <div>
                  <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">Still unsettled</p>
                  <p className="font-body-md text-on-surface-variant text-sm">{item.unsettled}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Not resolved */}
      {report.notResolved.length > 0 && (
        <section aria-label="Not resolved">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-outline text-[18px]">pending</span>
            <h2 className="font-label-sm text-outline uppercase tracking-widest">Not yet resolved</h2>
          </div>
          <div className="space-y-3">
            {report.notResolved.map((item, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 space-y-3">
                <p className="font-label-md text-on-surface font-semibold">{item.title}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">{session.person_a_name}&apos;s position</p>
                    <p className="font-body-md text-on-surface-variant">{item.personAPosition}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">{session.person_b_name}&apos;s position</p>
                    <p className="font-body-md text-on-surface-variant">{item.personBPosition}</p>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">Suggested next step</p>
                  <p className="font-body-md text-on-surface-variant text-sm">{item.suggestedNextStep}</p>
                </div>
                {item.revisitLater && (
                  <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Both agreed to revisit this later.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer actions */}
      <div className="border-t border-outline-variant/30 pt-6 space-y-3">
        <Link
          href="/dashboard"
          className="block w-full text-center py-4 bg-primary text-on-primary rounded-xl font-bold font-label-md transition-all active:scale-95 shadow-sm"
        >
          Go to my conversations
        </Link>
        <p className="text-center text-label-sm text-outline">
          This report is saved to your account. You can return to it at any time from your dashboard.
        </p>
      </div>
    </main>
  )
}
