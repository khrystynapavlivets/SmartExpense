import api from './client'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserRead {
  id: number
  email: string
  is_active: boolean
}

export const authApi = {
  register: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/register', { email, password }).then((r) => r.data),

  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api
      .post<TokenResponse>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((r) => r.data)
  },

  me: () => api.get<UserRead>('/auth/me').then((r) => r.data),
}

export function saveTokens(tokens: TokenResponse) {
  localStorage.setItem('access_token', tokens.access_token)
  localStorage.setItem('refresh_token', tokens.refresh_token)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token')
}
