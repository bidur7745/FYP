import React, { useState, useEffect } from 'react'
import { X, Search, MessageCircle } from 'lucide-react'
import { getChatAvailablePeople, createChatConversation } from '../../services/api'

export default function DirectChatModal({ onClose, onCreated }) {
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getChatAvailablePeople({ search: search.trim() })
      .then((res) => {
        if (!cancelled && res.success && res.data) setPeople(res.data)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search])

  const handleSelect = (user) => {
    setSelected((prev) => (prev && prev.id === user.id ? null : user))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) {
      setError('Select someone to start a chat')
      return
    }

    const currentRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'user'
    let type = 'farmer_farmer'

    if (currentRole === 'user') {
      if (selected.role === 'expert') type = 'farmer_expert'
      else if (selected.role === 'admin') type = 'farmer_admin'
      else type = 'farmer_farmer'
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await createChatConversation({
        type,
        participantUserIds: [selected.id],
      })
      const conv = res?.data
      if (conv?.id) {
        onCreated(conv)
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Failed to start chat')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">New chat</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search farmers, experts, admins..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loading && <p className="text-slate-400 text-sm py-2">Loading...</p>}
            {!loading && people.length === 0 && (
              <p className="text-slate-400 text-sm py-2">No users found</p>
            )}
            {!loading &&
              people.map((user) => {
                const isSelected = selected && selected.id === user.id

                const roleLabel =
                  user.role === 'expert'
                    ? 'Expert'
                    : user.role === 'admin'
                    ? 'Admin'
                    : 'Farmer'

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-slate-700/50 text-slate-200'
                    }`}
                  >
                    <MessageCircle size={18} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{user.name}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 uppercase tracking-wide">
                          {roleLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </button>
                )
              })}
          </div>
          {error && (
            <p className="px-4 pb-2 text-red-400 text-sm">{error}</p>
          )}
          <div className="p-4 border-t border-slate-700 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selected}
              className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? 'Starting…' : 'Start chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

