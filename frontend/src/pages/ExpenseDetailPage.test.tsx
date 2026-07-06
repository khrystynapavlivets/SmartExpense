import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expensesApi, type Expense } from '../api/expenses'
import ExpenseDetailPage from './ExpenseDetailPage'

vi.mock('../api/expenses', () => ({
  expensesApi: { get: vi.fn(), imageUrl: vi.fn(), delete: vi.fn() },
}))

const sampleExpense: Expense = {
  id: 1,
  vendor: 'Test Shop',
  total: 25.5,
  date: '2024-01-15',
  address: '123 Main St',
  raw_text: 'Test Shop\nTotal: 25.50',
  document_type: 'receipt',
  image_path: null,
  created_at: '2024-01-15T10:00:00Z',
  items: [{ name: 'Milk', quantity: 1, price: 2.5, amount: 2.5 }],
}

const sampleExpenseWithImage: Expense = { ...sampleExpense, image_path: 'receipt.jpg' }

function renderDetailPage(id = '1') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/expenses/${id}`]}>
        <Routes>
          <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
          <Route path="/expenses" element={<div>Expenses list</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ExpenseDetailPage', () => {
  beforeEach(() => {
    vi.mocked(expensesApi.get).mockReset()
    vi.mocked(expensesApi.imageUrl).mockReset()
  })

  it('renders expense details once loaded', async () => {
    vi.mocked(expensesApi.get).mockResolvedValue(sampleExpense)
    renderDetailPage()

    expect(await screen.findByText('Test Shop')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
  })

  it('shows a not-found message when the expense does not exist', async () => {
    vi.mocked(expensesApi.get).mockResolvedValue(undefined as any)
    renderDetailPage()

    expect(await screen.findByText('Not found')).toBeInTheDocument()
  })

  it('shows a loading placeholder while the receipt image is being fetched', async () => {
    vi.mocked(expensesApi.get).mockResolvedValue(sampleExpenseWithImage)
    let resolveImage: (url: string) => void = () => {}
    vi.mocked(expensesApi.imageUrl).mockReturnValue(
      new Promise((resolve) => { resolveImage = resolve }),
    )
    renderDetailPage()

    expect(await screen.findByText('Loading image...')).toBeInTheDocument()
    expect(document.querySelector('img[alt="Receipt"]')).toBeNull()

    resolveImage('blob:mock-url')

    await waitFor(() => {
      expect(document.querySelector('img[alt="Receipt"]')).not.toBeNull()
    })
    expect(screen.queryByText('Loading image...')).not.toBeInTheDocument()
  })

  it('offers a retry when the receipt image fails to load, and recovers without a page reload', async () => {
    vi.mocked(expensesApi.get).mockResolvedValue(sampleExpenseWithImage)
    vi.mocked(expensesApi.imageUrl).mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()
    renderDetailPage()

    const retryButton = await screen.findByRole(
      'button',
      { name: /try again/i },
      { timeout: 10_000 },
    )
    expect(screen.getByText('Failed to load receipt image.')).toBeInTheDocument()

    vi.mocked(expensesApi.imageUrl).mockResolvedValue('blob:mock-url')
    await user.click(retryButton)

    await waitFor(() => {
      expect(document.querySelector('img[alt="Receipt"]')).not.toBeNull()
    })
    expect(screen.queryByText('Failed to load receipt image.')).not.toBeInTheDocument()
  }, 15_000)
})
