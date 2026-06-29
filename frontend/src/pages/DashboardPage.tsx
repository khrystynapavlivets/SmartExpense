import { useQuery } from '@tanstack/react-query'
import { expensesApi } from '../api/expenses'
import { Link } from 'react-router-dom'

const DOC_TYPE_LABELS: Record<string, string> = {
  receipt: 'Чек',
  taxi: 'Таксі',
  invoice: 'Рахунок',
  utility_bill: 'Комунальні',
  other: 'Інше',
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: expensesApi.summary,
  })

  const { data: recent } = useQuery({
    queryKey: ['expenses', { limit: 5 }],
    queryFn: () => expensesApi.list({ limit: 5 }),
  })

  if (isLoading) {
    return <div className="p-8 text-gray-400">Завантаження...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Дашборд</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Всього витрат</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.total_amount.toFixed(2) ?? '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Документів</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.total_count ?? '—'}</p>
        </div>
      </div>

      {/* By category */}
      {summary && summary.by_category.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">За категоріями</h2>
          <div className="space-y-3">
            {summary.by_category.map((cat) => (
              <div key={cat.document_type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {DOC_TYPE_LABELS[cat.document_type ?? ''] ?? cat.document_type ?? 'Невідомо'}
                  </span>
                  <span className="text-xs text-gray-400">{cat.count} шт.</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{cat.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">Останні записи</h2>
          <Link to="/expenses" className="text-xs text-indigo-600 hover:underline">Всі</Link>
        </div>
        {recent && recent.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recent.map((e) => (
              <Link
                key={e.id}
                to={`/expenses/${e.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.vendor ?? 'Без назви'}</p>
                  <p className="text-xs text-gray-400">{e.date ?? e.created_at.slice(0, 10)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {e.total != null ? e.total.toFixed(2) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {DOC_TYPE_LABELS[e.document_type ?? ''] ?? e.document_type ?? ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Ще немає записів. <Link to="/upload" className="text-indigo-600 hover:underline">Завантажте перший чек</Link></p>
        )}
      </div>
    </div>
  )
}
