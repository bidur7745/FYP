import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile, updateUserProfile, uploadImage } from '../../services/api'
import { Loader2, AlertCircle } from 'lucide-react'
import ExpertProfileForm from '../../components/expert/ExpertProfileForm'
import ExpertProfileReview from '../../components/expert/ExpertProfileReview'
import ExpertProfileView from '../../components/expert/ExpertProfileView'

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

const ExpertProfile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showEditFormRejected, setShowEditFormRejected] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await getUserProfile(false)
        if (!cancelled && res?.success && res?.data) setProfile(res.data)
        if (!cancelled && res && !res.success) setError(res.message || 'Failed to load profile')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load profile')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleBack = () => navigate('/dashboard/expert/chats')
  const handleUpdate = async (updatedData) => {
    setProfile(updatedData)
    setIsEditing(false)
    // Optionally refetch to ensure latest data
    const res = await getUserProfile(true)
    if (res?.success && res?.data) setProfile(res.data)
  }
  const handleEdit = () => setIsEditing(true)

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  const profileComplete = isProfileComplete(profile)
  const verificationStatus = profile?.userDetails?.isVerifiedExpert // 'pending' | 'approved' | 'rejected'
  const isVerifiedExpert = verificationStatus === 'approved'

  // If profile is complete but rejected by admin: show edit form when they click "Update profile", else rejected message
  if (profileComplete && verificationStatus === 'rejected') {
    if (showEditFormRejected) {
      return (
        <ExpertProfileForm
          profile={profile}
          asPage
          onClose={() => setShowEditFormRejected(false)}
          onUpdate={(updatedData) => {
            setProfile(updatedData)
            setShowEditFormRejected(false)
            return handleUpdate(updatedData)
          }}
          uploadImage={uploadImage}
          updateUserProfile={updateUserProfile}
        />
      )
    }
    return (
      <ExpertProfileReview
        status="rejected"
        onUpdateProfile={() => setShowEditFormRejected(true)}
      />
    )
  }

  // If profile is complete but still pending verification, show under-review message
  if (profileComplete && verificationStatus === 'pending') {
    return <ExpertProfileReview status="pending" />
  }

  // If profile is not complete, show form
  if (!profileComplete) {
    return (
      <ExpertProfileForm
        profile={profile}
        asPage
        onClose={handleBack}
        onUpdate={handleUpdate}
        uploadImage={uploadImage}
        updateUserProfile={updateUserProfile}
      />
    )
  }

  // If verified and editing, show form
  if (isVerifiedExpert && isEditing) {
    return (
      <ExpertProfileForm
        profile={profile}
        asPage
        onClose={() => setIsEditing(false)}
        onUpdate={handleUpdate}
        uploadImage={uploadImage}
        updateUserProfile={updateUserProfile}
      />
    )
  }

  // If verified, show read-only profile view with edit button
  return (
    <ExpertProfileView
      profile={profile}
      onEdit={handleEdit}
    />
  )
}

export default ExpertProfile
