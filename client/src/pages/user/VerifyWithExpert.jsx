import React from 'react'
import { Link } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const VerifyWithExpert = () => {
  const { content } = useLanguage()
  const t = content?.diseaseDetection?.verifyWithExpert || {}

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#0a0f0a] text-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/40 backdrop-blur-xl p-8 shadow-lg">
          <Construction className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {t.title || 'Verify with expert'}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {t.underConstruction || 'This feature is under construction. You will soon be able to get your AI diagnosis verified by an agriculture expert.'}
          </p>
          <Link
            to="/disease-detection/scan"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToScan || 'Back to scan'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyWithExpert
