import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '../api/expenses'

const DOC_TYPES = ['receipt', 'taxi', 'invoice', 'utility_bill', 'other']
const DOC_TYPE_LABELS: Record<string, string> = {
  receipt: 'Receipt',
  taxi: 'Taxi',
  invoice: 'Invoice',
  utility_bill: 'Utility bill',
  other: 'Other',
}

export default function ExpenseEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.get(Number(id)),
  })

  const [vendor, setVendor] = useState('')
  const [date, setDate] = useState('')
  const [documentType, setDocumentType] = useState('receipt')
  const [total, setTotal] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (!expense) return
    setVendor(expense.vendor ?? '')
    setDate(expense.date ?? '')
    setDocumentType(expense.document_type ?? 'receipt')
    setTotal(expense.total != null ? String(expense.total) : '')
    setAddress(expense.address ?? '')
  }, [expense])

  const updateMutation = useMutation({
    mutationFn: () =>
      expensesApi.update(Number(id), {
        vendor: vendor || null,
        date: date || null,
        document_type: documentType || null,
        total: total !== '' ? Number(total) : null,
        address: address || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      navigate(`/expenses/${id}`)
    },
  })

  if (isLoading) return <div className="p-8 text-gray-400">Loading...</div>
  if (!expense) return <div className="p-8 text-gray-400">Not found</div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to={`/expenses/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          updateMutation.mutate()
        }}
        className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-gray-900">Edit expense</h1>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Vendor</label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Total</label>
          <input
            type="number"
            step="0.01"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {updateMutation.isError && (
          <p className="text-red-500 text-sm">Failed to save changes</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
          <Link
            to={`/expenses/${id}`}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
