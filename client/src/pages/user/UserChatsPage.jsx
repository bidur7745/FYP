import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, MessageSquare, Users } from 'lucide-react'
import { ChatProvider, useChat } from '../../context/ChatContext'
import ConversationList from '../../components/chat/ConversationList'
import ChatWindow from '../../components/chat/ChatWindow'
import CreateGroupModal from '../../components/chat/CreateGroupModal'
import DirectChatModal from '../../components/chat/DirectChatModal'
import { getUserProfile } from '../../services/api'

function UserChatsContent() {
  const [searchParams] = useSearchParams()
  const conversationIdFromUrl = searchParams.get('conversationId')
  const { selectedId, selectConversation, loadConversations, conversations, createConversation, setConversations } = useChat()
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showDirectChat, setShowDirectChat] = useState(false)

  useEffect(() => {
    getUserProfile(false)
      .then((res) => {
        if (res?.success && res?.data?.user) setCurrentUser(res.data.user)
      })
      .catch(() => {})
  }, [])

  const urlSyncedRef = useRef(false)
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (urlSyncedRef.current || !conversationIdFromUrl || !conversations.length) return
    const id = Number(conversationIdFromUrl)
    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      selectConversation(id)
      setSelectedConversation(conv)
      urlSyncedRef.current = true
      setSearchParams({}, { replace: true })
    }
  }, [conversationIdFromUrl, conversations, selectConversation, setSearchParams])

  const handleSelect = (conv) => {
    selectConversation(conv?.id)
    setSelectedConversation(conv)
  }

  const handleGroupCreated = (conv) => {
    loadConversations()
    handleSelect(conv)
  }

  const handleDirectCreated = (conv) => {
    loadConversations()
    handleSelect(conv)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr] gap-3 h-[calc(100vh-10rem)] min-h-[400px]">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3 flex flex-col min-h-0 overflow-hidden">
            <NewChatMenu
              onNewDM={() => setShowDirectChat(true)}
              onNewGroup={() => setShowCreateGroup(true)}
            />
            <ConversationList
              selectedId={selectedId}
              onSelectConversation={handleSelect}
            />
          </div>
          <div className="flex flex-col min-h-0">
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleGroupCreated}
        />
      )}
      {showDirectChat && (
        <DirectChatModal
          onClose={() => setShowDirectChat(false)}
          onCreated={handleDirectCreated}
        />
      )}
    </div>
  )
}

function NewChatMenu({ onNewDM, onNewGroup }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative mb-2" ref={ref}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">Chats</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors ${open ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'}`}
          aria-label="New conversation"
        >
          <Plus size={18} />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={() => { setOpen(false); onNewDM() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <MessageSquare size={16} className="text-emerald-400" />
            New chat
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onNewGroup() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 transition-colors border-t border-slate-800"
          >
            <Users size={16} className="text-emerald-400" />
            Create group
          </button>
        </div>
      )}
    </div>
  )
}

export default function UserChatsPage() {
  return (
    <ChatProvider>
      <UserChatsContent />
    </ChatProvider>
  )
}
