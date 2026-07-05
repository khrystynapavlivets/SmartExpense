import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expensesApi } from '../api/expenses'
import UploadPage from './UploadPage'

vi.mock('../api/expenses', () => ({
  expensesApi: { upload: vi.fn() },
}))

function renderUploadPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/upload']}>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/expenses/:id" element={<div>Expense detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('UploadPage', () => {
  beforeEach(() => {
    vi.mocked(expensesApi.upload).mockReset()
  })

  it('disables the submit button until a file is selected', () => {
    renderUploadPage()
    expect(screen.getByRole('button', { name: /recognize/i })).toBeDisabled()
  })

  it('enables submit and shows file details after selecting a file', async () => {
    const user = userEvent.setup()
    renderUploadPage()

    const file = new File(['bytes'], 'receipt.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(screen.getByText('receipt.jpg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recognize/i })).toBeEnabled()
  })

  it('uploads the file and navigates to the created expense', async () => {
    vi.mocked(expensesApi.upload).mockResolvedValue({ id: 42 } as any)
    const user = userEvent.setup()
    renderUploadPage()

    const file = new File(['bytes'], 'receipt.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: /recognize/i }))

    expect(await screen.findByText('Expense detail')).toBeInTheDocument()
    expect(expensesApi.upload).toHaveBeenCalledWith(file)
  })

  it('shows an error message when the upload fails', async () => {
    vi.mocked(expensesApi.upload).mockRejectedValue({
      response: { data: { detail: 'Unsupported file type' } },
    })
    const user = userEvent.setup()
    renderUploadPage()

    const file = new File(['bytes'], 'receipt.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: /recognize/i }))

    expect(await screen.findByText('Unsupported file type')).toBeInTheDocument()
  })
})
