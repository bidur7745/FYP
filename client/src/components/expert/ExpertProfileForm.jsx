import React, { useState } from 'react'
import { X, ArrowLeft } from 'lucide-react'

const ExpertProfileForm = ({ profile, onClose, onUpdate, uploadImage, updateUserProfile, asPage = false }) => {
  const [formData, setFormData] = useState({
    name: profile?.user?.name || '',
    phone: profile?.userDetails?.phone || '',
    address: profile?.userDetails?.address || '',
    bio: profile?.userDetails?.bio || '',
    profileImage: profile?.userDetails?.profileImage || '',
    skills: profile?.userDetails?.skills || '',
    education: profile?.userDetails?.education || '',
    yearsOfExperience: profile?.userDetails?.yearsOfExperience ?? '',
    licenseImage: profile?.userDetails?.licenseImage || '',
  })
  const [profileFile, setProfileFile] = useState(null)
  const [licenseFile, setLicenseFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      let licenseImageUrl = formData.licenseImage

      if (profileFile) {
        const up = await uploadImage(profileFile, 'profiles')
        profileImageUrl = up.url
      }
      if (licenseFile) {
        const up = await uploadImage(licenseFile, 'licenses')
        licenseImageUrl = up.url
      }

      const payload = {
        name: formData.name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        profileImage: profileImageUrl || undefined,
        skills: formData.skills.trim() || undefined,
        education: formData.education.trim() || undefined,
        yearsOfExperience: formData.yearsOfExperience === '' ? undefined : Number(formData.yearsOfExperience),
        licenseImage: licenseImageUrl || undefined,
      }

      const res = await updateUserProfile(payload)
      if (res.success && res.data) {
        setSuccess('Profile saved successfully.')
        onUpdate(res.data)
        setTimeout(() => {
          onClose()
        }, 1200)
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const header = (
    <div className={`border-b border-slate-200 px-6 py-4 flex items-center justify-between ${asPage ? 'bg-slate-50 rounded-t-2xl' : 'bg-white sticky top-0 rounded-t-2xl'}`}>
      <h2 className="text-xl font-semibold text-slate-800">Expert profile</h2>
      {asPage ? (
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
          <ArrowLeft size={18} /> Back to dashboard
        </button>
      ) : (
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
          <X size={20} />
        </button>
      )}
    </div>
  )

  const formContent = (
    <>
        {header}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skills</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. Crop disease, soil health"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Education</label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleChange}
              placeholder="e.g. B.Sc. Agriculture"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Years of experience</label>
            <input
              type="number"
              name="yearsOfExperience"
              min={0}
              value={formData.yearsOfExperience}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profile photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
            />
            {formData.profileImage && !profileFile && (
              <p className="text-xs text-slate-500 mt-1">Current image set</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              License / certificate image <span className="text-amber-600">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
            />
            {formData.licenseImage && !licenseFile && (
              <p className="text-xs text-slate-500 mt-1">Current license image set</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              {asPage ? 'Back to dashboard' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
    </>
  )

  if (asPage) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {formContent}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full my-8 overflow-hidden">
        {formContent}
      </div>
    </div>
  )
}

export default ExpertProfileForm
