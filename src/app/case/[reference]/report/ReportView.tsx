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

const SAFETY_SENSITIVE = [
  'possible_coercion_or_abuse',
  'possible_self_harm_or_violence',
  'possible_child_safety_issue',
  'legal_or_professional_support_needed',
]

const ASSESSMENT_LABEL: Record<string, string> = {
  not_acceptable: 'Not acceptable',
  needs_change: 'Needs to change',
  reasonable: 'Reasonable',
  cannot_determine: 'Cannot determine',
}

const ASSESSMENT_COLOR: Record<string, string> = {
  not_acceptable: 'text-error',
  needs_change: 'text-warning',
  reasonable: 'text-primary',
  cannot_determine: 'text-outline',
}

export function ReportView({
  report,
  agreements,
  caseId: _caseId,
  caseReference,
  role,
  topic,
  initiatorName,
  recipientName,
  isAdminView: _isAdminView = false,
}: Props) {
  if (SAFETY_SENSITIVE.includes(report.safetyCategory)) {
    return <SafetyScreen report={report} />
  }

  const yourName = role === 'initiator' ? initiatorName : recipientName
  const theirName = role === 'initiator' ? recipientName : initiatorName
  const yourRecognition = role === 'initiator' ? report.initiatorRecognition : report.recipientRecognition
  const theirRecognition = role === 'initiator' ? report.recipientRecognition : report.initiatorRecognition

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

        {report.safetyCategory === 'high_conflict' && (
          <div className="bg-error-container/20 border border-error/20 p-4 rounded-xl mb-stack-md flex gap-3">
            <span className="material-symbols-outlined text-error shrink-0">warning</span>
            <p className="font-body-md text-on-surface">
              This report identified <strong>high-conflict patterns</strong>. Please review the safety note at the bottom before taking action.
            </p>
          </div>
        )}

        {/* Bottom line */}
        <Section icon="info" title="Summary" primary>
          <p className="text-on-surface-variant leading-relaxed font-body-md">{report.bottomLine}</p>
        </Section>

        {/* Shared goals */}
        {report.sharedGoals.length > 0 && (
          <Section icon="track_changes" title="Shared Goals">
            <ul className="space-y-2">
              {report.sharedGoals.map((g, i) => (
                <li key={i} className="font-body-md text-on-surface-variant border-l-2 border-secondary pl-4 py-1">{g}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Perspective recognition */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-md mb-stack-lg">
          <RecognitionCard name="Your perspective" recognition={yourRecognition} color="primary" yourName={yourName} />
          <RecognitionCard name={`${theirName}'s perspective`} recognition={theirRecognition} color="secondary" yourName={theirName} />
        </section>

        {/* Behavioural assessments */}
        {report.behaviouralAssessments.length > 0 && (
          <Section icon="gavel" title="Behavioural Assessments" iconFill>
            <div className="space-y-4">
              {report.behaviouralAssessments.map((b, i) => {
                const ownerLabel = b.owner === 'both' ? 'Both' : b.owner === role ? 'You' : theirName
                return (
                  <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="font-label-sm text-outline uppercase">{ownerLabel}</span>
                      <span className={`font-label-sm font-bold uppercase ${ASSESSMENT_COLOR[b.assessment] ?? 'text-outline'}`}>
                        {ASSESSMENT_LABEL[b.assessment]}
                      </span>
                    </div>
                    <p className="font-body-md font-medium text-on-surface mb-1">{b.behaviour}</p>
                    <p className="font-body-md text-on-surface-variant mb-2">{b.directFinding}</p>
                    {b.impact && <p className="text-label-sm text-outline">Impact: {b.impact}</p>}
                    {b.requiredChange && <p className="text-label-sm text-primary mt-1">Required change: {b.requiredChange}</p>}
                    {b.requiredRepair && <p className="text-label-sm text-secondary mt-1">Required repair: {b.requiredRepair}</p>}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Disputed points */}
        {report.disputedOrUnknownPoints.length > 0 && (
          <Section icon="error" title="Disputed or Unknown Points" iconFill>
            <div className="bg-error-container/20 border border-error/10 p-6 rounded-xl space-y-4">
              {report.disputedOrUnknownPoints.map((d, i) => (
                <div key={i} className="border-b border-error/10 last:border-0 pb-4 last:pb-0">
                  <p className="font-label-md text-on-surface font-bold mb-2">{d.issue}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="font-label-sm text-primary uppercase mb-1">Your view</p>
                      <p className="font-body-md text-on-surface-variant">{d.initiatorView}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="font-label-sm text-secondary uppercase mb-1">{theirName}&apos;s view</p>
                      <p className="font-body-md text-on-surface-variant">{d.recipientView}</p>
                    </div>
                  </div>
                  <p className="font-body-md text-on-surface-variant italic">{d.fairConclusion}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Escalation cycle */}
        {report.escalationCycle.length > 0 && (
          <Section icon="compare_arrows" title="Escalation Cycle">
            <div className="space-y-3">
              {report.escalationCycle.map((step, i) => {
                const actorLabel = step.actor === 'both' ? 'Both' : step.actor === 'context' ? 'Context' : step.actor === role ? 'You' : theirName
                return (
                  <div key={i} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex-none w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm font-bold">
                      {step.step}
                    </div>
                    <div>
                      <p className="font-label-sm text-outline uppercase mb-1">{actorLabel}</p>
                      <p className="font-body-md text-on-surface">{step.triggerOrInterpretation}</p>
                      <p className="font-body-md text-on-surface-variant">→ {step.response}</p>
                      {step.impactOnCycle && <p className="text-label-sm text-outline mt-1">{step.impactOnCycle}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Repairs required */}
        {report.repairsRequired.length > 0 && (
          <Section icon="healing" title="Repairs Required" iconFill>
            <div className="space-y-4">
              {report.repairsRequired.map((r, i) => {
                const ownerLabel = r.owner === 'both' ? 'Both' : r.owner === role ? 'You' : theirName
                return (
                  <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-outline uppercase">{ownerLabel} → {r.owedTo}</span>
                      <span className="font-label-sm text-outline">{r.timeframe}</span>
                    </div>
                    <p className="font-body-md text-on-surface mb-2">{r.acknowledgementNeeded}</p>
                    <p className="font-body-md text-on-surface-variant">{r.actionNeeded}</p>
                    {r.mustNotRequire && (
                      <p className="text-label-sm text-outline mt-2">Must not demand: {r.mustNotRequire}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Action plan */}
        {report.actionPlan.length > 0 && (
          <Section icon="fact_check" title="Action Plan" iconFill>
            <div className="space-y-3">
              {report.actionPlan.map((step, i) => {
                const ownerLabel = step.owner === 'both' ? 'Both' : step.owner === role ? 'You' : theirName
                return (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <span className={`material-symbols-outlined text-sm mt-0.5 ${step.owner === role ? 'text-primary' : step.owner === 'both' ? 'text-tertiary' : 'text-secondary'}`}>
                      {step.owner === 'both' ? 'group' : 'person'}
                    </span>
                    <div>
                      <p className="font-label-sm text-outline uppercase mb-1">{ownerLabel}</p>
                      <p className="font-body-md text-on-surface">{step.action}</p>
                      <p className="text-label-sm text-outline mt-1">{step.timeframe}</p>
                      {step.successMeasure && <p className="text-label-sm text-primary mt-1">Success: {step.successMeasure}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Suggested words */}
        {report.suggestedWords.length > 0 && (
          <Section icon="record_voice_over" title="Suggested Words">
            <div className="space-y-4">
              {report.suggestedWords.map((sw, i) => {
                const speakerLabel = sw.speaker === role ? 'You' : theirName
                return (
                  <div key={i} className="bg-primary-container/10 p-5 rounded-xl border-2 border-dashed border-primary/20">
                    <p className="font-label-sm text-outline uppercase mb-1">{speakerLabel} — {sw.purpose}</p>
                    <p className="font-body-md text-on-surface-variant italic">{sw.script}</p>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Working agreements */}
        {report.workingAgreements.length > 0 && (
          <Section icon="handshake" title="Working Agreements" iconFill>
            <div className="space-y-3">
              {report.workingAgreements.map((wa, i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant">
                  <p className="font-body-md font-medium text-on-surface mb-2">{wa.agreement}</p>
                  <p className="text-label-sm text-outline">How: {wa.implementation}</p>
                  <p className="text-label-sm text-outline mt-1">If breached: {wa.breachResponse}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* DB agreements (responses) */}
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
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Review point */}
        <Section icon="event_repeat" title="Review Point">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant">
            <p className="font-label-md font-bold text-on-surface mb-2">{report.reviewPoint.timeframe}</p>
            {report.reviewPoint.measuresOfProgress.length > 0 && (
              <ul className="space-y-1 mb-3">
                {report.reviewPoint.measuresOfProgress.map((m, i) => (
                  <li key={i} className="flex gap-2 font-body-md text-on-surface-variant">
                    <span className="text-primary">•</span>{m}
                  </li>
                ))}
              </ul>
            )}
            {report.reviewPoint.ifNoImprovement.length > 0 && (
              <>
                <p className="font-label-sm text-outline uppercase mb-1">If no improvement</p>
                <ul className="space-y-1">
                  {report.reviewPoint.ifNoImprovement.map((m, i) => (
                    <li key={i} className="flex gap-2 font-body-md text-on-surface-variant">
                      <span className="text-secondary">•</span>{m}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Section>

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
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
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

function RecognitionCard({
  name,
  recognition,
  color,
  yourName: _yourName,
}: {
  name: string
  recognition: SharedReport['initiatorRecognition']
  color: 'primary' | 'secondary'
  yourName: string
}) {
  const borderColor = color === 'primary' ? 'border-primary/40' : 'border-secondary/40'
  const labelColor = color === 'primary' ? 'text-primary' : 'text-secondary'

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderColor}`}>
      <div className={`flex items-center gap-2 mb-3 ${labelColor}`}>
        <span className="material-symbols-outlined">person</span>
        <span className="font-label-sm uppercase tracking-wider">{name}</span>
      </div>
      {recognition.validConcerns.length > 0 && (
        <div className="mb-3">
          <p className={`font-label-sm uppercase mb-1 ${labelColor}`}>Valid concerns</p>
          <ul className="space-y-1">
            {recognition.validConcerns.map((c, i) => (
              <li key={i} className="font-body-md text-on-surface-variant">• {c}</li>
            ))}
          </ul>
        </div>
      )}
      {recognition.coreNeeds.length > 0 && (
        <div className="mb-3">
          <p className={`font-label-sm uppercase mb-1 ${labelColor}`}>Core needs</p>
          <ul className="space-y-1">
            {recognition.coreNeeds.map((n, i) => (
              <li key={i} className="font-body-md text-on-surface-variant">• {n}</li>
            ))}
          </ul>
        </div>
      )}
      {recognition.acknowledgementAlreadyOffered.length > 0 && (
        <div className="mt-3 pt-3 border-t border-outline-variant/20">
          <p className="font-label-sm text-outline uppercase mb-1">Already offered</p>
          {recognition.acknowledgementAlreadyOffered.map((a, i) => (
            <p key={i} className="font-body-md text-on-surface-variant">• {a}</p>
          ))}
        </div>
      )}
    </div>
  )
}
