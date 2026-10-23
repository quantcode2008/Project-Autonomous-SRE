import { describe, expect, it } from 'vitest'
import {
  decryptToken,
  encryptToken,
  generateIngestKey,
  hashKey,
  timingSafeCompare,
} from '../lib/crypto'

describe('Crypto Utilities (T1.7, T1.8)', () => {
  it('encrypts and decrypts repository tokens with AES-256-GCM', () => {
    const originalToken = 'ghp_secret_access_token_1234567890'
    const encrypted = encryptToken(originalToken)

    expect(encrypted).not.toEqual(originalToken)
    expect(encrypted.split(':').length).toBe(3) // iv:tag:ciphertext

    const decrypted = decryptToken(encrypted)
    expect(decrypted).toBe(originalToken)
  })

  it('generates unique ciphertexts for the same plaintext due to random IVs', () => {
    const token = 'ghp_same_token_123'
    const enc1 = encryptToken(token)
    const enc2 = encryptToken(token)

    expect(enc1).not.toBe(enc2)
    expect(decryptToken(enc1)).toBe(token)
    expect(decryptToken(enc2)).toBe(token)
  })

  it('fails decryption if encrypted payload is corrupted', () => {
    const encrypted = encryptToken('secret_token')
    const corrupted = encrypted.slice(0, -4) + 'AAAA'
    expect(() => decryptToken(corrupted)).toThrow()
  })

  it('timingSafeCompare correctly compares strings in constant time', () => {
    expect(timingSafeCompare('correct_secret_value', 'correct_secret_value')).toBe(true)
    expect(timingSafeCompare('correct_secret_value', 'wrong_secret_value')).toBe(false)
    expect(timingSafeCompare('short', 'much_longer_string')).toBe(false)
  })

  it('generates valid ingest keys with prefix and sha256 hash', () => {
    const { key, prefix, hash } = generateIngestKey()
    expect(key.startsWith('sk_ing_')).toBe(true)
    expect(prefix).toBe(key.slice(0, 15))
    expect(hash).toBe(hashKey(key))
    expect(hash.length).toBe(64) // 256-bit hex
  })
})
