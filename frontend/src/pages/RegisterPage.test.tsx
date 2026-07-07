import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import RegisterPage from './RegisterPage'

function renderRegisterPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RegisterPage', () => {
  it('shows a validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm password'), 'different')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('registers and navigates to the dashboard on success', async () => {
    server.use(
      http.post('/auth/register', () =>
        HttpResponse.json({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' }, { status: 201 }),
      ),
    )
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(localStorage.getItem('access_token')).toBe('a')
  })

  it('surfaces the server error message on duplicate email', async () => {
    server.use(
      http.post('/auth/register', () =>
        HttpResponse.json({ detail: 'Email already registered' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText('Email already registered')).toBeInTheDocument()
  })
})
