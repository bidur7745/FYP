import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Mail, Calendar, ChevronDown, Loader2 } from 'lucide-react'
import { getMySupportQueries } from '../../services/api'

const MyQueriesCard = () => {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMySupportQueries()
        if (res.success && Array.isArray(res.queries)) {
          setQueries(res.queries)
        }
      } catch (_) {
        setQueries([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-emerald-500" size={24} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
          My Queries
        </h2>
        <Link
          to="/support"
          className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Contact Support
        </Link>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {queries.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            You haven&apos;t submitted any support queries yet.
          </p>
        ) : (
          queries.map((q) => (
            <div
              key={q.id}
              className="rounded-lg border border-slate-700 bg-slate-700/30 overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-slate-200 text-sm font-medium truncate flex-1 mr-2">
                  {q.message.slice(0, 50)}{q.message.length > 50 ? '…' : ''}
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                    q.status === 'answered'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {q.status}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                    expandedId === q.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedId === q.id && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-700 space-y-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1 pt-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(q.createdAt)}
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{q.message}</p>
                  {q.status === 'answered' && q.adminReply && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-300 mb-1">Reply from support</p>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{q.adminReply}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyQueriesCard
