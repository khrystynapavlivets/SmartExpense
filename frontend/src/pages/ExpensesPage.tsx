import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { expensesApi } from '../api/expenses'

const DOC_TYPES = ['', 'receipt', 'taxi', 'invoice', 'utility_bill', 'other']
const DOC_TYPE_LABELS: Record<string, string> = {
  '': 'All',
  receipt: 'Receipt',
  taxi: 'Taxi',
  invoice: 'Invoice',
  utility_bill: 'Utility bill',
  other: 'Other',
}

export default function ExpensesPage() {
  const [vendor, setVendor] = useState('')
  const [docType, setDocType] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    },
  })

  const handleDelete = (id: number) => {
    if (confirm('Delete this record? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <Link
          to="/upload"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Upload
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by vendor..."
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
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : expenses && expenses.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/expenses/${e.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                      {e.vendor ?? 'Untitled'}
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/expenses/${e.id}/edit`)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nothing found.{' '}
            <Link to="/upload" className="text-indigo-600 hover:underline">Upload a receipt</Link>
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
          ← Back
        </button>
        <span className="text-xs text-gray-400">Page {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!expenses || expenses.length < limit}
          className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
