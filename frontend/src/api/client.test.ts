import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import api from './client'

describe('api client', () => {
  it('attaches the Authorization header when a token is stored', async () => {
    localStorage.setItem('access_token', 'my-token')
    let receivedAuth: string | null = null

    server.use(
      http.get('/probe', ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await api.get('/probe')
    expect(receivedAuth).toBe('Bearer my-token')
  })

  it('omits the Authorization header when no token is stored', async () => {
    let receivedAuth: string | null = 'unset'

    server.use(
      http.get('/probe', ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await api.get('/probe')
    expect(receivedAuth).toBeNull()
  })

  it('clears tokens and redirects to /login on a 401 response', async () => {
    localStorage.setItem('access_token', 'stale-token')
    localStorage.setItem('refresh_token', 'stale-refresh')

    server.use(http.get('/probe', () => new HttpResponse(null, { status: 401 })))

    await expect(api.get('/probe')).rejects.toBeTruthy()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('does not clear tokens on non-401 errors', async () => {
    localStorage.setItem('access_token', 'valid-token')
    server.use(http.get('/probe', () => new HttpResponse(null, { status: 500 })))

    await expect(api.get('/probe')).rejects.toBeTruthy()
    expect(localStorage.getItem('access_token')).toBe('valid-token')
  })
})
