import React, { useState } from 'react'
import { X, MapPin, Phone, Home, User, FileText, GraduationCap, Briefcase, Award } from 'lucide-react'
import { updateUserProfile, uploadImage } from '../../services/api'

const ProfileCompletion = ({ userProfile, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: userProfile?.user?.name || '',
    phone: userProfile?.userDetails?.phone || '',
    address: userProfile?.userDetails?.address || '',
    farmLocation: userProfile?.userDetails?.farmLocation || '',
    bio: userProfile?.userDetails?.bio || '',
    profileImage: userProfile?.userDetails?.profileImage || '',
    skills: userProfile?.userDetails?.skills || '',
    education: userProfile?.userDetails?.education || '',
    yearsOfExperience: userProfile?.userDetails?.yearsOfExperience ?? '',
  })

  const [profileFile, setProfileFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      let profileImageUrl = formData.profileImage

      // Upload profile image if a new file is selected
      if (profileFile) {
        const uploadRes = await uploadImage(profileFile, 'profiles')
        profileImageUrl = uploadRes.url
      }

      const payload = {
        name: formData.name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        farmLocation: formData.farmLocation.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        profileImage: profileImageUrl || undefined,
        skills: formData.skills.trim() || undefined,
        education: formData.education.trim() || undefined,
        yearsOfExperience: formData.yearsOfExperience === '' ? undefined : Number(formData.yearsOfExperience),
      }

      const response = await updateUserProfile(payload)
      if (response.success) {
        setSuccess('Profile updated successfully!')
        if (onUpdate) {
          onUpdate(response.data)
        }
        setTimeout(() => {
          if (onClose) onClose()
        }, 1500)
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const profileCompletionPercentage = () => {
    const fields = [
      formData.name,
      formData.phone,
      formData.address,
      formData.farmLocation,
    ]
    const filled = fields.filter((f) => f && f.trim() !== '').length
    return Math.round((filled / fields.length) * 100)
  }

  const completion = profileCompletionPercentage()

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Dark theme */}
        <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700 px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400 mb-1">
                Complete Your Profile
              </p>
              <h2 className="text-2xl font-semibold text-slate-100">Profile Information</h2>
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span>Profile Completion:</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-2 max-w-[200px]">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        completion === 100
                          ? 'bg-emerald-500'
                          : completion >= 50
                          ? 'bg-emerald-400'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <span className="font-semibold text-slate-100">{completion}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-300" />
            </button>
          </div>
        </div>

        {/* Form - Dark theme */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-900/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Profile Image */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <User size={16} className="text-emerald-400" />
              Profile Picture (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:cursor-pointer hover:file:bg-emerald-700 file:transition-colors bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {formData.profileImage && !profileFile && (
              <p className="text-xs text-slate-400 mt-1">Current image set</p>
            )}
            {profileFile && (
              <p className="text-xs text-emerald-400 mt-1">New image selected: {profileFile.name}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <User size={16} className="text-emerald-400" />
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Phone size={16} className="text-emerald-400" />
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Home size={16} className="text-emerald-400" />
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-500"
              placeholder="Enter your address (district, municipality, etc.)"
            />
          </div>

          {/* Farm Location (Region) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <MapPin size={16} className="text-emerald-400" />
              Farm Location (Region) *
              <span className="text-xs font-normal text-slate-400">
                (Required for crop recommendations)
              </span>
            </label>
            <select
              name="farmLocation"
              value={formData.farmLocation}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            >
              <option value="" className="bg-slate-800">Select your region</option>
              <option value="Terai" className="bg-slate-800">Terai</option>
              <option value="Hill" className="bg-slate-800">Hill</option>
              <option value="Mountain" className="bg-slate-800">Mountain</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              This helps us recommend crops suitable for your area
            </p>
          </div>

          {/* Skills */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Award size={16} className="text-emerald-400" />
              Skills (Optional)
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="e.g., Organic farming, Crop rotation, Irrigation management"
            />
            <p className="mt-1 text-xs text-slate-400">
              List your farming skills or areas of expertise
            </p>
          </div>

          {/* Education */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <GraduationCap size={16} className="text-emerald-400" />
              Education (Optional)
            </label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="e.g., High School, Agriculture Diploma, B.Sc. Agriculture"
            />
            <p className="mt-1 text-xs text-slate-400">
              Your educational background related to farming
            </p>
          </div>

          {/* Years of Experience */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Briefcase size={16} className="text-emerald-400" />
              Years of Experience (Optional)
            </label>
            <input
              type="number"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="Enter number of years"
            />
            <p className="mt-1 text-xs text-slate-400">
              How many years have you been farming?
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <FileText size={16} className="text-emerald-400" />
              Bio (Optional)
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-500"
              placeholder="Tell us about yourself (optional)"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileCompletion
