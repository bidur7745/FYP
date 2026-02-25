import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteMyProfile } from '../../services/api'
import { Loader2, Trash2 } from 'lucide-react'

const SettingsTab = () => {
  const navigate = useNavigate()
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
    <div className="space-y-6 pt-4 pb-8">
      <h2 className="text-2xl font-bold text-slate-100">Settings</h2>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <p className="text-slate-300">Settings options will be available here.</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-red-900/50 p-6">
        <h3 className="text-lg font-semibold text-red-300 mb-2">Danger zone</h3>
        <p className="text-slate-400 text-sm mb-4">
          Permanently delete your account and all associated data. Only you can delete your profile.
        </p>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <button
          type="button"
          onClick={handleDeleteMyProfile}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
          {deleting ? 'Deleting…' : 'Delete my profile'}
        </button>
      </div>
    </div>
  )
}

export default SettingsTab
