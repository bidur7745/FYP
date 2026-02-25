import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, User, Phone, MapPin, FileText, GraduationCap, Briefcase, Award, CheckCircle, Trash2, Loader2 } from 'lucide-react'
import { deleteMyProfile } from '../../services/api'

/**
 * Read-only view of expert profile details - shown when profile is approved.
 */
const ExpertProfileView = ({ profile, onEdit }) => {
  const navigate = useNavigate()
  const userDetails = profile?.userDetails || {}
  const user = profile?.user || {}
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDeleteMyProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone and all your data will be removed.')) return
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
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
        >
          <Edit size={18} /> Edit profile
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header section with verification badge */}
        <div className="bg-linear-to-r from-emerald-50 to-green-50 border-b border-emerald-200 px-6 py-6">
          <div className="flex items-start gap-4">
            {userDetails?.profileImage ? (
              <img
                src={userDetails.profileImage}
                alt={user?.name || 'Expert'}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-white shadow-lg">
                <User className="w-12 h-12 text-emerald-600" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">{user?.name || 'Expert'}</h1>
                {profile?.userDetails?.isVerifiedExpert === 'approved' && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    <CheckCircle size={14} /> Verified Expert
                  </div>
                )}
              </div>
              {userDetails?.bio && (
                <p className="text-slate-600 text-sm leading-relaxed">{userDetails.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Details section */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> Contact Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {userDetails?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Phone</p>
                    <p className="text-slate-800 font-medium">{userDetails.phone}</p>
                  </div>
                </div>
              )}
              {userDetails?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Address</p>
                    <p className="text-slate-800 font-medium">{userDetails.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" /> Professional Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {userDetails?.skills && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Skills</p>
                    <p className="text-slate-800 font-medium">{userDetails.skills}</p>
                  </div>
                </div>
              )}
              {userDetails?.education && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Education</p>
                    <p className="text-slate-800 font-medium">{userDetails.education}</p>
                  </div>
                </div>
              )}
              {userDetails?.yearsOfExperience != null && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Experience</p>
                    <p className="text-slate-800 font-medium">{userDetails.yearsOfExperience} years</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* License/Certificate */}
          {userDetails?.licenseImage && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> License / Certificate
              </h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <img
                  src={userDetails.licenseImage}
                  alt="License/Certificate"
                  className="w-full max-w-md mx-auto object-contain bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Danger zone: Delete my profile */}
          <div className="pt-6 mt-6 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Danger zone</h2>
            <p className="text-slate-600 text-sm mb-3">
              Permanently delete your expert account and all associated data. Only you can delete your profile.
            </p>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <button
              type="button"
              onClick={handleDeleteMyProfile}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium disabled:opacity-50"
            >
              {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              {deleting ? 'Deleting…' : 'Delete my profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpertProfileView
