import React, { useState, useEffect } from 'react'
import { getUserProfile } from '../../services/api'
import { Loader2 } from 'lucide-react'
import ExpertProfileGate from '../../components/expert/ExpertProfileGate'
import { ChatProvider, useChat } from '../../context/ChatContext'
import ConversationList from '../../components/chat/ConversationList'
import ChatWindow from '../../components/chat/ChatWindow'

const isProfileComplete = (profile) => {
  const userDetails = profile?.userDetails || null
  const hasLicense = !!userDetails?.licenseImage
  const hasBasicExpertInfo = !!(
    userDetails?.skills?.trim() ||
    userDetails?.education?.trim() ||
    (userDetails?.yearsOfExperience != null && userDetails?.yearsOfExperience !== '')
  )
  return hasLicense && hasBasicExpertInfo
}

function ExpertChatsContent() {
  const { selectedId, selectConversation, conversations } = useChat()
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)

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

  return (
    <div className="max-w-[1400px] mx-auto px-3 lg:px-6 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr] gap-3 h-[calc(100vh-10rem)] min-h-[400px]">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col min-h-0 overflow-hidden shadow-sm">
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
  )
}

const ExpertChats = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await getUserProfile(false)
        if (!cancelled && res?.success && res?.data) setProfile(res.data)
      } catch (_) {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  const profileComplete = isProfileComplete(profile)
  const verificationStatus = profile?.userDetails?.isVerifiedExpert
  const isVerifiedExpert = verificationStatus === 'approved'
  const isRejected = verificationStatus === 'rejected'

  if (!profileComplete) {
    return (
      <ExpertProfileGate
        title="Complete your profile to access Chats"
        description="Only verified experts can chat with farmers and answer their questions. Complete your expert profile first."
      />
    )
  }

  if (isRejected) {
    return (
      <ExpertProfileGate
        title="Profile verification rejected"
        description="Admin has declined your expert verification. Update your profile and submit again for review to access Chats."
        isRejected
      />
    )
  }

  if (!isVerifiedExpert) {
    return (
      <ExpertProfileGate
        title="Your profile is under review"
        description="Your profile has been submitted and is awaiting admin verification. Once approved, you'll be able to access Chats. Please wait for admin approval."
      />
    )
  }

  return (
    <ChatProvider>
      <ExpertChatsContent />
    </ChatProvider>
  )
}

export default ExpertChats
