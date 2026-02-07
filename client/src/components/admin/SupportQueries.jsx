import React, { useState, useEffect } from 'react'
import { getSupportQueriesList, replySupportQuery } from '../../services/api'
import { Loader2, MessageSquare, Mail, Send, X, User, Calendar } from 'lucide-react'

const SupportQueries = () => {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '' = all, 'open', 'answered'
  const [replyingId, setReplyingId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState('')

  const loadQueries = async () => {
    try {
      setLoading(true)
      setError('')
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await getSupportQueriesList(params)
      if (res.success && Array.isArray(res.queries)) {
        setQueries(res.queries)
      } else {
        setQueries([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load queries')
      setQueries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueries()
  }, [statusFilter])

  const handleReply = async () => {
    if (!replyingId || !replyText.trim()) {
      setReplyError('Please enter a reply.')
      return
    }
    setReplyError('')
    try {
      await replySupportQuery(replyingId, replyText.trim())
      setReplyingId(null)
      setReplyText('')
      await loadQueries()
    } catch (err) {
      setReplyError(err.message || 'Failed to send reply')
    }
  }

  const openReplyModal = (q) => {
    setReplyingId(q.id)
    setReplyText('')
    setReplyError('')
  }

  const formatDate = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-emerald-600" />
          Support Queries
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="answered">Answered</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No support queries found.
                </td>
              </tr>
            ) : (
              queries.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{q.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {q.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm text-gray-700 truncate" title={q.message}>
                      {q.message}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        q.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(q.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {q.status === 'open' ? (
                      <button
                        onClick={() => openReplyModal(q)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                      >
                        <Send className="h-4 w-4" /> Reply
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">Replied</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reply modal */}
      {replyingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reply to query</h3>
              <button
                onClick={() => { setReplyingId(null); setReplyText(''); setReplyError(''); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {(() => {
                const q = queries.find((x) => x.id === replyingId)
                if (!q) return null
                return (
                  <>
                    <p className="text-sm text-gray-600 mb-2"><strong>From:</strong> {q.name} &lt;{q.email}&gt;</p>
                    <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{q.message}</p>
                  </>
                )
              })()}
              <label className="block text-sm font-medium text-gray-700 mb-1">Your reply</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Type your reply here. The user will receive this by email."
              />
              {replyError && (
                <p className="mt-2 text-sm text-red-600">{replyError}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setReplyingId(null); setReplyText(''); setReplyError(''); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" /> Send reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportQueries
