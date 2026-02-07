import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

const RoadmapSection = () => {
  const { content } = useLanguage()
  const items = content?.roadmap?.items || []
  
  return (
    <section className="bg-slate-50 text-slate-900 py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-2xl font-semibold tracking-[0.35em] uppercase text-emerald-600">
            {content?.roadmap?.title || 'Roadmap & Future Enhancements'}
          </p>
        </div>

        <div className="relative space-y-6 max-w-5xl mx-auto">
          {/* Connecting line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-950" />

          {items.map((item, index) => (
            <div key={index} className="relative flex items-center gap-6">
              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-slate-950 border-4 border-slate-50 shadow-md shadow-slate-950" />

              {/* Card – soft green gradient similar to other home cards */}
              <div className="flex-1 rounded-lg p-5 border border-emerald-200 bg-linear-to-br from-emerald-100 via-emerald-50 to-white shadow-lg shadow-slate-950/30 transition-transform duration-300 hover:-translate-y-1 hover:border-emerald-400">
                <p className="text-base font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RoadmapSection