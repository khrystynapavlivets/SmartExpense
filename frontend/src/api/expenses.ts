import api from './client'

export interface ExpenseItem {
  name: string | null
  quantity: number | null
  price: number | null
  amount: number | null
}

export interface Expense {
  id: number
  vendor: string | null
  total: number | null
  date: string | null
  address: string | null
  raw_text: string | null
  document_type: string | null
  image_path: string | null
  created_at: string
  items: ExpenseItem[]
}

export interface ExpenseSummary {
  total_count: number
  total_amount: number
  by_category: { document_type: string | null; count: number; total: number }[]
}

export interface ExpenseFilters {
  skip?: number
  limit?: number
  vendor?: string
  document_type?: string
  min_total?: number
  max_total?: number
}

export const expensesApi = {
  list: (filters: ExpenseFilters = {}) =>
    api.get<Expense[]>('/api/v1/expenses/', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    api.get<Expense>(`/api/v1/expenses/${id}`).then((r) => r.data),

  create: (data: Partial<Expense>) =>
    api.post<Expense>('/api/v1/expenses/', data).then((r) => r.data),

  update: (id: number, data: Partial<Expense>) =>
    api.put<Expense>(`/api/v1/expenses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/v1/expenses/${id}`),

  imageUrl: (id: number) =>
    api.get(`/api/v1/expenses/${id}/image`, { responseType: 'blob' }).then((r) => URL.createObjectURL(r.data)),

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<Expense>('/api/v1/expenses/upload', form).then((r) => r.data)
  },

  summary: () =>
    api.get<ExpenseSummary>('/api/v1/expenses/summary').then((r) => r.data),
}
