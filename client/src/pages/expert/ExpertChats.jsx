import React, { useEffect, useState } from 'react'
import { getUserProfile } from '../../services/api'
import { MessageCircle, Loader2 } from 'lucide-react'
import ExpertProfileGate from '../../components/expert/ExpertProfileGate'

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
  const isVerifiedExpert = profile?.userDetails?.isVerifiedExpert === true

  // Block if profile not complete
  if (!profileComplete) {
    return (
      <ExpertProfileGate
        title="Complete your profile to access Chats"
        description="Only verified experts can chat with farmers and answer their questions. Complete your expert profile first."
      />
    )
  }

  // Block if not verified by admin
  if (!isVerifiedExpert) {
    return (
      <ExpertProfileGate
        title="Your profile is under review"
        description="Your profile has been submitted and is awaiting admin verification. Once approved, you'll be able to access Chats. Please wait for admin approval."
      />
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 pt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Farmer Chats</h2>
        <p className="text-slate-600 text-sm">
          Chat with farmers and answer their questions. This feature will be available soon.
        </p>
      </div>
    </div>
  )
}

export default ExpertChats
