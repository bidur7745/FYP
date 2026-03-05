import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { verifySubscription } from '../services/api'

const PREMIUM_AMOUNT_PAISA = 199900

const PremiumSuccess = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const pidx = searchParams.get('pidx')
    if (!pidx) {
      setStatus('error')
      setMessage('Invalid return from payment. Missing payment reference.')
      return
    }

    verifySubscription({ pidx, amount: PREMIUM_AMOUNT_PAISA })
      .then(() => {
        setStatus('success')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message || 'Payment verification failed.')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-300">Verifying your payment...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">You're Premium!</h1>
            <p className="text-slate-300 mb-6">
              Your subscription is active. We've sent a confirmation email. You can use all Premium features until the end of your billing period.
            </p>
            <Link
              to="/dashboard/user"
              className="inline-block w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/premium"
              className="inline-block w-full mt-3 py-3 rounded-xl border border-slate-500 text-slate-300 font-semibold hover:bg-slate-700/50"
            >
              Subscription details
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <Link
              to="/premium"
              className="inline-block w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
            >
              Back to Premium
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default PremiumSuccess
