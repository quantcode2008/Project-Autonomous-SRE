import crypto from 'node:crypto'
import { validateApiEnv } from '../config/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const env = validateApiEnv()
  return crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest()
}

/**
 * Encrypt a repository token using AES-256-GCM.
 * Formats result as base64(iv):base64(authTag):base64(ciphertext).
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

/**
 * Decrypt a repository token using AES-256-GCM.
 */
export function decryptToken(encryptedString: string): string {
  const key = getEncryptionKey()
  const [ivB64, tagB64, ciphertextB64] = encryptedString.split(':')

  if (!ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error('Invalid encrypted token format')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * SHA-256 hash for ingest key storage.
 */
export function hashKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

/**
 * Mint a new ingest key with format: sk_ing_<random_hex>.
 */
export function generateIngestKey(): { key: string; prefix: string; hash: string } {
  const randomPart = crypto.randomBytes(24).toString('hex')
  const key = `sk_ing_${randomPart}`
  const prefix = key.slice(0, 15) // First 15 displayable characters
  const hash = hashKey(key)

  return { key, prefix, hash }
}
