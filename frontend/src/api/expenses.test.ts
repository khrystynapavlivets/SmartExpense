import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../test/server'
import api from './client'
import { expensesApi, type Expense } from './expenses'

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
  items: [],
}

describe('expensesApi', () => {
  it('list forwards filters as query params', async () => {
    let url = ''
    server.use(
      http.get('/api/v1/expenses/', ({ request }) => {
        url = request.url
        return HttpResponse.json([sampleExpense])
      }),
    )

    const result = await expensesApi.list({ vendor: 'test', document_type: 'receipt', skip: 0, limit: 20 })
    const params = new URL(url).searchParams
    expect(params.get('vendor')).toBe('test')
    expect(params.get('document_type')).toBe('receipt')
    expect(params.get('skip')).toBe('0')
    expect(params.get('limit')).toBe('20')
    expect(result).toEqual([sampleExpense])
  })

  it('get fetches a single expense by id', async () => {
    server.use(http.get('/api/v1/expenses/1', () => HttpResponse.json(sampleExpense)))
    const result = await expensesApi.get(1)
    expect(result.id).toBe(1)
  })

  it('create posts the payload and returns the created expense', async () => {
    let body: unknown = null
    server.use(
      http.post('/api/v1/expenses/', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(sampleExpense, { status: 201 })
      }),
    )

    const result = await expensesApi.create({ vendor: 'Test Shop', total: 25.5 })
    expect(body).toEqual({ vendor: 'Test Shop', total: 25.5 })
    expect(result.vendor).toBe('Test Shop')
  })

  it('update PUTs the payload to the expense id', async () => {
    let capturedUrl = ''
    server.use(
      http.put('/api/v1/expenses/1', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ ...sampleExpense, vendor: 'Updated' })
      }),
    )

    const result = await expensesApi.update(1, { vendor: 'Updated' })
    expect(capturedUrl).toContain('/api/v1/expenses/1')
    expect(result.vendor).toBe('Updated')
  })

  it('delete issues a DELETE request to the expense id', async () => {
    let called = false
    server.use(
      http.delete('/api/v1/expenses/1', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expensesApi.delete(1)
    expect(called).toBe(true)
  })

  it('summary fetches the aggregated summary', async () => {
    server.use(
      http.get('/api/v1/expenses/summary', () =>
        HttpResponse.json({ total_count: 2, total_amount: 51.0, by_category: [] }),
      ),
    )

    const result = await expensesApi.summary()
    expect(result.total_count).toBe(2)
    expect(result.total_amount).toBe(51.0)
  })

  it('upload wraps the file in FormData and posts it', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: sampleExpense })

    const file = new File(['fake-bytes'], 'receipt.jpg', { type: 'image/jpeg' })
    const result = await expensesApi.upload(file)

    expect(postSpy).toHaveBeenCalledTimes(1)
    const [url, form] = postSpy.mock.calls[0]
    expect(url).toBe('/api/v1/expenses/upload')
    expect(form).toBeInstanceOf(FormData)
    expect((form as FormData).get('file')).toBe(file)
    expect(result.id).toBe(1)

    postSpy.mockRestore()
  })
})
