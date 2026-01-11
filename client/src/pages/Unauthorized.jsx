import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const Unauthorized = () => {
  const { content } = useLanguage()
  const unauthorized = content?.unauthorized || {}

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 pt-24 pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-md w-full rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl shadow-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300 mb-2">
          {unauthorized.tagline || 'Access Denied'}
        </p>
        <h1 className="text-2xl font-semibold text-slate-100 mb-3">
          {unauthorized.title || 'Unauthorized'}
        </h1>
        <p className="text-slate-300 mb-6">
          {unauthorized.message || "You don't have permission to view this page with your current role."}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex justify-center rounded-lg px-4 py-2 border border-emerald-500/30 text-emerald-300 font-semibold hover:bg-emerald-500/10 transition"
          >
            {unauthorized.backToHome || 'Back to Home'}
          </Link>
          <Link
            to="/login"
            className="inline-flex justify-center rounded-lg px-4 py-2 bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition"
          >
            {unauthorized.switchAccount || 'Switch Account'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized

