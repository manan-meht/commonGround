/**
 * Canonical invitation message builder — safe for server and client.
 * Never include private intake content here.
 */

export interface InvitationMessageInput {
  initiatorFirstName: string
  recipientFirstName: string
  topic: string
  invitationUrl: string
}

/**
 * Returns the plain-text invitation message sent to the recipient.
 * This is the single source of truth for invitation copy.
 */
export function buildInvitationMessage(input: InvitationMessageInput): string {
  const { initiatorFirstName, recipientFirstName, topic, invitationUrl } = input

  return (
    `Hi ${recipientFirstName}, ${initiatorFirstName} has invited you to a private guided conversation on Urushi Labs about:\n` +
    `\n` +
    `"${topic}"\n` +
    `\n` +
    `The purpose is not to decide who is right. Urushi Labs gives both of you an equal opportunity to share your perspective privately, understand where communication may have broken down, and identify practical ways forward.\n` +
    `\n` +
    `Joining does not mean that you agree with ${initiatorFirstName}'s perspective. Your responses will not be shown to them verbatim, and a shared report is prepared only after both of you have had an opportunity to contribute.\n` +
    `\n` +
    `It usually takes just a few minutes to get started:\n` +
    `\n` +
    invitationUrl
  )
}

/**
 * Extracts the first name from a full name or email address.
 */
export function extractFirstName(fullNameOrEmail: string): string {
  // If it looks like an email, use the part before @
  if (fullNameOrEmail.includes('@')) {
    const prefix = fullNameOrEmail.split('@')[0] ?? fullNameOrEmail
    // Capitalise first letter
    return prefix.charAt(0).toUpperCase() + prefix.slice(1)
  }
  // Otherwise take the first word of the full name
  return fullNameOrEmail.split(' ')[0] ?? fullNameOrEmail
}
