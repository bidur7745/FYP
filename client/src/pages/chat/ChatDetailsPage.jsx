import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, Image as ImageIcon, UploadCloud, Trash2,
  RefreshCw, Settings, Pencil, Check, X, Archive, Lock, Unlock,
} from 'lucide-react'
import {
  getChatConversation, getChatMessages, updateChatConversation,
  uploadImage, getUserProfile, removeChatMember,
} from '../../services/api'

const chatPaths = {
  admin: '/dashboard/admin/chats',
  expert: '/dashboard/expert/chats',
  user: '/dashboard/user/chats',
}

const themes = {
  dark: {
    page: 'bg-slate-950 text-slate-100',
    backBtn: 'text-emerald-400 hover:text-emerald-300',
    refreshBtn: 'text-slate-400 hover:text-emerald-400',
    card: 'rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6',
    avatar: 'bg-slate-800 border-slate-700',
    avatarText: 'text-emerald-300',
    editInput: 'bg-slate-800 border-slate-600 text-slate-100 focus:ring-emerald-500',
    editCancelBtn: 'bg-slate-700 text-slate-300 hover:bg-slate-600',
    titleText: 'text-slate-100',
    subtitle: 'text-slate-400',
    sectionTitle: 'text-slate-200',
    memberRow: 'bg-slate-800/70',
    memberAvatar: 'bg-slate-700 text-emerald-300',
    memberName: 'text-slate-100',
    memberBadge: 'bg-slate-700/80 text-slate-300',
    memberRemove: 'text-slate-400 hover:text-red-400 hover:bg-slate-700',
    emptyText: 'text-slate-500',
    imgBorder: 'border-slate-700 hover:border-emerald-500',
    settingBtn: 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200',
    settingDesc: 'text-slate-400',
    archiveBtn: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-slate-200',
    flashBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    notFoundBtn: 'bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700',
    confirmBg: 'bg-slate-900 border-slate-700',
    confirmTitle: 'text-slate-100',
    confirmDesc: 'text-slate-400',
    confirmCancel: 'border-slate-600 text-slate-200 hover:bg-slate-800',
    errorText: 'text-red-400',
  },
  light: {
    page: 'bg-gray-50 text-slate-900',
    backBtn: 'text-emerald-600 hover:text-emerald-500',
    refreshBtn: 'text-slate-400 hover:text-emerald-600',
    card: 'rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm',
    avatar: 'bg-emerald-50 border-slate-200',
    avatarText: 'text-emerald-600',
    editInput: 'bg-slate-100 border-slate-300 text-slate-900 focus:ring-emerald-500',
    editCancelBtn: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    titleText: 'text-slate-900',
    subtitle: 'text-slate-500',
    sectionTitle: 'text-slate-700',
    memberRow: 'bg-slate-50',
    memberAvatar: 'bg-emerald-50 text-emerald-600',
    memberName: 'text-slate-800',
    memberBadge: 'bg-slate-200 text-slate-600',
    memberRemove: 'text-slate-400 hover:text-red-500 hover:bg-slate-100',
    emptyText: 'text-slate-400',
    imgBorder: 'border-slate-200 hover:border-emerald-500',
    settingBtn: 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700',
    settingDesc: 'text-slate-500',
    archiveBtn: 'border-red-200 bg-red-50 hover:bg-red-100 text-slate-700',
    flashBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    notFoundBtn: 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50',
    confirmBg: 'bg-white border-slate-200 shadow-lg',
    confirmTitle: 'text-slate-900',
    confirmDesc: 'text-slate-500',
    confirmCancel: 'border-slate-300 text-slate-700 hover:bg-slate-50',
    errorText: 'text-red-500',
  },
}

export default function ChatDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const conversationId = Number(id)

  const [conversation, setConversation] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [confirmState, setConfirmState] = useState(null)
  const [editingSubject, setEditingSubject] = useState(false)
  const [subjectDraft, setSubjectDraft] = useState('')

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'user'
  const useLight = userRole === 'admin' || userRole === 'expert'
  const t = useLight ? themes.light : themes.dark
  const backPath = chatPaths[userRole] || chatPaths.user

  const loadData = useCallback(async (showFullLoader = true) => {
    if (!conversationId) return
    if (showFullLoader) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const [convRes, msgRes, profileRes] = await Promise.all([
        getChatConversation(conversationId),
        getChatMessages(conversationId, { limit: 200 }),
        getUserProfile(false).catch(() => null),
      ])
      if (convRes?.success && convRes?.data) setConversation(convRes.data)
      if (msgRes?.success && Array.isArray(msgRes.data)) {
        setImages(msgRes.data.filter((m) => m.contentType === 'image' && m.attachmentUrl))
      }
      if (profileRes?.success && profileRes?.data?.user) setCurrentUser(profileRes.data.user)
    } catch (err) {
      setError(err.message || 'Failed to load chat details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [conversationId])

  useEffect(() => { loadData(true) }, [loadData])

  useEffect(() => {
    const handleFocus = () => loadData(false)
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadData])

  const isAdmin = currentUser?.role === 'admin'
  const isCreator = conversation?.createdByUserId === currentUser?.id
  const isParticipant = conversation?.participants?.some((p) => p.userId === currentUser?.id)
  const convType = conversation?.type

  const canEdit = (() => {
    if (!conversation || !currentUser) return false
    if (isAdmin) return true
    if (convType === 'krishimitra_global') return false
    if (convType === 'disease_verification') return isParticipant
    if (convType === 'group_custom') return isCreator
    return isParticipant
  })()

  const canChangeStatus = canEdit
  const canDelete = (() => {
    if (!conversation || !currentUser) return false
    if (isAdmin) return true
    if (convType === 'disease_verification') return isParticipant
    if (convType === 'group_custom') return isCreator
    return false
  })()

  const canManageMembers = (() => {
    if (!conversation || !currentUser) return false
    if (isAdmin) return true
    if (convType === 'krishimitra_global') return false
    if (convType === 'group_custom') return isCreator
    return false
  })()

  const showFlash = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !conversationId || !canEdit) return
    try {
      setSaving(true)
      setError('')
      const res = await uploadImage(file, 'chat-avatars')
      const url = res?.data?.url || res?.url
      if (!url) { setError('Upload failed'); return }
      const updateRes = await updateChatConversation(conversationId, { avatarUrl: url })
      if (updateRes?.success && updateRes?.data) {
        setConversation(updateRes.data)
        showFlash('Avatar updated')
      } else {
        setError(updateRes?.message || 'Failed to update avatar')
      }
    } catch (err) {
      setError(err.message || 'Failed to update avatar')
    } finally {
      setSaving(false)
      event.target.value = ''
    }
  }

  const handleSaveSubject = async () => {
    if (!subjectDraft.trim() || !canEdit) return
    try {
      setSaving(true)
      setError('')
      const res = await updateChatConversation(conversationId, { subject: subjectDraft.trim() })
      if (res?.success && res?.data) {
        setConversation(res.data)
        setEditingSubject(false)
        showFlash('Name updated')
      } else {
        setError(res?.message || 'Failed to update name')
      }
    } catch (err) {
      setError(err.message || 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setSaving(true)
      setError('')
      const res = await updateChatConversation(conversationId, { status: newStatus })
      if (res?.success && res?.data) {
        setConversation(res.data)
        showFlash(`Conversation ${newStatus === 'closed' ? 'closed' : 'reopened'}`)
      } else {
        setError(res?.message || 'Failed to update status')
      }
    } catch (err) {
      setError(err.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const openConfirm = (type, payload = {}) => setConfirmState({ type, payload })
  const closeConfirm = () => setConfirmState(null)

  const handleConfirm = async () => {
    try {
      if (confirmState.type === 'remove-member' && confirmState.payload?.participant) {
        const p = confirmState.payload.participant
        const res = await removeChatMember(conversationId, p.userId)
        if (res?.success && res?.data) {
          setConversation(res.data)
          showFlash(`${p.name || 'Member'} removed`)
        }
      } else if (confirmState.type === 'archive') {
        const res = await updateChatConversation(conversationId, { status: 'archived' })
        if (res?.success) {
          navigate(backPath)
          return
        }
      }
    } catch (err) {
      setError(err.message || 'Operation failed')
    } finally {
      closeConfirm()
    }
  }

  const goBack = () => navigate(backPath)

  const title = conversation?.subject || (conversation?.isGroup ? 'Group' : 'Chat')
  const statusLabel = conversation?.status === 'open' ? 'Open' : conversation?.status === 'closed' ? 'Closed' : 'Archived'
  const statusColor = conversation?.status === 'open' ? 'text-emerald-400' : conversation?.status === 'closed' ? 'text-amber-400' : 'text-red-400'

  if (loading) {
    return (
      <div className={`min-h-screen pt-24 pb-16 px-4 flex items-center justify-center ${t.page}`}>
        <p className={t.subtitle}>Loading chat details...</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className={`min-h-screen pt-24 pb-16 px-4 flex items-center justify-center ${t.page}`}>
        <div className="text-center">
          <p className={`${t.subtitle} mb-4`}>Chat not found.</p>
          <button type="button" onClick={goBack}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${t.notFoundBtn}`}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pt-24 pb-16 px-4 ${t.page}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={goBack}
            className={`inline-flex items-center gap-2 text-sm font-medium ${t.backBtn}`}>
            <ArrowLeft className="w-4 h-4" /> Back to chat
          </button>
          <button type="button" onClick={() => loadData(false)} disabled={refreshing}
            className={`inline-flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 ${t.refreshBtn}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {successMsg && (
          <div className={`mb-4 px-4 py-2 rounded-lg border text-sm ${t.flashBg}`}>
            {successMsg}
          </div>
        )}

        <div className={t.card}>
          {error && <p className={`text-sm ${t.errorText}`}>{error}</p>}

          {/* Header: Avatar + Title + Status */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center border overflow-hidden ${t.avatar}`}>
                {conversation.avatarUrl ? (
                  <img src={conversation.avatarUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className={`text-xl font-semibold ${t.avatarText}`}>
                    {title?.charAt(0)?.toUpperCase() || 'C'}
                  </span>
                )}
              </div>
              {canEdit && (
                <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white cursor-pointer border-2 border-white hover:bg-emerald-500 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={saving} />
                </label>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editingSubject ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subjectDraft}
                    onChange={(e) => setSubjectDraft(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-sm focus:ring-2 outline-none ${t.editInput}`}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSubject(); if (e.key === 'Escape') setEditingSubject(false) }}
                  />
                  <button type="button" onClick={handleSaveSubject} disabled={saving || !subjectDraft.trim()}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setEditingSubject(false)}
                    className={`p-1.5 rounded-lg ${t.editCancelBtn}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl font-bold truncate ${t.titleText}`}>{title}</h1>
                  {canEdit && (
                    <button type="button" onClick={() => { setSubjectDraft(conversation.subject || ''); setEditingSubject(true) }}
                      className={`p-1 rounded transition-colors ${t.refreshBtn}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 mt-1">
                <p className={`text-xs ${t.subtitle}`}>
                  {convType === 'disease_verification' ? 'Disease verification' : convType === 'krishimitra_global' ? 'Global discussion' : conversation.isGroup ? 'Group chat' : convType?.replace(/_/g, ' ')}
                </p>
                <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
              </div>
            </div>
          </div>

          {/* Members */}
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${t.sectionTitle}`}>
              <Users className="w-4 h-4" /> Members
            </h2>
            {conversation.participants && conversation.participants.length > 0 ? (
              <ul className="space-y-2">
                {conversation.participants.map((p) => {
                  const isSelf = currentUser && p.userId === currentUser.id
                  const isAdminMember = (p.roleSnapshot || p.role) === 'admin'
                  const canRemoveThis = canManageMembers && !isSelf && !isAdminMember

                  return (
                    <li key={p.userId} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${t.memberRow}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${t.memberAvatar}`}>
                          {p.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className={t.memberName}>{p.name}{isSelf ? ' (You)' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.memberBadge}`}>
                          {p.roleSnapshot || p.role}
                        </span>
                        {canRemoveThis && (
                          <button type="button" onClick={() => openConfirm('remove-member', { participant: p })}
                            className={`p-1 rounded-full ${t.memberRemove}`} title="Remove member">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className={`text-xs ${t.emptyText}`}>No members information.</p>
            )}
          </div>

          {/* Shared Images */}
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${t.sectionTitle}`}>
              <ImageIcon className="w-4 h-4" /> Shared images
            </h2>
            {images.length === 0 ? (
              <p className={`text-xs ${t.emptyText}`}>No shared images yet.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {images.map((img) => (
                  <a key={img.id} href={img.attachmentUrl} target="_blank" rel="noopener noreferrer"
                    className={`block rounded-lg overflow-hidden border transition-colors ${t.imgBorder}`}>
                    <img src={img.attachmentUrl} alt={img.content || 'Shared image'} className="w-full h-20 object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          {(canChangeStatus || canDelete) && (
            <div>
              <h2 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${t.sectionTitle}`}>
                <Settings className="w-4 h-4" /> Settings
              </h2>
              <div className="space-y-2">
                {canChangeStatus && conversation.status === 'open' && (
                  <button type="button" onClick={() => handleStatusChange('closed')} disabled={saving}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm disabled:opacity-50 transition-colors ${t.settingBtn}`}>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <div className="text-left">
                      <p className="font-medium">Close conversation</p>
                      <p className={`text-xs ${t.settingDesc}`}>Mark as resolved. No new messages can be sent.</p>
                    </div>
                  </button>
                )}
                {canChangeStatus && conversation.status === 'closed' && (
                  <button type="button" onClick={() => handleStatusChange('open')} disabled={saving}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm disabled:opacity-50 transition-colors ${t.settingBtn}`}>
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                      <p className="font-medium">Reopen conversation</p>
                      <p className={`text-xs ${t.settingDesc}`}>Allow sending messages again.</p>
                    </div>
                  </button>
                )}
                {canDelete && conversation.status !== 'archived' && (
                  <button type="button" onClick={() => openConfirm('archive')} disabled={saving}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm disabled:opacity-50 transition-colors ${t.archiveBtn}`}>
                    <Archive className="w-4 h-4 text-red-400" />
                    <div className="text-left">
                      <p className="font-medium text-red-400">Archive conversation</p>
                      <p className={`text-xs ${t.settingDesc}`}>Permanently archive for all participants.</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {confirmState && (
          <ConfirmModal
            mode={confirmState.type}
            participant={confirmState.payload?.participant}
            onCancel={closeConfirm}
            onConfirm={handleConfirm}
            theme={t}
          />
        )}
      </div>
    </div>
  )
}

function ConfirmModal({ mode, participant, onCancel, onConfirm, theme: t }) {
  const config = {
    'remove-member': {
      title: 'Remove member',
      description: `Remove ${participant?.name || 'this member'} from this chat?`,
      confirmLabel: 'Remove',
    },
    'archive': {
      title: 'Archive conversation',
      description: 'Are you sure? This will archive the conversation for all participants and cannot be undone.',
      confirmLabel: 'Archive',
    },
  }
  const { title, description, confirmLabel } = config[mode] || { title: 'Confirm', description: 'Are you sure?', confirmLabel: 'Confirm' }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className={`rounded-xl border max-w-sm w-full p-5 space-y-4 ${t.confirmBg}`}>
        <h3 className={`text-sm font-semibold ${t.confirmTitle}`}>{title}</h3>
        <p className={`text-xs ${t.confirmDesc}`}>{description}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel}
            className={`px-3 py-1.5 text-xs rounded-lg border ${t.confirmCancel}`}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-500">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
