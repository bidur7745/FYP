import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, Users } from 'lucide-react'
import { ChatProvider, useChat } from '../../context/ChatContext'
import ConversationList from '../../components/chat/ConversationList'
import ChatWindow from '../../components/chat/ChatWindow'
import DirectChatModal from '../../components/chat/DirectChatModal'
import CreateGroupModal from '../../components/chat/CreateGroupModal'
import { getUserProfile } from '../../services/api'

function AdminChatsContent() {
  const navigate = useNavigate()
  const { selectedId, selectConversation, loadConversations } = useChat()
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showDirectChat, setShowDirectChat] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  useEffect(() => {
    getUserProfile(false)
      .then((res) => {
        if (res?.success && res?.data?.user) setCurrentUser(res.data.user)
      })
      .catch(() => {})
  }, [])

  const handleSelect = (conv) => {
    selectConversation(conv?.id)
    setSelectedConversation(conv)
  }

  const handleCreated = (conv) => {
    loadConversations()
    handleSelect(conv)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-4 px-4">
      <div className="max-w-[1400px] mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-500 text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr] gap-3 h-[calc(100vh-11rem)] min-h-[400px]">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col min-h-0 overflow-hidden shadow-sm">
            <NewChatMenu
              onNewDM={() => setShowDirectChat(true)}
              onNewGroup={() => setShowCreateGroup(true)}
            />
            <ConversationList
              selectedId={selectedId}
              onSelectConversation={handleSelect}
              theme="light"
            />
          </div>
          <div className="flex flex-col min-h-0">
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={currentUser?.id}
              theme="light"
            />
          </div>
        </div>
      </div>

      {showDirectChat && (
        <DirectChatModal onClose={() => setShowDirectChat(false)} onCreated={handleCreated} />
      )}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreated={handleCreated} />
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
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider pl-1">Chats</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors ${open ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'}`}
          aria-label="New conversation"
        >
          <Plus size={18} />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-48 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          <button type="button" onClick={() => { setOpen(false); onNewDM() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <MessageSquare size={16} className="text-emerald-500" /> New chat
          </button>
          <button type="button" onClick={() => { setOpen(false); onNewGroup() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100">
            <Users size={16} className="text-emerald-500" /> Create group
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminChatsPage() {
  return (
    <ChatProvider>
      <AdminChatsContent />
    </ChatProvider>
  )
}
