import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

const CTA = () => {
  const { content } = useLanguage()
  
  return (
    <section className="bg-slate-50 text-slate-900 py-16 px-4">
      <div className="max-w-6xl mx-auto rounded-3xl border border-emerald-200 bg-linear-to-r from-emerald-100 via-emerald-50 to-sky-50 px-6 py-10 sm:px-10 sm:py-12 flex flex-col lg:flex-row items-center gap-8 shadow-sm shadow-emerald-100">
        <div className="flex-1 space-y-3 text-center lg:text-left">
          <h2 className="text-3xl sm:text-4xl font-semibold">
            {content?.cta?.title || 'Empowering Nepali farmers starts with informed decisions.'}
          </h2>
          <p className="text-sm sm:text-base text-emerald-950/80 max-w-xl">
            {content?.cta?.description || 'KrishiMitra brings together AI, expert knowledge, and localized data so that every farmer can see options clearly—before they commit their field.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => (window.location.href = '/login')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-emerald-500 text-slate-900 font-semibold shadow-lg hover:bg-emerald-400 transition"
          >
            {content?.cta?.getStarted || 'Get Started'}
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/crop-advisory"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-emerald-400/60 text-emerald-900 font-semibold hover:bg-emerald-500/10 transition"
          >
            {content?.cta?.exploreServices || 'Explore Services'}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CTA


