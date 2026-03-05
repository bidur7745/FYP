import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSubscription, getUserProfile, cancelSubscription } from '../../services/api'
import { openSubscriptionInvoicePdf } from '../../utils/subscriptionInvoicePdf'
import {
  Loader2,
  ArrowLeft,
  Download,
  Sparkles,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'

const SubscriptionDetails = () => {
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState(null)
  const [active, setActive] = useState(false)
  const [user, setUser] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    Promise.all([getSubscription(true), getUserProfile(true)])
      .then(([subData, profileData]) => {
        setSub(subData?.subscription || null)
        setActive(!!subData?.active)
        const u = profileData?.data?.user || profileData?.user
        setUser(u || null)
      })
      .catch(() => setSub(null))
      .finally(() => setLoading(false))
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

  const handleDownloadInvoice = () => {
    if (!sub) return
    openSubscriptionInvoicePdf({
      invoiceNumber: `SUB-${sub.id}`,
      plan: sub.plan,
      status: sub.status,
      startedAt: sub.started_at,
      expiresAt: sub.expires_at,
      amountPaid: sub.amount_paid ?? '—',
      paymentProvider: sub.payment_provider,
      createdAt: sub.created_at,
      userName: user?.name,
      userEmail: user?.email,
    })
  }

  const dateStr = (v) => (v ? new Date(v).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—')
  const shortDate = (v) => (v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—')

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Link
          to="/dashboard/user"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Billing & subscription
          </h1>
          <p className="mt-1 text-slate-400 text-sm sm:text-base">
            Manage your plan and download invoices.
          </p>
        </header>

        {!sub ? (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No active subscription</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              Upgrade to Premium for expert verification, priority support, and higher scan limits.
            </p>
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Premium
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Plan overview */}
              <section className="rounded-2xl border border-slate-700/60 bg-slate-800/30 overflow-hidden flex flex-col">
                <div className="p-5 sm:p-6 flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-white">
                        {sub.plan.replace(/_/g, ' ')}
                      </h2>
                      <p className="text-slate-400 text-sm mt-0.5">
                        {active ? 'Your plan is active' : 'Subscription ' + sub.status}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-600/50 text-slate-300'
                    }`}
                  >
                    {active && <CheckCircle className="h-3.5 w-3.5" />}
                    {active ? 'Active' : sub.status}
                  </span>
                  <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-slate-300 text-sm">
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>Access until {dateStr(sub.expires_at)}</span>
                  </div>
                  {sub.cancelled_at && (
                    <p className="mt-2 text-amber-400/90 text-xs">
                      Cancellation requested · access until period end
                    </p>
                  )}
                </div>
              </section>

              {/* Invoice history */}
              <section className="rounded-2xl border border-slate-700/60 bg-slate-800/30 overflow-hidden flex flex-col">
                <div className="p-5 sm:p-6 border-b border-slate-700/60">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Invoice history
                  </h3>
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">SUB-{sub.id}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{shortDate(sub.created_at)}</p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-400 font-semibold">
                        Rs. {sub.amount_paid ?? '—'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                        Paid
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-sm font-medium transition-colors w-fit"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </section>

              {/* Payment method */}
              <section className="rounded-2xl border border-slate-700/60 bg-slate-800/30 overflow-hidden flex flex-col">
                <div className="p-5 sm:p-6 border-b border-slate-700/60">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" />
                    Payment method
                  </h3>
                </div>
                <div className="p-5 sm:p-6 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white capitalize">
                        {sub.payment_provider || '—'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        Paid on {shortDate(sub.started_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                <Download className="h-4 w-4" />
                Download invoice
              </button>
              <Link
                to="/premium"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 text-sm font-medium transition-colors"
              >
                Manage subscription
              </Link>
              {active && !sub.cancelled_at && (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SubscriptionDetails
