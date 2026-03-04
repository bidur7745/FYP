import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles, CreditCard, Shield } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import khaltiLogo from '../assets/images/khaltilogo.jpg'

const PremiumSubscription = () => {
  const { content } = useLanguage()
  const p = content?.premiumPage || {}
  const [selectedPayment, setSelectedPayment] = useState(null)

  const handleProceed = () => {
    if (!selectedPayment) return
    // Frontend only: show a simple message
    alert(p.comingSoon || 'Payment integration coming soon. Thank you for your interest!')
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          {/* Super wrapper: left + right cards */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* LEFT: Title, subtitle, What you get with Premium */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300">
                <Sparkles className="h-4 w-4" />
                {p.badge || 'Premium'}
              </p>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {p.title || 'Premium Subscription'}
              </h1>
              <p className="mt-3 text-slate-300 text-base sm:text-lg leading-relaxed">
                {p.subtitle || 'Get expert-backed advice and unlimited support to make the most of your farm.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 sm:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4">
                {p.explanationTitle || 'What you get with Premium'}
              </h2>
              <p className="text-slate-300 leading-relaxed">
                {p.explanationBody || 'Premium gives you direct access to verified agriculture experts. After AI disease detection, get a second opinion from a real expert. Chat anytime, get priority support, and unlock higher scan limits so you can focus on growing with confidence.'}
              </p>
            </div>
          </div>

          {/* RIGHT: Price, Payment */}
          <div className="space-y-8">
            <section className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/30 p-5 sm:p-6">
              <p className="text-slate-300 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">
                {p.priceLabel || 'Monthly subscription'}
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-400">
                {p.price || 'Rs. 1,999'}
                <span className="text-lg font-normal text-slate-400 ml-1">{p.pricePeriod || '/month'}</span>
              </p>
              <p className="mt-1.5 text-slate-400 text-sm">
                {p.priceNote || 'Cancel anytime. No long-term commitment.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-1">
                {p.paymentTitle || 'Choose payment method'}
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                {p.paymentSubtitle || 'Select how you would like to pay. Secure and simple.'}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayment('khalti')}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPayment === 'khalti'
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : 'border-slate-600 bg-slate-800/40 hover:border-slate-500'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5 shrink-0 overflow-hidden">
                    <img src={khaltiLogo} alt="Khalti" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{p.khaltiLabel || 'Khalti'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.khaltiDesc || 'Pay with Khalti wallet, bank, or mobile banking'}</p>
                  </div>
                  {selectedPayment === 'khalti' && (
                    <Check className="h-5 w-5 text-emerald-400 ml-auto shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment('stripe')}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPayment === 'stripe'
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : 'border-slate-600 bg-slate-800/40 hover:border-slate-500'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 shrink-0">
                    <CreditCard className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{p.stripeLabel || 'Card (Stripe)'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.stripeDesc || 'Credit or debit card via secure Stripe'}</p>
                  </div>
                  {selectedPayment === 'stripe' && (
                    <Check className="h-5 w-5 text-emerald-400 ml-auto shrink-0" />
                  )}
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                <Shield className="h-4 w-4 shrink-0" />
                <span>{p.secureNote || 'All payments are secure and encrypted.'}</span>
              </div>
              <button
                type="button"
                onClick={handleProceed}
                disabled={!selectedPayment}
                className="mt-6 w-full py-3.5 px-6 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors"
              >
                {p.proceedButton || 'Proceed to payment'}
              </button>
            </section>
          </div>
            </div>
          </div>
        </div>

        {/* Footer note - full width */}
        <section className="mt-14 rounded-2xl border border-slate-700/50 bg-slate-800/20 p-6 sm:p-8">
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed text-center">
            {p.feeNote || 'This fee helps us run our servers and pay our experts so we can keep providing you with reliable, expert-backed support. Thank you for supporting KrishiMitra.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {p.backToHome || 'Back to Home'}
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-500/50 bg-slate-700/30 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-600/50 hover:border-slate-400 transition-colors"
            >
              {p.loginLink || 'Already have an account? Log in'}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PremiumSubscription
