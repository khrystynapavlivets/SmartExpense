import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { expensesApi, type Expense } from '../api/expenses'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const DOC_TYPE_LABELS: Record<string, string> = {
  receipt: 'Receipt',
  taxi: 'Taxi',
  invoice: 'Invoice',
  utility_bill: 'Utility bill',
  other: 'Other',
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#6b7280']

type DateRange = 'week' | 'month' | 'year' | 'all'

const RANGE_LABELS: Record<DateRange, string> = {
  week: 'This week',
  month: 'This month',
  year: 'This year',
  all: 'All',
}

const formatCurrency = (n: number) => `$${n.toFixed(2)}`

function isInDateRange(createdAt: string, range: DateRange): boolean {
  if (range === 'all') return true
  const d = new Date(createdAt)
  const now = new Date()
  if (range === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  }
  if (range === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }
  return d.getFullYear() === now.getFullYear()
}

function groupByCategory(expenses: Expense[]) {
  const map = new Map<string | null, { count: number; total: number }>()
  for (const e of expenses) {
    const entry = map.get(e.document_type) ?? { count: 0, total: 0 }
    entry.count += 1
    entry.total += e.total ?? 0
    map.set(e.document_type, entry)
  }
  return Array.from(map.entries()).map(([document_type, v]) => ({ document_type, ...v }))
}

function computeMonthlyData(expenses: Expense[]) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }), total: 0 }
  })
  const byKey = new Map(months.map((m) => [m.key, m]))
  for (const e of expenses) {
    if (e.total == null) continue
    const d = new Date(e.created_at)
    const m = byKey.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (m) m.total += e.total
  }
  return months
}

export default function DashboardPage() {
  const [vendorQuery, setVendorQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: expensesApi.summary,
  })

  const { data: allExpenses } = useQuery({
    queryKey: ['expenses', 'all'],
    queryFn: () => expensesApi.list({ limit: 1000 }),
  })

  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading...</div>
  }

  const expenses = allExpenses ?? []
  const inRange = expenses.filter((e) => isInDateRange(e.created_at, dateRange))
  const filteredTotalAmount = inRange.reduce((sum, e) => sum + (e.total ?? 0), 0)

  const categories = groupByCategory(inRange)
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((cat, i) => ({
      ...cat,
      label: DOC_TYPE_LABELS[cat.document_type ?? ''] ?? cat.document_type ?? 'Unknown',
      color: PIE_COLORS[i % PIE_COLORS.length],
      percent: filteredTotalAmount > 0 ? (cat.total / filteredTotalAmount) * 100 : 0,
    }))

  const pieData = categories.map((cat) => ({ name: cat.label, value: cat.total }))
  const monthlyData = computeMonthlyData(expenses)

  const hasExtraFilter = Boolean(vendorQuery || selectedCategory)
  const recent = inRange
    .filter((e) => !vendorQuery || (e.vendor ?? '').toLowerCase().includes(vendorQuery.toLowerCase()))
    .filter((e) => !selectedCategory || e.document_type === selectedCategory)
    .slice(0, hasExtraFilter ? 10 : 5)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0">💰</div>
          <div>
            <p className="text-sm text-gray-500">Total expenses</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-1">
              {summary ? formatCurrency(summary.total_amount) : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">📄</div>
          <div>
            <p className="text-sm text-gray-500">Documents</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-1">{summary?.total_count ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* By category */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="text-base font-bold text-gray-900">By category</h2>
            <div className="flex items-center gap-1.5">
              {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    dateRange === r
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-stretch gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 lg:w-1/2">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full max-w-xs divide-y divide-gray-100">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.document_type
                  return (
                    <button
                      key={cat.document_type ?? 'unknown'}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? null : cat.document_type)}
                      className={`w-full text-left py-3 px-2 -mx-2 first:mt-0 rounded-lg transition-colors ${
                        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm font-medium text-gray-800">{cat.label}</span>
                          <span className="text-xs text-gray-400">({cat.count})</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(cat.total)} <span className="text-gray-400 font-normal">({cat.percent.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-1 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(cat.percent, 100)}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <p className="text-xs font-medium text-gray-500 mb-2">Spending by month</p>
              <div className="flex-1 min-h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="total" fill={PIE_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent expenses */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {selectedCategory
                ? `${DOC_TYPE_LABELS[selectedCategory] ?? selectedCategory} records`
                : vendorQuery
                ? 'Search results'
                : 'Recent records'}
            </h2>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Search by vendor..."
            value={vendorQuery}
            onChange={(e) => setVendorQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 max-w-xs"
          />
          <Link to="/expenses" className="text-xs text-indigo-600 hover:underline whitespace-nowrap">All</Link>
        </div>
        {recent.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recent.map((e) => (
              <Link
                key={e.id}
                to={`/expenses/${e.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.vendor ?? 'Untitled'}</p>
                  <p className="text-xs text-gray-400">{e.date ?? e.created_at.slice(0, 10)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {e.total != null ? formatCurrency(e.total) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {DOC_TYPE_LABELS[e.document_type ?? ''] ?? e.document_type ?? ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No records yet. <Link to="/upload" className="text-indigo-600 hover:underline">Upload your first receipt</Link></p>
        )}
      </div>
    </div>
  )
}
