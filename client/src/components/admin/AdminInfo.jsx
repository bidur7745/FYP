import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Home, Edit, Save, X, Upload, MapPin, FileText } from 'lucide-react'
import { getUserProfile, updateUserProfile, uploadImage } from '../../services/api'

const AdminInfo = () => {
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profileFile, setProfileFile] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    farmLocation: '',
    bio: '',
    profileImage: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await getUserProfile(true) // Force refresh
      if (response.success) {
        setUserProfile(response.data)
        const details = response.data.userDetails || {}
        setFormData({
          name: response.data.user?.name || '',
          phone: details.phone || '',
          address: details.address || '',
          farmLocation: details.farmLocation || '',
          bio: details.bio || '',
          profileImage: details.profileImage || '',
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

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
      }

      const response = await updateUserProfile(payload)
      if (response.success) {
        setSuccess('Profile updated successfully!')
        await fetchProfile() // Refresh profile data
        setIsEditing(false)
        setProfileFile(null)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    const details = userProfile?.userDetails || {}
    setFormData({
      name: userProfile?.user?.name || '',
      phone: details.phone || '',
      address: details.address || '',
      farmLocation: details.farmLocation || '',
      bio: details.bio || '',
      profileImage: details.profileImage || '',
    })
    setIsEditing(false)
    setProfileFile(null)
    setError('')
    setSuccess('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  const details = userProfile?.userDetails || {}
  const profileImage = formData.profileImage || details.profileImage

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Information</h2>
          <p className="text-sm text-slate-600 mt-1">Manage your admin profile details</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Image Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User size={16} className="text-emerald-600" />
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                {profileImage && (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:cursor-pointer hover:file:bg-emerald-700 file:transition-colors"
                  />
                  {profileFile && (
                    <p className="text-xs text-emerald-600 mt-1">New image selected: {profileFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User size={16} className="text-emerald-600" />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail size={16} className="text-emerald-600" />
                Email
              </label>
              <input
                type="email"
                value={userProfile?.user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone size={16} className="text-emerald-600" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Home size={16} className="text-emerald-600" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                placeholder="Enter your address"
              />
            </div>

            {/* Farm Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin size={16} className="text-emerald-600" />
                Farm Location (Region)
              </label>
              <select
                name="farmLocation"
                value={formData.farmLocation}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
              >
                <option value="">Select your region</option>
                <option value="Terai">Terai</option>
                <option value="Hill">Hill</option>
                <option value="Mountain">Mountain</option>
              </select>
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText size={16} className="text-emerald-600" />
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                placeholder="Tell us about yourself"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="flex items-start gap-6 mb-6">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userProfile?.user?.name || 'Admin'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-200">
                  <User className="w-12 h-12 text-emerald-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800 mb-1">
                  {userProfile?.user?.name || 'Admin User'}
                </h3>
                <p className="text-slate-600 mb-2">{userProfile?.user?.email || ''}</p>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Administrator
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              {details.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Phone className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Phone Number</p>
                    <p className="text-gray-900">{details.phone}</p>
                  </div>
                </div>
              )}

              {/* Address */}
              {details.address && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Home className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
                    <p className="text-gray-900">{details.address}</p>
                  </div>
                </div>
              )}

              {/* Farm Location */}
              {details.farmLocation && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MapPin className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Farm Location</p>
                    <p className="text-gray-900">{details.farmLocation}</p>
                  </div>
                </div>
              )}

              {/* Bio */}
              {details.bio && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileText className="text-emerald-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Bio</p>
                    <p className="text-gray-900">{details.bio}</p>
                  </div>
                </div>
              )}
            </div>

            {!details.phone && !details.address && !details.farmLocation && !details.bio && (
              <div className="text-center py-8 text-gray-500">
                <p>No additional information available. Click "Edit Profile" to add details.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminInfo
