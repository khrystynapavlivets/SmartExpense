import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expensesApi, type Expense, type ExpenseSummary } from '../api/expenses'
import DashboardPage from './DashboardPage'

vi.mock('../api/expenses', () => ({
  expensesApi: { summary: vi.fn(), list: vi.fn() },
}))

const summary: ExpenseSummary = {
  total_count: 2,
  total_amount: 40.5,
  by_category: [
    { document_type: 'receipt', count: 1, total: 25.5 },
    { document_type: 'taxi', count: 1, total: 15.0 },
  ],
}

const expenses: Expense[] = [
  {
    id: 1,
    vendor: 'Test Shop',
    total: 25.5,
    date: '2024-01-15',
    address: null,
    raw_text: null,
    document_type: 'receipt',
    image_path: null,
    created_at: new Date().toISOString(),
    items: [],
  },
  {
    id: 2,
    vendor: 'City Taxi',
    total: 15.0,
    date: '2024-01-16',
    address: null,
    raw_text: null,
    document_type: 'taxi',
    image_path: null,
    created_at: new Date().toISOString(),
    items: [],
  },
]

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(expensesApi.summary).mockReset()
    vi.mocked(expensesApi.list).mockReset()
  })

  it('shows the loading state before data arrives', () => {
    vi.mocked(expensesApi.summary).mockReturnValue(new Promise(() => {}))
    vi.mocked(expensesApi.list).mockReturnValue(new Promise(() => {}))
    renderDashboard()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows the empty state message when there are no expenses', async () => {
    vi.mocked(expensesApi.summary).mockResolvedValue({ total_count: 0, total_amount: 0, by_category: [] })
    vi.mocked(expensesApi.list).mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByText(/No records yet/)).toBeInTheDocument()
  })

  it('renders totals and recent expenses once data loads', async () => {
    vi.mocked(expensesApi.summary).mockResolvedValue(summary)
    vi.mocked(expensesApi.list).mockResolvedValue(expenses)
    renderDashboard()

    expect(await screen.findByText('$40.50')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Test Shop')).toBeInTheDocument()
    expect(screen.getByText('City Taxi')).toBeInTheDocument()
  })

  it('filters recent expenses by vendor search', async () => {
    vi.mocked(expensesApi.summary).mockResolvedValue(summary)
    vi.mocked(expensesApi.list).mockResolvedValue(expenses)
    const user = userEvent.setup()
    renderDashboard()

    await screen.findByText('Test Shop')
    await user.type(screen.getByPlaceholderText('Search by vendor...'), 'city')

    expect(screen.getByText('City Taxi')).toBeInTheDocument()
    expect(screen.queryByText('Test Shop')).not.toBeInTheDocument()
  })

  it('filters recent expenses by clicking a category', async () => {
    vi.mocked(expensesApi.summary).mockResolvedValue(summary)
    vi.mocked(expensesApi.list).mockResolvedValue(expenses)
    const user = userEvent.setup()
    renderDashboard()

    await screen.findByText('Test Shop')
    await user.click(screen.getByRole('button', { name: /Taxi/i }))

    expect(screen.getByText('City Taxi')).toBeInTheDocument()
    expect(screen.queryByText('Test Shop')).not.toBeInTheDocument()

    expect(screen.getByText('Clear filter')).toBeInTheDocument()
    await user.click(screen.getByText('Clear filter'))
    expect(screen.getByText('Test Shop')).toBeInTheDocument()
  })
})
