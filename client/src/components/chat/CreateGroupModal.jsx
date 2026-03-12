import React, { useState, useEffect } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import { getChatAvailablePeople, createChatConversation } from '../../services/api'

export default function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState([])
  const [selected, setSelected] = useState([])
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

  const toggle = (user) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const groupName = name.trim() || 'New group'
    if (selected.length === 0) {
      setError('Add at least one member')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await createChatConversation({
        type: 'group_custom',
        subject: groupName,
        participantUserIds: selected.map((u) => u.id),
      })
      const conv = res?.data
      if (conv?.id) {
        onCreated(conv)
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Create group</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Group name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Local farmers"
              className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..."
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
                const isSelected = selected.some((u) => u.id === user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggle(user)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-slate-700/50 text-slate-200'
                    }`}
                  >
                    <UserPlus size={18} />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    {isSelected && <span className="text-emerald-400">Added</span>}
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
              disabled={submitting || selected.length === 0}
              className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
