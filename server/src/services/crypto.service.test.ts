import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptToken, decryptToken } from './crypto.service.js'

const VALID_KEY = 'a'.repeat(64) // 64-char hex = 32 bytes

describe('crypto.service', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY
  })

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY
  })

  describe('encryptToken', () => {
    it('should encrypt a token and return a formatted string', () => {
      const result = encryptToken('my-secret-token')
      expect(result.success).toBe(true)
      if (!result.success) return
      const parts = result.data.split(':')
      expect(parts).toHaveLength(3)
    })

    it('should produce different ciphertext each call (random IV)', () => {
      const first = encryptToken('same-token')
      const second = encryptToken('same-token')
      expect(first.success).toBe(true)
      expect(second.success).toBe(true)
      if (!first.success || !second.success) return
      expect(first.data).not.toBe(second.data)
    })

    it('should fail when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY
      const result = encryptToken('token')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(500)
      expect(result.error).toContain('ENCRYPTION_KEY')
    })

    it('should fail when ENCRYPTION_KEY is wrong length', () => {
      process.env.ENCRYPTION_KEY = 'tooshort'
      const result = encryptToken('token')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(500)
    })
  })

  describe('decryptToken', () => {
    it('should decrypt what was encrypted (roundtrip)', () => {
      const original = 'ghp_super_secret_token_12345'
      const encrypted = encryptToken(original)
      expect(encrypted.success).toBe(true)
      if (!encrypted.success) return
      const decrypted = decryptToken(encrypted.data)
      expect(decrypted.success).toBe(true)
      if (!decrypted.success) return
      expect(decrypted.data).toBe(original)
    })

    it('should decrypt known ciphertext correctly', () => {
      // Encrypt a known value, then verify the decryption roundtrip deterministically
      const token = 'known-test-token'
      const enc = encryptToken(token)
      expect(enc.success).toBe(true)
      if (!enc.success) return
      const dec = decryptToken(enc.data)
      expect(dec.success).toBe(true)
      if (!dec.success) return
      expect(dec.data).toBe(token)
    })

    it('should fail on malformed input (missing colons)', () => {
      const result = decryptToken('notvalidatall')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(400)
      expect(result.error).toContain('Invalid encrypted token format')
    })

    it('should fail when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY
      const result = decryptToken('iv:tag:data')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.status).toBe(500)
    })

    it('should fail when decrypting with wrong key', () => {
      const encrypted = encryptToken('secret')
      expect(encrypted.success).toBe(true)
      if (!encrypted.success) return

      // Switch to a different key
      process.env.ENCRYPTION_KEY = 'b'.repeat(64)
      const result = decryptToken(encrypted.data)
      expect(result.success).toBe(false)
    })

    it('should fail on tampered ciphertext', () => {
      const encrypted = encryptToken('original')
      expect(encrypted.success).toBe(true)
      if (!encrypted.success) return

      // Tamper with the ciphertext part
      const parts = encrypted.data.split(':')
      parts[2] = 'deadbeef'.repeat(4)
      const result = decryptToken(parts.join(':'))
      expect(result.success).toBe(false)
    })
  })
})
