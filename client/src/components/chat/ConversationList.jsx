import React from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { useChat } from '../../context/ChatContext'

const themeStyles = {
  dark: {
    selected: 'bg-emerald-600/15 border border-emerald-500/40 text-slate-100',
    unselected: 'hover:bg-slate-800/60 text-slate-200 border border-slate-800/40',
    avatar: 'bg-slate-800 border-slate-700',
    name: '',
    preview: 'text-slate-400',
    time: 'text-slate-400',
  },
  light: {
    selected: 'bg-emerald-50 border border-emerald-300 text-slate-900',
    unselected: 'hover:bg-slate-100 text-slate-700 border border-slate-200',
    avatar: 'bg-emerald-50 border-slate-200',
    name: 'text-slate-900',
    preview: 'text-slate-500',
    time: 'text-slate-400',
  },
}

export default function ConversationList({ onSelectConversation, selectedId, theme = 'dark' }) {
  const { conversations, loading } = useChat()
  const t = themeStyles[theme] || themeStyles.dark

  const formatTime = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="space-y-1 flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {conversations.map((c) => {
          const isSelected = Number(c.id) === Number(selectedId)
          const rawPreview =
            c.lastMessage?.contentType === 'text'
              ? c.lastMessage.content
              : c.lastMessage?.contentType === 'image'
                ? '📷 Image'
                : ''
          const lastPreview = rawPreview
            ? rawPreview.slice(0, 40) + (rawPreview.length > 40 ? '…' : '')
            : 'No messages yet'
          const timeLabel = formatTime(c.lastMessageAt || c.updatedAt || c.createdAt)

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectConversation(c)}
              className={`w-full text-left px-3 py-3 rounded-2xl transition-colors ${
                isSelected ? t.selected : t.unselected
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center border overflow-hidden ${t.avatar}`}>
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <MessageCircle
                      size={20}
                      className={c.type === 'krishimitra_global' || c.isGroup ? 'text-emerald-400' : 'text-slate-400'}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium truncate ${t.name}`}>{c.title}</p>
                    {timeLabel && (
                      <span className={`ml-2 text-[11px] shrink-0 ${t.time}`}>
                        {timeLabel}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${t.preview}`}>
                    {lastPreview}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center ml-1">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
