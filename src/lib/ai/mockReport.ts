import type { ValidatedSharedReport } from './mediationPrompt'

export const MOCK_REPORT: ValidatedSharedReport = {
  reportTitle: 'Urushi Labs: A Shared Resolution Report',
  bottomLine:
    'Both participants describe a situation where differing expectations about communication and decision-making created growing frustration. Both share a genuine desire for a better relationship and a fair resolution.',
  sharedGoals: [
    'A respectful, functional relationship.',
    'Clearer expectations on both sides.',
    'A resolution that does not leave either person feeling resentful.',
  ],
  initiatorRecognition: {
    validConcerns: [
      'Their concern about being excluded from key decisions is understandable.',
      'The impact of feeling unheard was real and significant.',
    ],
    importantContext: [
      'They raised concerns through available channels before escalation.',
    ],
    coreNeeds: [
      'To feel heard and respected.',
      'To be included in relevant decisions.',
    ],
    acknowledgementAlreadyOffered: [],
  },
  recipientRecognition: {
    validConcerns: [
      'They were operating under pressure and may not have been aware of the impact.',
    ],
    importantContext: [
      'They believed the matter had been resolved or was being considered.',
    ],
    coreNeeds: [
      'Clarity about expectations.',
      'A chance to address things without feeling prejudged.',
    ],
    acknowledgementAlreadyOffered: [],
  },
  behaviouralAssessments: [
    {
      owner: 'recipient',
      behaviour: 'Making decisions without consulting the other participant.',
      evidenceStatus: 'reported_by_one',
      assessment: 'needs_change',
      directFinding: 'Making decisions unilaterally on matters that affect both people needs to change.',
      impact: 'The initiator experienced this as their input being disregarded.',
      requiredChange: 'Consult before finalising decisions that affect both parties.',
      requiredRepair: 'Acknowledge the impact even if the intent was not harmful.',
    },
  ],
  disputedOrUnknownPoints: [
    {
      issue: 'What was communicated during the triggering incident.',
      initiatorView: 'Their concerns were dismissed or minimised.',
      recipientView: 'They were responding reasonably given what they knew at the time.',
      evidenceStatus: 'disputed',
      fairConclusion:
        'The report cannot determine whose account of the conversation is accurate. Each participant should describe their own experience rather than insist the other adopt their interpretation.',
    },
  ],
  escalationCycle: [
    {
      step: 1,
      actor: 'initiator',
      triggerOrInterpretation: 'Feels their concerns are not being heard.',
      response: 'Raises concerns more urgently.',
      impactOnCycle: 'The other participant experiences this as pressure.',
    },
    {
      step: 2,
      actor: 'recipient',
      triggerOrInterpretation: 'Feels overwhelmed by the intensity.',
      response: 'Withdraws or delays responding.',
      impactOnCycle: 'The withdrawal increases the initiator\'s sense of being dismissed.',
    },
  ],
  repairsRequired: [
    {
      owner: 'recipient',
      owedTo: 'initiator',
      reason: 'The impact of being excluded from decisions was real, regardless of intent.',
      acknowledgementNeeded: 'Acknowledge specifically that their input was not sought when it should have been.',
      actionNeeded: 'Commit to a clear process for shared decision-making going forward.',
      mustNotRequire: 'An admission from the initiator that they overreacted.',
      timeframe: 'During the next direct conversation.',
    },
  ],
  actionPlan: [
    {
      priority: 1,
      owner: 'both',
      action: 'Schedule a private conversation with no other agenda to read this report together.',
      timeframe: 'Within one week.',
      successMeasure: 'Both participants confirm they have read and discussed each section.',
    },
    {
      priority: 2,
      owner: 'both',
      action: 'Agree on two or three specific communication practices for the future.',
      timeframe: 'By the end of the scheduled conversation.',
      successMeasure: 'Written practices agreed and saved.',
    },
  ],
  suggestedWords: [
    {
      speaker: 'recipient',
      purpose: 'Opening the repair conversation.',
      script:
        '"I want to start by saying I am here because I genuinely want this to be better. I understand now that what I did had an impact I did not intend, and I am sorry for that impact."',
    },
    {
      speaker: 'initiator',
      purpose: 'Acknowledging the other person\'s willingness.',
      script:
        '"I appreciate you being willing to have this conversation. What I need most is to know that this will be different going forward."',
    },
  ],
  workingAgreements: [
    {
      agreement: 'A brief weekly check-in for the next month to catch tension before it escalates.',
      appliesTo: 'both',
      implementation: 'Set a recurring 15-minute slot each week.',
      breachResponse: 'If a check-in is missed, reschedule within 48 hours.',
    },
    {
      agreement: 'An agreed protocol for raising concerns — direct message first, then a meeting if needed.',
      appliesTo: 'both',
      implementation: 'Both confirm understanding of the protocol in writing.',
      breachResponse: 'Raise the breach at the next check-in rather than letting it escalate.',
    },
  ],
  reviewPoint: {
    timeframe: 'Four weeks from now.',
    measuresOfProgress: [
      'Both participants feel the communication protocol is being followed.',
      'No new escalations have occurred.',
    ],
    ifNoImprovement: [
      'Consider working with a qualified human mediator.',
      'Reassess whether the relationship structure needs to change.',
    ],
  },
  professionalSupportSuggestion: null,
  safetyCategory: 'ordinary_conflict',
  safetyExplanation:
    'Based on both accounts, this situation reflects a common interpersonal conflict involving communication breakdown and unmet expectations. No indicators of safety concerns, coercion, or imminent risk were identified.',
  reportLimitations:
    "This report is based solely on each participant's private self-reported perspective. The AI has not verified any facts, assessed anyone's character, or assigned blame. It is not a substitute for professional mediation, legal advice, or therapeutic support.",
}
