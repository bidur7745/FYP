import React, { useEffect, useRef, useCallback } from 'react'
import { Send, Paperclip, Smile, MoreVertical, Loader2, WifiOff, ImageIcon, FileText, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MessageBubble from './MessageBubble'
import { useChat } from '../../context/ChatContext'

const EMOJI_GROUPS = [
  { label: 'Smileys', emojis: ['😀','😂','🥹','😊','😍','🤔','😢','😡','👍','👎','🙏','❤️','🔥','🎉','👋'] },
  { label: 'Nature', emojis: ['🌱','🌾','🌻','🌿','🍀','🌳','🍃','🐛','🐝','🦋','☀️','🌧️','💧','🌈','🍂'] },
  { label: 'Food', emojis: ['🍎','🍌','🌽','🍅','🥕','🌶️','🍇','🥬','🍚','🫘','🥭','🍑','🥒','🧅','🍄'] },
]

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const DOC_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const themes = {
  dark: {
    container: 'bg-slate-800/40 border-slate-700/80',
    header: 'bg-slate-900/70 border-b border-slate-700/80',
    avatar: 'bg-slate-800 border-slate-700',
    avatarText: 'text-emerald-300',
    title: 'text-slate-100',
    subtitle: 'text-slate-400',
    detailsBtn: 'text-slate-300 hover:bg-slate-800',
    disconnectBar: 'bg-amber-600/20 border-b border-amber-600/30 text-amber-300',
    msgArea: 'bg-slate-900/60',
    emptyText: 'text-slate-500',
    loadBtn: 'text-slate-400 hover:text-emerald-400',
    inputBar: 'bg-slate-950/80 border-slate-800',
    input: 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-emerald-500 focus:border-emerald-500',
    attachBtn: 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800',
    attachMenu: 'bg-slate-900 border-slate-700',
    attachItem: 'text-slate-200 hover:bg-slate-800',
    emojiBtn: 'hover:bg-slate-800',
    emojiBtnActive: 'text-emerald-400',
    emojiBtnInactive: 'text-slate-300 hover:text-emerald-300',
    emojiPanel: 'bg-slate-900 border-slate-700',
    emojiGroupLabel: 'text-slate-500',
    emojiHover: 'hover:bg-slate-800',
    emptyState: 'bg-slate-800/30 border-slate-700 text-slate-400',
    previewBar: 'bg-slate-900 border-slate-700',
    previewName: 'text-slate-100',
    previewSize: 'text-slate-400',
    previewClose: 'text-slate-400 hover:text-red-400 hover:bg-slate-800',
  },
  light: {
    container: 'bg-white border-slate-200',
    header: 'bg-white border-b border-slate-200',
    avatar: 'bg-emerald-50 border-slate-200',
    avatarText: 'text-emerald-600',
    title: 'text-slate-900',
    subtitle: 'text-slate-500',
    detailsBtn: 'text-slate-500 hover:bg-slate-100',
    disconnectBar: 'bg-amber-50 border-b border-amber-200 text-amber-700',
    msgArea: 'bg-slate-50',
    emptyText: 'text-slate-400',
    loadBtn: 'text-slate-400 hover:text-emerald-600',
    inputBar: 'bg-white border-slate-200',
    input: 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-emerald-500 focus:border-emerald-500',
    attachBtn: 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100',
    attachMenu: 'bg-white border-slate-200 shadow-lg',
    attachItem: 'text-slate-700 hover:bg-slate-50',
    emojiBtn: 'hover:bg-slate-100',
    emojiBtnActive: 'text-emerald-600',
    emojiBtnInactive: 'text-slate-500 hover:text-emerald-600',
    emojiPanel: 'bg-white border-slate-200 shadow-lg',
    emojiGroupLabel: 'text-slate-400',
    emojiHover: 'hover:bg-slate-100',
    emptyState: 'bg-white border-slate-200 text-slate-400',
    previewBar: 'bg-slate-50 border-slate-200',
    previewName: 'text-slate-900',
    previewSize: 'text-slate-500',
    previewClose: 'text-slate-400 hover:text-red-500 hover:bg-slate-100',
  },
}

export default function ChatWindow({ conversation, currentUserId, theme = 'dark' }) {
  const t = themes[theme] || themes.dark
  const { messages, sendMessage, markRead, removeMessage, loadOlderMessages, loadingMore, hasMoreMessages, connected } = useChat()
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState('')
  const [showEmoji, setShowEmoji] = React.useState(false)
  const [showAttach, setShowAttach] = React.useState(false)
  const [pendingFile, setPendingFile] = React.useState(null)
  const [pendingPreview, setPendingPreview] = React.useState(null)
  const bottomRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const imageInputRef = React.useRef(null)
  const docInputRef = React.useRef(null)
  const emojiRef = useRef(null)
  const attachRef = useRef(null)
  const prevMessagesLenRef = useRef(0)
  const prevScrollHeightRef = useRef(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!showEmoji) return
    const h = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showEmoji])

  useEffect(() => {
    if (!showAttach) return
    const h = (e) => { if (attachRef.current && !attachRef.current.contains(e.target)) setShowAttach(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showAttach])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const prevLen = prevMessagesLenRef.current
    const newLen = messages.length
    if (newLen > prevLen && prevLen > 0 && prevScrollHeightRef.current > 0) {
      const addedAtTop = newLen - prevLen
      const wasAtTop = messages[addedAtTop]?.id !== messages[0]?.id
      if (wasAtTop) {
        container.scrollTop = container.scrollHeight - prevScrollHeightRef.current
      } else {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } else if (prevLen === 0 && newLen > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
    }
    prevMessagesLenRef.current = newLen
  }, [messages])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || loadingMore || !hasMoreMessages) return
    if (container.scrollTop < 80) {
      prevScrollHeightRef.current = container.scrollHeight
      loadOlderMessages()
    }
  }, [loadOlderMessages, loadingMore, hasMoreMessages])

  useEffect(() => {
    if (conversation?.id && messages.length) {
      const last = messages[messages.length - 1]
      if (last?.id) markRead(conversation.id, last.id)
    }
  }, [conversation?.id, messages, markRead])

  const clearPending = () => {
    setPendingFile(null)
    setPendingPreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (docInputRef.current) docInputRef.current.value = ''
  }

  const handleFileSelected = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowAttach(false)
    const isImage = file.type.startsWith('image/')
    setPendingFile({ file, type: isImage ? 'image' : 'document' })
    if (isImage) {
      const reader = new FileReader()
      reader.onload = (ev) => setPendingPreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      setPendingPreview(null)
    }
  }

  const handleSendFile = async () => {
    if (!pendingFile || !conversation?.id || uploading) return
    try {
      setUploading(true)
      const isImage = pendingFile.type === 'image'
      setUploadProgress(isImage ? 'Uploading image...' : 'Uploading document...')

      let url, originalName, mimeType, fileSize
      if (isImage) {
        const { uploadImage } = await import('../../services/api')
        const res = await uploadImage(pendingFile.file, 'chat')
        url = res?.url || res?.data?.url
      } else {
        const { uploadFile } = await import('../../services/api')
        const res = await uploadFile(pendingFile.file, 'chat-docs')
        url = res?.url || res?.data?.url
        originalName = res?.originalName
        mimeType = res?.mimeType
        fileSize = res?.size
      }

      if (url) {
        setUploadProgress('Sending...')
        const meta = !isImage ? { fileName: originalName || pendingFile.file.name, mimeType: mimeType || pendingFile.file.type, fileSize: fileSize || pendingFile.file.size } : undefined
        await sendMessage(
          conversation.id,
          isImage ? '' : (originalName || pendingFile.file.name),
          isImage ? 'image' : 'document',
          url,
          meta
        )
      }
    } catch (err) {
      console.error('File upload failed:', err)
    } finally {
      setUploading(false)
      setUploadProgress('')
      clearPending()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (pendingFile) { handleSendFile(); return }
    const text = input.trim()
    if (!text || !conversation?.id || sending || uploading) return
    setSending(true)
    try {
      await sendMessage(conversation.id, text, 'text')
      setInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleOpenDetails = () => {
    if (!conversation?.id) return
    navigate(`/chat/details/${conversation.id}`)
  }

  if (!conversation) {
    return (
      <div className={`flex-1 flex items-center justify-center rounded-xl border ${t.emptyState}`}>
        <p>Select a conversation or start a new one</p>
      </div>
    )
  }

  const title = conversation.title || conversation.subject || (conversation.isGroup ? 'Group' : 'Chat')

  return (
    <div className={`flex flex-col flex-1 min-h-0 rounded-2xl border overflow-hidden ${t.container}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${t.header}`}>
        <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center border overflow-hidden ${t.avatar}`}>
          <span className={`text-sm font-semibold ${t.avatarText}`}>
            {title?.charAt(0)?.toUpperCase() || 'C'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${t.title}`}>{title}</h3>
          <p className={`text-xs ${t.subtitle}`}>
            {conversation.isGroup ? 'Group chat' : conversation.type?.replace(/_/g, ' ')}
          </p>
        </div>
        <button type="button" onClick={handleOpenDetails}
          className={`p-1.5 rounded-full ${t.detailsBtn}`} aria-label="Chat details">
          <MoreVertical size={18} />
        </button>
      </div>

      {!connected && (
        <div className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs ${t.disconnectBar}`}>
          <WifiOff size={14} />
          <span>Connection lost — messages will be sent via fallback</span>
        </div>
      )}

      <div ref={scrollContainerRef} onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-hide ${t.msgArea}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={20} className="animate-spin text-emerald-400" />
          </div>
        )}
        {!loadingMore && hasMoreMessages && (
          <button onClick={() => { prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight || 0; loadOlderMessages() }}
            className={`w-full text-center text-xs py-2 transition-colors ${t.loadBtn}`}>
            Load older messages
          </button>
        )}
        {messages.length === 0 && !loadingMore && (
          <p className={`text-center text-sm py-8 ${t.emptyText}`}>No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg}
            isOwn={Number(msg.senderId) === Number(currentUserId)}
            senderName={msg.senderName} theme={theme}
            onDelete={Number(msg.senderId) === Number(currentUserId) ? removeMessage : undefined} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* File preview bar */}
      {pendingFile && (
        <div className={`flex items-center gap-3 px-4 py-2.5 border-t ${t.previewBar}`}>
          {pendingPreview ? (
            <img src={pendingPreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-slate-600/30" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-emerald-600/15 flex items-center justify-center shrink-0">
              <FileText size={24} className="text-emerald-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${t.previewName}`}>{pendingFile.file.name}</p>
            <p className={`text-xs ${t.previewSize}`}>{formatFileSize(pendingFile.file.size)}</p>
            {uploading && <p className="text-xs text-emerald-500 mt-0.5">{uploadProgress}</p>}
          </div>
          {!uploading && (
            <button type="button" onClick={clearPending}
              className={`p-1.5 rounded-lg ${t.previewClose}`} aria-label="Remove file">
              <X size={18} />
            </button>
          )}
          {uploading && <Loader2 size={20} className="animate-spin text-emerald-500 shrink-0" />}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`px-3 py-2.5 border-t ${t.inputBar}`}>
        <div className="flex items-center gap-2">
          {/* Attach menu */}
          <div className="relative" ref={attachRef}>
            <button type="button" onClick={() => { setShowAttach((v) => !v); setShowEmoji(false) }}
              disabled={uploading}
              className={`p-2 rounded-full disabled:opacity-50 ${showAttach ? 'text-emerald-500' : t.attachBtn}`}
              aria-label="Attach file">
              <Paperclip size={20} />
            </button>
            {showAttach && (
              <div className={`absolute bottom-12 left-0 w-44 rounded-xl border shadow-xl z-50 overflow-hidden ${t.attachMenu}`}>
                <button type="button"
                  onClick={() => { setShowAttach(false); imageInputRef.current?.click() }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${t.attachItem}`}>
                  <ImageIcon size={16} className="text-emerald-500" /> Image
                </button>
                <button type="button"
                  onClick={() => { setShowAttach(false); docInputRef.current?.click() }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-t border-slate-700/20 ${t.attachItem}`}>
                  <FileText size={16} className="text-blue-500" /> Document
                </button>
              </div>
            )}
          </div>

          <input ref={imageInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden"
            onChange={(e) => handleFileSelected(e, 'image')} />
          <input ref={docInputRef} type="file" accept={DOC_ACCEPT} className="hidden"
            onChange={(e) => handleFileSelected(e, 'document')} />

          {!pendingFile ? (
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className={`flex-1 px-4 py-2.5 rounded-full border outline-none focus:ring-2 ${t.input}`}
              disabled={sending || uploading} />
          ) : (
            <div className={`flex-1 px-4 py-2.5 rounded-full border text-sm truncate ${t.input} opacity-60`}>
              {pendingFile.file.name}
            </div>
          )}

          <div className="relative" ref={emojiRef}>
            <button type="button" onClick={() => { setShowEmoji((v) => !v); setShowAttach(false) }}
              className={`p-2 rounded-full ${t.emojiBtn} ${showEmoji ? t.emojiBtnActive : t.emojiBtnInactive}`}
              aria-label="Emoji picker">
              <Smile size={20} />
            </button>
            {showEmoji && (
              <div className={`absolute bottom-12 right-0 w-72 border rounded-xl shadow-xl z-50 p-2 space-y-2 ${t.emojiPanel}`}>
                {EMOJI_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className={`text-[10px] font-medium uppercase tracking-wider px-1 mb-1 ${t.emojiGroupLabel}`}>{group.label}</p>
                    <div className="flex flex-wrap gap-0.5">
                      {group.emojis.map((emoji) => (
                        <button key={emoji} type="button"
                          onClick={() => { setInput((prev) => prev + emoji); setShowEmoji(false) }}
                          className={`w-8 h-8 flex items-center justify-center rounded text-lg ${t.emojiHover}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit"
            disabled={sending || (uploading && !pendingFile) || (!pendingFile && !input.trim())}
            className="p-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Send message">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  )
}
