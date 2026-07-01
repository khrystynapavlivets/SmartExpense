import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '../api/expenses'

const DOC_TYPE_LABELS: Record<string, string> = {
  receipt: 'Receipt',
  taxi: 'Taxi',
  invoice: 'Invoice',
  utility_bill: 'Utility bill',
  other: 'Other',
}

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.get(Number(id)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => expensesApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      navigate('/expenses')
    },
  })

  if (isLoading) return <div className="p-8 text-gray-400">Loading...</div>
  if (!expense) return <div className="p-8 text-gray-400">Not found</div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/expenses" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{expense.vendor ?? 'Untitled'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{expense.date ?? expense.created_at.slice(0, 10)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {expense.total != null ? expense.total.toFixed(2) : '—'}
            </p>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              {DOC_TYPE_LABELS[expense.document_type ?? ''] ?? expense.document_type ?? '—'}
            </span>
          </div>
        </div>

        {expense.address && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Address</p>
            <p className="text-sm text-gray-700">{expense.address}</p>
          </div>
        )}

        {/* Line items */}
        {expense.items.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Items</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium text-center">Qty</th>
                    <th className="px-3 py-2 font-medium text-right">Price</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expense.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-800">{item.name ?? '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{item.quantity ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{item.price?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{item.amount?.toFixed(2) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {expense.raw_text && (
          <details className="text-sm">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-600 text-xs uppercase tracking-wide">
              Raw text
            </summary>
            <pre className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap overflow-auto max-h-48">
              {expense.raw_text}
            </pre>
          </details>
        )}
      </div>

      <button
        onClick={() => {
          if (confirm('Delete this record?')) deleteMutation.mutate()
        }}
        disabled={deleteMutation.isPending}
        className="text-red-500 hover:text-red-700 text-sm disabled:opacity-40"
      >
        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
