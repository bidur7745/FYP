import React, { useState, useRef, useEffect } from 'react'
import { CheckCheck, FileText, Download, Trash2, Ban } from 'lucide-react'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType) {
  if (!mimeType) return 'document'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xls'
  if (mimeType === 'text/plain') return 'txt'
  return 'document'
}

const FILE_COLORS = {
  pdf: 'bg-red-500/15 text-red-500',
  doc: 'bg-blue-500/15 text-blue-500',
  xls: 'bg-green-500/15 text-green-500',
  txt: 'bg-slate-500/15 text-slate-500',
  document: 'bg-slate-500/15 text-slate-500',
}

function getDownloadUrl(url, fileName) {
  if (!url || !fileName) return url
  try {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      const safe = encodeURIComponent(fileName).replace(/%20/g, '_')
      return `${parts[0]}/upload/fl_attachment:${safe}/${parts[1]}`
    }
  } catch { /* fallback */ }
  return url
}

export default function MessageBubble({ message, isOwn, senderName, theme = 'dark', onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!showMenu) return
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) { setShowMenu(false); setConfirming(false) } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showMenu])

  if (!message) return null
  const isSystem = message.contentType === 'system'
  const isDeleted = !!message.deletedAt
  const isLight = theme === 'light'

  const timeLabel = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : ''

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className={`text-xs px-3 py-1 rounded-full max-w-[85%] text-center ${
          isLight ? 'text-slate-500 bg-slate-200/60' : 'text-slate-500 bg-slate-700/50'
        }`}>
          {message.content}
        </span>
      </div>
    )
  }

  if (isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
          isOwn
            ? 'bg-emerald-600/40 rounded-br-sm'
            : isLight ? 'bg-slate-100 rounded-bl-sm border border-slate-200' : 'bg-slate-800/40 rounded-bl-sm'
        }`}>
          {!isOwn && senderName && (
            <p className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-300'}`}>{senderName}</p>
          )}
          <div className="flex items-center gap-1.5">
            <Ban size={14} className={isOwn ? 'text-emerald-200/70' : isLight ? 'text-slate-400' : 'text-slate-500'} />
            <p className={`text-sm italic ${isOwn ? 'text-emerald-100/70' : isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              This message was deleted
            </p>
          </div>
          <div className="mt-1 flex items-center justify-end">
            <span className={`text-[10px] ${isOwn ? 'text-emerald-200/50' : isLight ? 'text-slate-300' : 'text-slate-600'}`}>
              {timeLabel}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const isImage = message.contentType === 'image' && message.attachmentUrl
  const isDocument = message.contentType === 'document' && message.attachmentUrl

  const bubbleClasses = isOwn
    ? 'bg-emerald-600 text-white rounded-br-sm'
    : isLight
      ? 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
      : 'bg-slate-800 text-slate-100 rounded-bl-sm'

  const senderColor = isLight ? 'text-emerald-600' : 'text-emerald-300'
  const timeColor = isOwn ? 'text-emerald-100' : isLight ? 'text-slate-400' : 'text-slate-400'

  const meta = message.meta || {}
  const fileType = getFileIcon(meta.mimeType)
  const fileColor = FILE_COLORS[fileType] || FILE_COLORS.document

  const handleDelete = () => {
    if (!confirming) { setConfirming(true); return }
    onDelete?.(message.conversationId, message.id)
    setShowMenu(false)
    setConfirming(false)
  }

  return (
    <div className={`group relative flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${bubbleClasses} shadow-sm`}>
        {!isOwn && senderName && (
          <p className={`text-[11px] font-semibold mb-0.5 ${senderColor}`}>{senderName}</p>
        )}

        {isImage && (
          <div className="mb-1">
            <img src={message.attachmentUrl} alt={message.content || 'Image'}
              className="rounded-xl max-h-64 object-cover" loading="lazy" />
            {message.content && (
              <p className="mt-1 text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        )}

        {isDocument && (
          <a href={getDownloadUrl(message.attachmentUrl, meta.fileName)} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-3 p-2.5 rounded-xl mb-1 transition-colors ${
              isOwn ? 'bg-emerald-700/50 hover:bg-emerald-700/70' : isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-slate-700/50 hover:bg-slate-700/70'
            }`}>
            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${fileColor}`}>
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{meta.fileName || message.content || 'Document'}</p>
              {meta.fileSize && (
                <p className={`text-[11px] ${isOwn ? 'text-emerald-200' : isLight ? 'text-slate-400' : 'text-slate-400'}`}>
                  {formatFileSize(meta.fileSize)} &middot; {fileType.toUpperCase()}
                </p>
              )}
            </div>
            <Download size={16} className={`shrink-0 ${isOwn ? 'text-emerald-200' : isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          </a>
        )}

        {!isImage && !isDocument && message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {!isImage && !isDocument && !message.content && message.attachmentUrl && (
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer"
            className="block text-xs underline">View attachment</a>
        )}

        <div className="mt-1 flex items-center justify-end gap-1">
          <span className={`text-[10px] ${timeColor}`}>{timeLabel}</span>
          {isOwn && <CheckCheck className="w-3 h-3 text-emerald-100" />}
        </div>
      </div>

      {/* Delete button — appears on hover for own messages */}
      {isOwn && onDelete && (
        <div className="relative flex items-center" ref={menuRef}>
          <button type="button"
            onClick={() => { setShowMenu((v) => !v); setConfirming(false) }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full mr-1 ${
              isLight ? 'text-slate-400 hover:text-red-500 hover:bg-slate-100' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
            }`}
            aria-label="Message options">
            <Trash2 size={14} />
          </button>
          {showMenu && (
            <div className={`absolute right-0 top-full mt-1 z-50 rounded-lg border shadow-lg overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
            }`}>
              <button type="button" onClick={handleDelete}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                  confirming
                    ? 'bg-red-600 text-white'
                    : isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-slate-800'
                }`}>
                <Trash2 size={14} />
                {confirming ? 'Confirm delete' : 'Delete message'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
