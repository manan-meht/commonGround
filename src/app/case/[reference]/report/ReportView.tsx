'use client'

import Link from 'next/link'
import type { SharedReport, DbAgreement } from '@/lib/db/types'
import { SafetyScreen } from './SafetyScreen'

interface Props {
  report: SharedReport
  agreements: DbAgreement[]
  caseId: string
  caseReference: string
  role: 'initiator' | 'recipient'
  topic: string
  initiatorName: string
  recipientName: string
  generatedAt: string
  isAdminView?: boolean
}

// OpenAI sometimes returns strings instead of arrays or objects — normalise defensively
function toArray<T>(val: T | T[] | string | undefined | null): T[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') return [val as unknown as T]
  return [val]
}

function toStringArray(val: string | string[] | undefined | null): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  return [val]
}

const SAFETY_SENSITIVE = [
  'possible_coercion_or_abuse',
  'possible_self_harm_or_violence',
  'possible_child_safety_issue',
  'legal_or_professional_support_needed',
]

export function ReportView({
  report,
  agreements,
  caseId: _caseId,
  caseReference,
  role,
  topic,
  initiatorName,
  recipientName,
  isAdminView = false,
}: Props) {
  if (SAFETY_SENSITIVE.includes(report.safetyCategory)) {
    return <SafetyScreen report={report} />
  }

  const yourPerspective = role === 'initiator' ? report.initiatorPerspective : report.recipientPerspective
  const theirPerspective = role === 'initiator' ? report.recipientPerspective : report.initiatorPerspective
  const theirName = role === 'initiator' ? recipientName : initiatorName

  return (
    <>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-32">
        {/* Header */}
        <section className="py-stack-lg">
          <div className="flex flex-col items-center text-center gap-stack-sm">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm uppercase tracking-widest">
              Shared Resolution Report
            </span>
            <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface">
              {report.reportTitle}
            </h2>
            <p className="text-on-surface-variant max-w-xl font-body-lg text-body-lg">{topic}</p>
          </div>
        </section>

        {/* Safety category badge */}
        {report.safetyCategory === 'high_conflict' && (
          <div className="bg-error-container/20 border border-error/20 p-4 rounded-xl mb-stack-md flex gap-3">
            <span className="material-symbols-outlined text-error shrink-0">warning</span>
            <p className="font-body-md text-on-surface">
              This report identified <strong>high-conflict patterns</strong>. Please review the safety note at the bottom of this report before taking action.
            </p>
          </div>
        )}

        {/* Neutral overview */}
        <Section icon="info" title="Neutral Overview" primary>
          <p className="text-on-surface-variant leading-relaxed font-body-md">{report.neutralOverview}</p>
        </Section>

        {/* Perspectives */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-md mb-stack-lg">
          <PerspectiveCard
            name="Your perspective"
            perspective={yourPerspective}
            color="primary"
          />
          <PerspectiveCard
            name={`${theirName}'s perspective`}
            perspective={theirPerspective}
            color="secondary"
          />
        </section>

        {/* Agreed facts */}
        {report.agreedFacts.length > 0 && (
          <Section icon="handshake" title="Agreed Facts" iconFill>
            <ul className="space-y-3">
              {report.agreedFacts.map((fact, i) => (
                <li key={i} className="flex items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-primary/10">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <p className="font-body-md">{fact}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Disputed interpretations */}
        {toArray(report.disputedInterpretations).length > 0 && (
          <Section icon="error" title="Disputed Interpretations" iconFill>
            <div className="bg-error-container/20 border border-error/10 p-6 rounded-xl space-y-4">
              {toArray(report.disputedInterpretations).map((d, i) => (
                <div key={i} className="border-b border-error/10 last:border-0 pb-4 last:pb-0">
                  {typeof d === 'string' ? (
                    <p className="font-body-md text-on-surface-variant">{d}</p>
                  ) : (
                    <>
                      <p className="font-label-md text-on-surface font-bold mb-2">{d.event}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="font-label-sm text-primary uppercase mb-1">Your view</p>
                          <p className="font-body-md text-on-surface-variant">{d.initiatorView}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="font-label-sm text-secondary uppercase mb-1">{theirName}&apos;s view</p>
                          <p className="font-body-md text-on-surface-variant">{d.recipientView}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Points of agreement */}
        {toStringArray(report.pointsOfAgreement).length > 0 && (
          <Section icon="join_inner" title="Points of Agreement">
            <ul className="space-y-2">
              {toStringArray(report.pointsOfAgreement).map((p, i) => (
                <li key={i} className="flex gap-3 p-3 bg-primary-container/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                  <p className="font-body-md">{p}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Shared goals */}
        {toStringArray(report.sharedGoals).length > 0 && (
          <Section icon="track_changes" title="Shared Goals">
            <ul className="space-y-2">
              {toStringArray(report.sharedGoals).map((g, i) => (
                <li key={i} className="font-body-md text-on-surface-variant border-l-2 border-secondary pl-4 py-1">{g}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Intention vs impact */}
        {toArray(report.intentionVsImpact).length > 0 && (
          <Section icon="compare_arrows" title="Intention vs Impact">
            <div className="space-y-4">
              {toArray(report.intentionVsImpact).map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
                  {typeof item === 'string' ? (
                    <p className="font-body-md text-on-surface-variant">{item}</p>
                  ) : (
                    <>
                      <p className="font-label-sm text-outline uppercase mb-2">{item.actor === role ? 'Your action' : `${theirName}'s action`}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-label-md text-primary font-bold mb-1">Intended</p>
                          <p className="font-body-md text-on-surface-variant">{item.intendedMessage}</p>
                        </div>
                        <div>
                          <p className="font-label-md text-error font-bold mb-1">Perceived impact</p>
                          <p className="font-body-md text-on-surface-variant">{item.perceivedImpact}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* What each person needs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-md mb-stack-lg">
          <NeedsCard title="What you need acknowledged" needs={toStringArray(report.initiatorNeeds)} color="primary" />
          <NeedsCard title={`What ${theirName} needs acknowledged`} needs={toStringArray(report.recipientNeeds)} color="secondary" />
        </section>

        {/* Accountability */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-md mb-stack-lg">
          <AccountabilityCard title="Your possible actions" items={toStringArray(report.initiatorAccountability)} />
          <AccountabilityCard title={`${theirName}'s possible actions`} items={toStringArray(report.recipientAccountability)} />
        </section>

        {/* Next steps */}
        <Section icon="fact_check" title="Recommended Next Steps" iconFill>
          <div className="space-y-3">
            {toArray(report.recommendedNextSteps).map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                {typeof step === 'string' ? (
                  <p className="font-body-md text-on-surface">{step}</p>
                ) : (
                  <>
                    <span className={`material-symbols-outlined text-sm mt-0.5 ${step.owner === 'initiator' ? 'text-primary' : step.owner === 'recipient' ? 'text-secondary' : 'text-tertiary'}`}>
                      {step.owner === 'both' ? 'group' : 'person'}
                    </span>
                    <div>
                      <p className="font-body-md text-on-surface">{step.action}</p>
                      {step.timeframe && <p className="text-label-sm text-outline mt-1">{step.timeframe}</p>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Opening script */}
        <section className="mb-stack-lg bg-primary-container/10 p-6 rounded-xl border-2 border-dashed border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary">record_voice_over</span>
            <h3 className="font-headline-md text-on-surface">Suggested Opening Script</h3>
          </div>
          <p className="font-body-md text-on-surface-variant italic">{report.suggestedOpeningScript}</p>
        </section>

        {/* Possible agreements */}
        {agreements.length > 0 && (
          <Section icon="assignment_turned_in" title="Proposed Agreements">
            <div className="space-y-3">
              {agreements.map((a) => {
                const myResponse = role === 'initiator' ? a.initiator_response : a.recipient_response
                return (
                  <div key={a.id} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-outline-variant">
                    <div className="flex-grow">
                      <p className="font-body-md text-on-surface">{a.agreement_text}</p>
                      {myResponse && (
                        <p className="text-label-sm text-outline mt-1 capitalize">Your response: {myResponse}</p>
                      )}
                    </div>
                    {/* Respond button hidden until feature is ready */}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Limitations */}
        <div className="bg-surface-container-low border border-outline-variant p-6 rounded-xl mb-stack-lg">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-outline shrink-0">info</span>
            <div>
              <h3 className="font-label-md font-bold mb-1">Report Limitations</h3>
              <p className="font-body-md text-on-surface-variant">{report.reportLimitations}</p>
            </div>
          </div>
        </div>

        {report.professionalSupportSuggestion && (
          <div className="bg-error-container/20 border border-error/20 p-6 rounded-xl mb-stack-lg">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-error shrink-0">support_agent</span>
              <div>
                <h3 className="font-label-md font-bold text-on-error-container mb-1">Professional Support Suggested</h3>
                <p className="font-body-md text-on-error-container/80">{report.professionalSupportSuggestion}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] border-t border-outline-variant/30">
        <div className="max-w-container-max mx-auto flex gap-4 md:justify-center">
          <Link
            href={`/case/${caseReference}/feedback`}
            className="flex-1 md:flex-none md:min-w-[180px] bg-white border border-secondary text-secondary py-3 px-6 rounded-lg font-label-md flex items-center justify-center gap-2 hover:bg-secondary-container transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">rate_review</span>
            Feedback
          </Link>
          {/* Respond to agreements button hidden until feature is ready */}
        </div>
      </div>
    </>
  )
}

function Section({
  icon,
  title,
  children,
  primary,
  iconFill,
}: {
  icon: string
  title: string
  children: React.ReactNode
  primary?: boolean
  iconFill?: boolean
}) {
  return (
    <section className={`${primary ? 'bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/30' : ''} mb-stack-lg`}>
      <h3 className={`font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2 ${primary ? '' : ''}`}>
        <span
          className="material-symbols-outlined text-primary"
          style={iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

function PerspectiveCard({
  name,
  perspective,
  color,
}: {
  name: string
  perspective: SharedReport['initiatorPerspective']
  color: 'primary' | 'secondary'
}) {
  const borderColor = color === 'primary' ? 'border-primary/40' : 'border-secondary/40'
  const labelColor = color === 'primary' ? 'text-primary' : 'text-secondary'

  // OpenAI may return a plain string instead of a structured object
  // Normalise — OpenAI uses inconsistent field names
  const p = typeof perspective === 'string' ? { feelings: perspective } : perspective as unknown as Record<string, unknown>
  const paraphrase = (p.paraphrase || p.feelings || p.summary || '') as string
  const feelings = toStringArray((p.coreFeelings ?? p.feelings_list ?? []) as string | string[])
  const coreNeed = (p.coreNeed || p.need || '') as string
  const interpretation = (p.interpretation || p.view || '') as string
  const contribution = (p.acknowledgedContribution || p.contribution || '') as string

  return (
    <div className={`relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderColor}`}>
      <div className={`flex items-center gap-2 mb-3 ${labelColor}`}>
        <span className="material-symbols-outlined">person</span>
        <span className="font-label-sm uppercase tracking-wider">{name}</span>
      </div>
      {paraphrase && <p className="italic text-on-surface-variant font-body-md mb-3">{paraphrase}</p>}
      {feelings.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {feelings.map((f, i) => (
            <span key={i} className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm">{f}</span>
          ))}
        </div>
      )}
      {interpretation && (
        <p className="font-body-md text-on-surface-variant mb-2"><span className={`font-medium ${labelColor}`}>Interpretation: </span>{interpretation}</p>
      )}
      {contribution && (
        <p className="font-body-md text-on-surface-variant mb-2"><span className="font-medium text-outline">Acknowledged: </span>{contribution}</p>
      )}
      {coreNeed && (
        <div className="mt-4 pt-4 border-t border-outline-variant/20">
          <p className={`text-sm font-medium ${labelColor}`}>Core Need: {coreNeed}</p>
        </div>
      )}
    </div>
  )
}

function NeedsCard({ title, needs, color }: { title: string; needs: string[]; color: 'primary' | 'secondary' }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className={`font-label-md font-bold mb-3 ${color === 'primary' ? 'text-primary' : 'text-secondary'}`}>{title}</h3>
      <ul className="space-y-2">
        {needs.map((n, i) => (
          <li key={i} className="flex gap-2 font-body-md text-on-surface-variant">
            <span className="text-secondary mt-0.5">•</span>
            {n}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AccountabilityCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-surface-container-low p-6 rounded-xl">
      <h3 className="font-label-md font-bold mb-3 text-on-surface">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 font-body-md text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-sm mt-0.5">arrow_forward</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
