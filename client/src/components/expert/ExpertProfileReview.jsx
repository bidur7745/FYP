import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Clock, Trash2, Loader2, Edit } from 'lucide-react'
import { deleteMyProfile } from '../../services/api'

/**
 * Shown when expert profile is complete but awaiting admin verification (pending)
 * or when admin has rejected the profile (rejected).
 */
const ExpertProfileReview = ({ status = 'pending', onUpdateProfile }) => {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const isRejected = status === 'rejected'

  const handleDeleteMyProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    try {
      setDeleting(true)
      setError('')
      await deleteMyProfile()
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className={`rounded-2xl border p-6 shadow-xl ${isRejected ? 'border-red-500/30 bg-slate-950' : 'border-emerald-500/20 bg-slate-950'}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isRejected ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-300'}`}>
            <Clock className="h-6 w-6" />
          </div>
          <div>
            {isRejected ? (
              <>
                <h2 className="text-xl font-semibold text-red-400 mb-1">Profile verification rejected</h2>
                <p className="text-slate-300 text-sm">
                  Admin has declined your expert profile verification. You can update your profile and license and submit again for review.
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Go to your profile, make the needed changes, and save. Your profile will go back to &quot;Under review&quot; for admin to verify again.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-red-400 mb-1">Your profile is under review</h2>
                <p className="text-slate-300 text-sm">
                  Your profile and license have been submitted successfully. An admin will review and verify your expert status soon.
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Once verified, you&apos;ll be able to access Chats and My Earning features. Please wait for admin approval.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-700 flex flex-wrap items-center gap-3">
          {isRejected && (
            onUpdateProfile ? (
              <button
                type="button"
                onClick={onUpdateProfile}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-medium transition"
              >
                <Edit size={16} /> Update profile
              </button>
            ) : (
              <Link
                to="/dashboard/expert/profile"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-medium"
              >
                <Edit size={16} /> Update profile
              </Link>
            )
          )}
          <p className="text-slate-400 text-sm">Only you can delete your profile.</p>
          {error && <p className="text-red-400 text-sm w-full">{error}</p>}
          <button
            type="button"
            onClick={handleDeleteMyProfile}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm font-medium disabled:opacity-50"
          >
            {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            {deleting ? 'Deleting…' : 'Delete my profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExpertProfileReview
