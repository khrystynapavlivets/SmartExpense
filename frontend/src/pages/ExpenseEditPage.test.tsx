import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expensesApi, type Expense } from '../api/expenses'
import ExpenseEditPage from './ExpenseEditPage'

vi.mock('../api/expenses', () => ({
  expensesApi: { get: vi.fn(), update: vi.fn() },
}))

const sampleExpense: Expense = {
  id: 1,
  vendor: 'Test Shop',
  total: 25.5,
  date: '2024-01-15',
  address: '123 Main St',
  raw_text: null,
  document_type: 'receipt',
  image_path: null,
  created_at: '2024-01-15T10:00:00Z',
  items: [],
}

function renderEditPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/expenses/1/edit']}>
        <Routes>
          <Route path="/expenses/:id/edit" element={<ExpenseEditPage />} />
          <Route path="/expenses/:id" element={<div>Expense detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ExpenseEditPage', () => {
  beforeEach(() => {
    vi.mocked(expensesApi.get).mockReset()
    vi.mocked(expensesApi.update).mockReset()
  })

  it('pre-fills the form with the expense data once loaded', async () => {
    vi.mocked(expensesApi.get).mockResolvedValue(sampleExpense)
    renderEditPage()

    expect(await screen.findByDisplayValue('Test Shop')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25.5')).toBeInTheDocument()
  })

  it('saves changes and navigates to the detail page', async () => {
    vi.mocked(expensesApi.get).mockResolvedValue(sampleExpense)
    vi.mocked(expensesApi.update).mockResolvedValue({ ...sampleExpense, vendor: 'New Vendor' })
    const user = userEvent.setup()
    renderEditPage()

    const vendorInput = await screen.findByDisplayValue('Test Shop')
    await user.clear(vendorInput)
    await user.type(vendorInput, 'New Vendor')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Expense detail')).toBeInTheDocument()
    expect(expensesApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ vendor: 'New Vendor' }),
    )
  })
})
