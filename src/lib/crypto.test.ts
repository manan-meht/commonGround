import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt, encryptToDb, decryptFromDb, encryptSummaryToDb, decryptSummaryFromDb } from './crypto'

// 64-char hex key for testing
const TEST_KEY = 'a'.repeat(64)

beforeAll(() => {
  process.env['SUBMISSION_ENCRYPTION_KEY'] = TEST_KEY
})

describe('encrypt / decrypt', () => {
  it('round-trips plaintext', () => {
    const plaintext = 'Hello, this is a sensitive message!'
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('generates unique IVs for each encryption', () => {
    const plaintext = 'same message'
    const a = encrypt(plaintext)
    const b = encrypt(plaintext)
    expect(a.iv).not.toBe(b.iv)
    expect(a.ciphertext).not.toBe(b.ciphertext)
  })

  it('throws on tampered ciphertext', () => {
    const { ciphertext, iv, tag } = encrypt('original')
    const tampered = { ciphertext: ciphertext.slice(0, -2) + 'ZZ', iv, tag }
    expect(() => decrypt(tampered)).toThrow()
  })

  it('throws on tampered auth tag', () => {
    const { ciphertext, iv } = encrypt('original')
    expect(() => decrypt({ ciphertext, iv, tag: 'deadbeef'.repeat(4) })).toThrow()
  })

  it('handles unicode content', () => {
    const plaintext = 'Héllo wörld 🌍 私は日本語を話す'
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })

  it('handles empty string', () => {
    const plaintext = ''
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })
})

describe('encryptToDb / decryptFromDb', () => {
  it('round-trips via db field names', () => {
    const plaintext = 'Private message content'
    const row = encryptToDb(plaintext)
    expect(row.encrypted_content).toBeDefined()
    expect(row.encryption_iv).toBeDefined()
    expect(row.encryption_tag).toBeDefined()
    expect(decryptFromDb(row)).toBe(plaintext)
  })
})

describe('encryptSummaryToDb / decryptSummaryFromDb', () => {
  it('round-trips summary via db field names', () => {
    const summary = 'This is the encrypted participant summary.'
    const row = encryptSummaryToDb(summary)
    expect(row.encrypted_summary).toBeDefined()
    expect(decryptSummaryFromDb(row)).toBe(summary)
  })
})
