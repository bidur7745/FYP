import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { deleteMyProfile, getSubscription, cancelSubscription } from '../../services/api'
import { Loader2, Trash2, Sparkles, ExternalLink } from 'lucide-react'

const SettingsTab = () => {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [subLoading, setSubLoading] = useState(true)
  const [sub, setSub] = useState(null)
  const [active, setActive] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    getSubscription(true)
      .then((data) => {
        setSub(data?.subscription || null)
        setActive(!!data?.active)
      })
      .catch(() => setSub(null))
      .finally(() => setSubLoading(false))
  }, [])

  const handleCancelSubscription = () => {
    if (!active || cancelling) return
    if (!window.confirm('Cancel your Premium subscription? You will keep access until the end of the current period.')) return
    setCancelling(true)
    cancelSubscription()
      .then(() => getSubscription(true))
      .then((data) => {
        setSub(data?.subscription || null)
        setActive(!!data?.active)
      })
      .finally(() => setCancelling(false))
  }

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

  const expiresStr = sub?.expires_at
    ? new Date(sub.expires_at).toLocaleDateString(undefined, { dateStyle: 'long' })
    : ''

  return (
    <div className="space-y-6 pt-4 pb-8">
      <h2 className="text-2xl font-bold text-slate-100">Settings</h2>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          Subscription
        </h3>
        {subLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : active ? (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">
              You have <span className="font-medium text-emerald-400">Premium</span> access
              {expiresStr && (
                <> until <span className="font-medium text-slate-100">{expiresStr}</span></>
              )}.
            </p>
            {sub?.cancelled_at ? (
              <p className="text-amber-400/90 text-sm">Cancellation requested. Access continues until the end of the period.</p>
            ) : (
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/50 text-amber-300 text-sm hover:bg-amber-500/10 disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            )}
            <div className="pt-2">
              <Link
                to="/dashboard/user/subscription"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300"
              >
                View subscription details <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">You are on the free plan. Upgrade to Premium for expert verification, priority support, and more.</p>
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Premium
            </Link>
          </div>
        )}
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
