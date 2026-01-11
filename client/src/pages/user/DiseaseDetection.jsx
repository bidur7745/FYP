import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

const DiseaseDetection = () => {
  const { content } = useLanguage()
  const pageContent = content?.underDevelopment || {}

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 pt-24 pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-md w-full rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl shadow-xl p-8 text-center">
        
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300 mb-2">
          {pageContent.tagline || 'Coming Soon'}
        </p>

        <h1 className="text-2xl font-semibold text-slate-100 mb-3">
          {pageContent.title || 'Disease Detection'}
        </h1>

        <p className="text-slate-300 mb-6">
          {pageContent.message || 'This feature is currently under development. We’re working to bring you accurate crop disease detection soon.'}
        </p>

      </div>
    </div>
  )
}

export default DiseaseDetection
     