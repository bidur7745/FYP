import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const Subscription = () => {
  const { content } = useLanguage()
  const navigate = useNavigate()
  const sub = content?.subscription || {}

  const basicFeatures = sub.basicFeatures || []
  const premiumFeatures = sub.premiumFeatures || []

  const handleGetStarted = () => navigate('/login')

  return (
    <section className="relative w-full overflow-hidden rounded-xl bg-black min-h-[80vh] flex flex-col justify-center py-16 px-6 sm:px-8 font-['Inter']">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-linear-to-b from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(16,185,129,0.08),transparent)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto space-y-10 w-full">
        <div className="space-y-4 text-center">
          <p className="text-xs font-medium tracking-[0.4em] uppercase text-emerald-400/90">
            {sub.title || 'Plans for Every Farmer'}
          </p>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {sub.subtitle || 'Start free with Basic. Upgrade to Premium for expert verification and unlimited support.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan - White card */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-8 shadow-2xl shadow-black/30 hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-0.5">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
                {sub.basicLabel || 'Basic'}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">
                  {sub.basicPrice || 'Free'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {sub.basicPriceNote || 'Forever'}
              </p>
            </div>
            <ul className="space-y-4">
              {basicFeatures.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleGetStarted}
              className="mt-8 w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-emerald-400 hover:bg-emerald-50/80 hover:text-emerald-800 transition-all duration-200"
            >
              {sub.getStarted || 'Get Started'}
            </button>
          </div>

          {/* Premium Plan - White card with accent */}
          <div className="relative rounded-2xl bg-white border-2 border-emerald-400/60 p-8 shadow-2xl shadow-black/25 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute top-5 right-5 flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-amber-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {sub.popularBadge || 'Popular'}
            </div>
            <div className="mb-8 pr-20">
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
                {sub.premiumLabel || 'Premium'}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-emerald-700 tracking-tight">
                  {sub.premiumPrice || 'Rs. 1,999'}
                </span>
                <span className="text-slate-500 text-sm font-medium">
                  {sub.premiumPricePeriod || '/month'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {sub.premiumPriceNote || 'Expert support & more'}
              </p>
            </div>
            <ul className="space-y-4">
              {premiumFeatures.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="mt-8 block w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-center shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 transition-all duration-200"
            >
              {sub.upgradeToPremium || 'Upgrade to Premium'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Subscription
