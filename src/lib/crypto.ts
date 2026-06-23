/**
 * Server-only AES-256-GCM field-level encryption.
 * Never import from client components.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // 96-bit IV for GCM

function getKey(): Buffer {
  const hex = process.env['SUBMISSION_ENCRYPTION_KEY']
  if (!hex || !/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('SUBMISSION_ENCRYPTION_KEY must be a 64-character hex string.')
  }
  return Buffer.from(hex, 'hex')
}

export interface EncryptedField {
  ciphertext: string  // base64
  iv: string          // hex
  tag: string         // hex
}

export function encrypt(plaintext: string): EncryptedField {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

export function decrypt(field: EncryptedField): string {
  const key = getKey()
  const iv = Buffer.from(field.iv, 'hex')
  const tag = Buffer.from(field.tag, 'hex')
  const ciphertext = Buffer.from(field.ciphertext, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

export function encryptToDb(plaintext: string): {
  encrypted_content: string
  encryption_iv: string
  encryption_tag: string
} {
  const { ciphertext, iv, tag } = encrypt(plaintext)
  return {
    encrypted_content: ciphertext,
    encryption_iv: iv,
    encryption_tag: tag,
  }
}

export function decryptFromDb(row: {
  encrypted_content: string
  encryption_iv: string
  encryption_tag: string
}): string {
  return decrypt({
    ciphertext: row.encrypted_content,
    iv: row.encryption_iv,
    tag: row.encryption_tag,
  })
}

export function encryptSummaryToDb(plaintext: string): {
  encrypted_summary: string
  encryption_iv: string
  encryption_tag: string
} {
  const { ciphertext, iv, tag } = encrypt(plaintext)
  return {
    encrypted_summary: ciphertext,
    encryption_iv: iv,
    encryption_tag: tag,
  }
}

export function decryptSummaryFromDb(row: {
  encrypted_summary: string
  encryption_iv: string
  encryption_tag: string
}): string {
  return decrypt({
    ciphertext: row.encrypted_summary,
    iv: row.encryption_iv,
    tag: row.encryption_tag,
  })
}
