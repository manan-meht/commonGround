import type { ValidatedSharedReport } from './mediationPrompt'

export const MOCK_REPORT: ValidatedSharedReport = {
  reportTitle: 'Finding Common Ground: A Shared Perspective Report',
  neutralOverview:
    'Both participants describe a situation where differing expectations about communication and decision-making created a growing sense of frustration and disconnection. While the specific facts are seen differently, both share a genuine desire for a better working relationship and a fair resolution.',
  agreedFacts: [
    'There was a disagreement that caused noticeable tension between the two parties.',
    'Both participants feel the situation could have been handled differently.',
    'Both want a constructive outcome.',
  ],
  disputedInterpretations: [
    {
      event: 'The key conversation or incident that triggered the conflict',
      initiatorView: 'They felt their concerns were dismissed or minimised during this exchange.',
      recipientView: 'They believed they were responding reasonably given the context they were aware of at the time.',
    },
    {
      event: 'The communication that followed the initial incident',
      initiatorView: 'The lack of follow-up felt like further dismissal.',
      recipientView: 'They thought the matter had been resolved or was being considered.',
    },
  ],
  initiatorPerspective: {
    coreFeelings: ['Frustrated', 'Unheard', 'Anxious about the future'],
    mainConcerns: [
      'Their contributions are not being recognised.',
      'They were not given an opportunity to fully explain their position.',
    ],
    coreNeed: 'To feel heard, respected, and have their perspective genuinely considered.',
    paraphrase:
      '"I put real effort in and I need to know that matters. I am not asking for everything my way — I am asking to be part of the conversation."',
  },
  recipientPerspective: {
    coreFeelings: ['Surprised by the level of upset', 'Under pressure', 'Wanting to resolve this'],
    mainConcerns: [
      'They were not aware their actions were having this impact.',
      'They feel pressure from multiple directions and may have communicated poorly under stress.',
    ],
    coreNeed: 'Clarity about expectations and a chance to address things without feeling blamed.',
    paraphrase:
      '"I genuinely did not realise how this landed. I want to make it right, but I need to understand what "right" looks like without feeling like I have already been found guilty."',
  },
  pointsOfAgreement: [
    'Both want a better dynamic going forward.',
    'Both acknowledge that communication could be improved.',
    'Both are willing to engage in this process, which itself reflects goodwill.',
  ],
  sharedGoals: [
    'A respectful, functional relationship.',
    'Clearer expectations on both sides.',
    'A resolution that does not leave either person feeling resentful.',
  ],
  misunderstandings: [
    'The initiator interpreted silence or inaction as dismissal, while the recipient may have believed things were resolved.',
    'The recipient may not have known how significant the impact of their actions was.',
  ],
  intentionVsImpact: [
    {
      actor: 'recipient',
      intendedMessage: 'Acting in what they believed was a reasonable, efficient way.',
      perceivedImpact: 'The initiator experienced this as their input being disregarded.',
    },
    {
      actor: 'initiator',
      intendedMessage: 'Trying to raise concerns through the available channels.',
      perceivedImpact: 'The recipient may have perceived this as criticism rather than a request for dialogue.',
    },
  ],
  initiatorNeeds: [
    'Acknowledgement that their experience was real and significant.',
    'A clear commitment to being included in relevant decisions.',
    'A genuine apology for the impact, even if the intent was not harmful.',
  ],
  recipientNeeds: [
    'To understand exactly what is expected of them going forward.',
    'Not to feel prejudged or blamed without the opportunity to explain.',
    'Reassurance that making amends is possible.',
  ],
  initiatorAccountability: [
    'Raising concerns earlier may have prevented escalation.',
    'Exploring whether the recipient was aware of the impact before drawing conclusions could be helpful.',
  ],
  recipientAccountability: [
    'Taking responsibility for the impact of their actions, even if the intention was different, would be an important step.',
    'Proactively checking in when they sense tension would help prevent future misunderstandings.',
  ],
  recommendedNextSteps: [
    {
      action: 'Schedule a dedicated, private conversation with no other agenda — in person if possible, or video call.',
      owner: 'both',
      timeframe: 'Within one week',
    },
    {
      action: 'Begin the conversation by reading this report together, section by section, pausing to acknowledge each point before responding.',
      owner: 'both',
      timeframe: 'During the scheduled conversation',
    },
    {
      action: 'The recipient offers a specific acknowledgement of the impact described, not a general apology.',
      owner: 'recipient',
      timeframe: 'During the scheduled conversation',
    },
    {
      action: 'Both agree on two or three specific communication practices for the future (e.g., a check-in after significant decisions).',
      owner: 'both',
      timeframe: 'By the end of the scheduled conversation',
    },
  ],
  suggestedOpeningScript:
    '"I want to start by saying I am here because I genuinely want this to be better between us. I have read the report and I think it is fair. I would like to work through it together, if you are willing."',
  conversationGuidelines: [
    'Use "I" statements to describe your experience rather than "you did" statements.',
    'Agree to pause the conversation if either person feels overwhelmed, and return to it within 24 hours.',
    'Do not bring up past grievances that are not part of this specific situation.',
    'Listen to understand, not to prepare your reply.',
  ],
  possibleAgreements: [
    'A commitment to a brief weekly check-in for the next month to catch tension before it escalates.',
    'An agreed protocol for raising concerns (e.g., direct message first, then a meeting if needed).',
    'Both parties acknowledge the impact on each other in writing through the agreement feature.',
  ],
  unresolvedIssues: [
    'The specific factual account of what happened during the triggering incident differs between participants and cannot be verified by this report.',
    'Long-term structural changes (if any are needed) may require further discussion or professional facilitation.',
  ],
  professionalSupportSuggestion: null,
  safetyCategory: 'ordinary_conflict',
  safetyExplanation:
    'Based on both accounts, this situation reflects a common interpersonal conflict involving communication breakdown and unmet expectations. No indicators of safety concerns, coercion, abuse, or imminent risk were identified.',
  reportLimitations:
    'This report is based solely on each participant\'s private self-reported perspective. The AI has not verified any facts, assessed anyone\'s character, or assigned blame. It is not a substitute for professional mediation, legal advice, or therapeutic support. For complex or sensitive situations, consider working with a qualified human professional.',
}
