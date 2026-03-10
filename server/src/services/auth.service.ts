import jwt from 'jsonwebtoken'
import { createOrUpdateUser } from './db.service.js'
import type { ServiceResult, GithubProfile, AuthUser } from '@shared/types/index.js'

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_API_URL = 'https://api.github.com/user'
const COOKIE_NAME = 'auth_token'

export { COOKIE_NAME }

export function getGithubAuthUrl(): ServiceResult<string> {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return { success: false, error: 'GITHUB_CLIENT_ID not configured', status: 500 }
  }
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'read:user',
    redirect_uri: `http://localhost:${process.env.PORT ?? 3001}/api/auth/callback`,
  })
  return { success: true, data: `${GITHUB_OAUTH_URL}?${params.toString()}` }
}

export async function exchangeCodeForToken(code: string): Promise<ServiceResult<string>> {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return { success: false, error: 'GitHub OAuth credentials not configured', status: 500 }
    }
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      return { success: false, error: `GitHub token exchange failed: ${response.status}`, status: 502 }
    }
    const data = (await response.json()) as { access_token?: string; error?: string }
    if (data.error || !data.access_token) {
      return { success: false, error: data.error ?? 'No access token in response', status: 401 }
    }
    return { success: true, data: data.access_token }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function fetchGithubProfile(accessToken: string): Promise<ServiceResult<GithubProfile>> {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      return { success: false, error: `GitHub profile fetch failed: ${response.status}`, status: 502 }
    }
    const data = (await response.json()) as { id?: number; login?: string; avatar_url?: string }
    if (!data.id || !data.login) {
      return { success: false, error: 'Invalid GitHub profile response', status: 502 }
    }
    return { success: true, data: { id: data.id, login: data.login, avatarUrl: data.avatar_url ?? '' } }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export async function loginOrCreateUser(code: string): Promise<ServiceResult<{ user: AuthUser; token: string }>> {
  const tokenResult = await exchangeCodeForToken(code)
  if (!tokenResult.success) return tokenResult

  const profileResult = await fetchGithubProfile(tokenResult.data)
  if (!profileResult.success) return profileResult

  const profile = profileResult.data
  const userResult = await createOrUpdateUser({
    githubId: profile.id,
    githubUsername: profile.login,
    avatarUrl: profile.avatarUrl,
    accessToken: tokenResult.data,
  })
  if (!userResult.success) return userResult

  const jwtResult = generateJwt(userResult.data.id)
  if (!jwtResult.success) return jwtResult

  return {
    success: true,
    data: {
      user: { id: userResult.data.id, githubUsername: profile.login, avatarUrl: profile.avatarUrl },
      token: jwtResult.data,
    },
  }
}

export function generateJwt(userId: string): ServiceResult<string> {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    return { success: false, error: 'SESSION_SECRET not configured', status: 500 }
  }
  try {
    const token = jwt.sign({ userId }, secret, { expiresIn: '7d' })
    return { success: true, data: token }
  } catch (error) {
    return { success: false, error: String(error), status: 500 }
  }
}

export function verifyJwt(token: string): ServiceResult<{ userId: string }> {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    return { success: false, error: 'SESSION_SECRET not configured', status: 500 }
  }
  try {
    const payload = jwt.verify(token, secret) as { userId: string }
    return { success: true, data: { userId: payload.userId } }
  } catch (error) {
    return { success: false, error: String(error), status: 401 }
  }
}
