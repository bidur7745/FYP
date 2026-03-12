import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import {
  getChatConversations,
  getChatConversation,
  getChatMessages,
  sendChatMessage as apiSendMessage,
  markChatRead as apiMarkRead,
  createChatConversation as apiCreateConversation,
  deleteChatMessage as apiDeleteMessage,
} from '../services/api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002'

const ChatContext = createContext(null)

const MESSAGES_PER_PAGE = 50
const CONV_CACHE_KEY = 'chat_conversations_cache'
const CONV_CACHE_TS_KEY = 'chat_conversations_ts'
const CONV_CACHE_TTL = 5 * 60 * 1000 // 5 min staleness threshold

function readConvCache() {
  try {
    const raw = sessionStorage.getItem(CONV_CACHE_KEY)
    if (!raw) return null
    const ts = Number(sessionStorage.getItem(CONV_CACHE_TS_KEY) || 0)
    return { data: JSON.parse(raw), ts }
  } catch { return null }
}

function writeConvCache(data) {
  try {
    sessionStorage.setItem(CONV_CACHE_KEY, JSON.stringify(data))
    sessionStorage.setItem(CONV_CACHE_TS_KEY, String(Date.now()))
  } catch { /* quota exceeded — ignore */ }
}

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(() => {
    const cached = readConvCache()
    return cached?.data || []
  })
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  const selectedIdRef = useRef(selectedId)
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  useEffect(() => {
    if (!token) return
    const sock = io(API_BASE, {
      auth: { token },
      path: '/socket.io',
    })
    sock.on('connect', () => setConnected(true))
    sock.on('disconnect', () => setConnected(false))
    sock.on('chat:message', (msg) => {
      if (msg && Number(msg.conversationId) === Number(selectedIdRef.current)) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      }
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === msg.conversationId ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt } : c
        )
        writeConvCache(updated)
        return updated
      })
    })
    sock.on('chat:message_deleted', ({ conversationId, messageId }) => {
      if (Number(conversationId) === Number(selectedIdRef.current)) {
        setMessages((prev) => prev.map((m) =>
          m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: '', attachmentUrl: null } : m
        ))
      }
    })
    setSocket(sock)
    return () => sock.close()
  }, [token])

  const loadConversations = useCallback(async () => {
    const cached = readConvCache()
    const isFresh = cached && (Date.now() - cached.ts < CONV_CACHE_TTL)

    if (isFresh && cached.data.length > 0) {
      setConversations(cached.data)
      setLoading(false)
      getChatConversations().then((res) => {
        if (res.success && res.data) {
          setConversations(res.data)
          writeConvCache(res.data)
        }
      }).catch(() => {})
      return
    }

    try {
      setLoading(true)
      const res = await getChatConversations()
      if (res.success && res.data) {
        setConversations(res.data)
        writeConvCache(res.data)
      }
    } catch (e) {
      console.error('loadConversations', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadConversation = useCallback(async (id) => {
    try {
      const res = await getChatConversation(id)
      if (res.success && res.data) return res.data
    } catch (e) {
      console.error('loadConversation', e)
    }
    return null
  }, [])

  const loadMessages = useCallback(async (conversationId, params = {}) => {
    try {
      const res = await getChatMessages(conversationId, params)
      if (res.success && res.data) return res.data
    } catch (e) {
      console.error('loadMessages', e)
    }
    return []
  }, [])

  const sendMessage = useCallback(
    async (conversationId, content, contentType = 'text', attachmentUrl, meta) => {
      if (socket && socket.connected) {
        return new Promise((resolve, reject) => {
          socket.emit(
            'chat:send',
            { conversationId, content, contentType, attachmentUrl, meta },
            (ack) => {
              if (ack?.success && ack?.data) {
                setMessages((prev) => (prev.some((m) => m.id === ack.data.id) ? prev : [...prev, ack.data]))
                resolve(ack.data)
              } else reject(new Error(ack?.message || 'Send failed'))
            }
          )
        })
      }
      const res = await apiSendMessage(conversationId, { content, contentType, attachmentUrl, meta })
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data])
        return res.data
      }
      throw new Error(res.message || 'Send failed')
    },
    [socket]
  )

  const markRead = useCallback(async (conversationId, messageId) => {
    try {
      await apiMarkRead(conversationId, messageId)
    } catch (e) {
      console.error('markRead', e)
    }
  }, [])

  const removeMessage = useCallback(
    async (conversationId, messageId) => {
      if (socket && socket.connected) {
        return new Promise((resolve, reject) => {
          socket.emit('chat:delete', { conversationId, messageId }, (ack) => {
            if (ack?.success) {
              setMessages((prev) => prev.map((m) =>
                m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: '', attachmentUrl: null } : m
              ))
              resolve()
            } else reject(new Error(ack?.message || 'Delete failed'))
          })
        })
      }
      const res = await apiDeleteMessage(conversationId, messageId)
      if (res.success) {
        setMessages((prev) => prev.map((m) =>
          m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: '', attachmentUrl: null } : m
        ))
        return
      }
      throw new Error(res.message || 'Delete failed')
    },
    [socket]
  )

  const createConversation = useCallback(async (payload) => {
    const res = await apiCreateConversation(payload)
    if (res.success && res.data) {
      setConversations((prev) => {
        const updated = [res.data, ...prev.filter((c) => c.id !== res.data.id)]
        writeConvCache(updated)
        return updated
      })
      return res.data
    }
    throw new Error(res.message || 'Create failed')
  }, [])

  const selectConversation = useCallback(async (id) => {
    setSelectedId(id)
    setHasMoreMessages(false)
    if (!id) {
      setMessages([])
      return
    }
    try {
      const list = await getChatMessages(id, { limit: MESSAGES_PER_PAGE })
      if (list.success && list.data) {
        setMessages(list.data)
        setHasMoreMessages(list.data.length >= MESSAGES_PER_PAGE)
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    }
  }, [])

  const loadOlderMessages = useCallback(async () => {
    if (!selectedIdRef.current || loadingMore || !hasMoreMessages) return
    const oldest = messages[0]
    if (!oldest) return
    setLoadingMore(true)
    try {
      const res = await getChatMessages(selectedIdRef.current, {
        before: oldest.id,
        limit: MESSAGES_PER_PAGE,
      })
      if (res.success && res.data && res.data.length > 0) {
        setMessages((prev) => [...res.data, ...prev])
        setHasMoreMessages(res.data.length >= MESSAGES_PER_PAGE)
      } else {
        setHasMoreMessages(false)
      }
    } catch (e) {
      console.error('loadOlderMessages', e)
    } finally {
      setLoadingMore(false)
    }
  }, [messages, loadingMore, hasMoreMessages])

  useEffect(() => {
    if (token) loadConversations()
  }, [token, loadConversations])

  const value = {
    conversations,
    selectedId,
    messages,
    loading,
    loadingMore,
    hasMoreMessages,
    socket,
    connected,
    loadConversations,
    loadConversation,
    loadMessages,
    sendMessage,
    markRead,
    removeMessage,
    createConversation,
    selectConversation,
    loadOlderMessages,
    setConversations,
    setMessages,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
