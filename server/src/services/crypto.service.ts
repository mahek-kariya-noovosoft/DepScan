import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import type { ServiceResult } from '@shared/types/index.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey(): ServiceResult<Buffer> {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw || raw.length !== 64) {
    return { success: false, error: 'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)', status: 500 }
  }
  return { success: true, data: Buffer.from(raw, 'hex') }
}

export function encryptToken(token: string): ServiceResult<string> {
  try {
    const keyResult = getKey()
    if (!keyResult.success) return keyResult
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, keyResult.data, iv)
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return {
      success: true,
      data: `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`,
    }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export function decryptToken(stored: string): ServiceResult<string> {
  try {
    const keyResult = getKey()
    if (!keyResult.success) return keyResult
    const parts = stored.split(':')
    if (parts.length !== 3) {
      return { success: false, error: 'Invalid encrypted token format', status: 400 }
    }
    const [ivHex, authTagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, keyResult.data, iv)
    decipher.setAuthTag(authTag)
    const decrypted = decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
    return { success: true, data: decrypted }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}