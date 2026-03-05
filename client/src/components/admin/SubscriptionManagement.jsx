import React, { useState, useEffect } from 'react'
import { CreditCard, RefreshCw, Search, Loader2 } from 'lucide-react'
import { getAdminSubscriptions } from '../../services/api'

const statusColors = {
  active: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-amber-100 text-amber-800',
  expired: 'bg-slate-200 text-slate-700',
  pending_payment: 'bg-sky-100 text-sky-800',
}

const formatDate = (d) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IN', { dateStyle: 'short' })
}

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getAdminSubscriptions({ limit: 300 })
      if (res?.success && Array.isArray(res.subscriptions)) {
        setSubscriptions(res.subscriptions)
      } else {
        setSubscriptions([])
      }
    } catch (err) {
      setError(err?.message || 'Failed to load subscriptions')
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = subscriptions.filter((s) => {
    const matchSearch =
      !search ||
      (s.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.plan || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = subscriptions.filter((s) => s.status === 'active').length
  const pendingCount = subscriptions.filter((s) => s.status === 'pending_payment').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Premium Subscriptions</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{subscriptions.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-700">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium">Pending payment</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-sky-800">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="pending_payment">Pending payment</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.user_name || '—'}</div>
                      <div className="text-sm text-gray-500">{s.user_email || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.plan || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[s.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {s.status?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.started_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.expires_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.amount_paid != null ? `Rs ${s.amount_paid}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SubscriptionManagement
