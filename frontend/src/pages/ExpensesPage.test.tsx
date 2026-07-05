import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expensesApi, type Expense } from '../api/expenses'
import ExpensesPage from './ExpensesPage'

vi.mock('../api/expenses', () => ({
  expensesApi: { list: vi.fn(), delete: vi.fn() },
}))

const sampleExpense: Expense = {
  id: 1,
  vendor: 'Test Shop',
  total: 25.5,
  date: '2024-01-15',
  address: null,
  raw_text: null,
  document_type: 'receipt',
  image_path: null,
  created_at: '2024-01-15T10:00:00Z',
  items: [],
}

function renderExpensesPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/expenses']}>
        <ExpensesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ExpensesPage', () => {
  beforeEach(() => {
    vi.mocked(expensesApi.list).mockReset()
    vi.mocked(expensesApi.delete).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the empty state when there are no expenses', async () => {
    vi.mocked(expensesApi.list).mockResolvedValue([])
    renderExpensesPage()

    expect(await screen.findByText('Nothing found.')).toBeInTheDocument()
  })

  it('renders a table row per expense', async () => {
    vi.mocked(expensesApi.list).mockResolvedValue([sampleExpense])
    renderExpensesPage()

    expect(await screen.findByText('Test Shop')).toBeInTheDocument()
    expect(screen.getByText('25.50')).toBeInTheDocument()
  })

  it('deletes an expense after the user confirms', async () => {
    vi.mocked(expensesApi.list).mockResolvedValue([sampleExpense])
    vi.mocked(expensesApi.delete).mockResolvedValue(undefined as any)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderExpensesPage()

    await screen.findByText('Test Shop')
    await user.click(screen.getByTitle('Delete'))

    await waitFor(() => expect(expensesApi.delete).toHaveBeenCalledWith(1))
  })

  it('does not delete when the user cancels the confirmation', async () => {
    vi.mocked(expensesApi.list).mockResolvedValue([sampleExpense])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderExpensesPage()

    await screen.findByText('Test Shop')
    await user.click(screen.getByTitle('Delete'))

    expect(expensesApi.delete).not.toHaveBeenCalled()
  })
})
