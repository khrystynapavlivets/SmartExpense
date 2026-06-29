import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { expensesApi } from '../api/expenses'

const DOC_TYPES = ['', 'receipt', 'taxi', 'invoice', 'utility_bill', 'other']
const DOC_TYPE_LABELS: Record<string, string> = {
  '': 'Всі',
  receipt: 'Чек',
  taxi: 'Таксі',
  invoice: 'Рахунок',
  utility_bill: 'Комунальні',
  other: 'Інше',
}

export default function ExpensesPage() {
  const [vendor, setVendor] = useState('')
  const [docType, setDocType] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', { vendor, docType, page }],
    queryFn: () =>
      expensesApi.list({
        vendor: vendor || undefined,
        document_type: docType || undefined,
        skip: page * limit,
        limit,
      }),
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Витрати</h1>
        <Link
          to="/upload"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Завантажити
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Пошук за назвою..."
          value={vendor}
          onChange={(e) => { setVendor(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-48"
        />
        <select
          value={docType}
          onChange={(e) => { setDocType(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Завантаження...</div>
        ) : expenses && expenses.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Продавець</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Тип</th>
                <th className="px-4 py-3 font-medium text-right">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/expenses/${e.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                      {e.vendor ?? 'Без назви'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.date ?? e.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {DOC_TYPE_LABELS[e.document_type ?? ''] ?? e.document_type ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {e.total != null ? e.total.toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            Нічого не знайдено.{' '}
            <Link to="/upload" className="text-indigo-600 hover:underline">Завантажте чек</Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30"
        >
          ← Назад
        </button>
        <span className="text-xs text-gray-400">Сторінка {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!expenses || expenses.length < limit}
          className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30"
        >
          Вперед →
        </button>
      </div>
    </div>
  )
}
