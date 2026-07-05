import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { authApi, clearTokens, isAuthenticated, saveTokens } from './auth'

describe('saveTokens / clearTokens / isAuthenticated', () => {
  it('persists tokens to localStorage', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })
    expect(localStorage.getItem('access_token')).toBe('a')
    expect(localStorage.getItem('refresh_token')).toBe('r')
  })

  it('reports authenticated once an access token is saved', () => {
    expect(isAuthenticated()).toBe(false)
    saveTokens({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })
    expect(isAuthenticated()).toBe(true)
  })

  it('clears both tokens', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })
    clearTokens()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })
})

describe('authApi', () => {
  it('register posts email/password as JSON', async () => {
    let body: unknown = null
    server.use(
      http.post('/auth/register', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' }, { status: 201 })
      }),
    )

    const result = await authApi.register('user@example.com', 'pw123456')
    expect(body).toEqual({ email: 'user@example.com', password: 'pw123456' })
    expect(result.access_token).toBe('a')
  })

  it('login posts credentials as a urlencoded form', async () => {
    let receivedBody = ''
    let contentType: string | null = null
    server.use(
      http.post('/auth/login', async ({ request }) => {
        contentType = request.headers.get('Content-Type')
        receivedBody = await request.text()
        return HttpResponse.json({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })
      }),
    )

    await authApi.login('user@example.com', 'secret')
    expect(contentType).toContain('application/x-www-form-urlencoded')
    const params = new URLSearchParams(receivedBody)
    expect(params.get('username')).toBe('user@example.com')
    expect(params.get('password')).toBe('secret')
  })

  it('me fetches the current user', async () => {
    server.use(
      http.get('/auth/me', () =>
        HttpResponse.json({ id: 1, email: 'user@example.com', is_active: true }),
      ),
    )

    const user = await authApi.me()
    expect(user.email).toBe('user@example.com')
  })
})
