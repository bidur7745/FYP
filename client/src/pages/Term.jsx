import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { assets } from '../assets/images/assets'

const Term = () => {
  const { content } = useLanguage()
  const terms = content.termsPage || {}

  const sections = [
    {
      heading: terms.introductionHeading,
      body: terms.introduction
    },
    {
      heading: terms.useOfPlatformHeading,
      body: terms.useOfPlatform
    },
    {
      heading: terms.intellectualPropertyHeading,
      body: terms.intellectualProperty
    },
    {
      heading: terms.accountSuspensionHeading,
      body: terms.accountSuspension
    },
    {
      heading: terms.changesHeading,
      body: terms.changes
    },
    {
      heading: terms.contactUsHeading,
      body: terms.contactUs
    }
  ]

  return (
    <main className="relative min-h-screen pt-28 pb-20 text-emerald-50 overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={assets.backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-linear-to-br from-black/80 via-emerald-950/80 to-green-900/70" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 border border-emerald-500/20 rounded-3xl shadow-2xl shadow-emerald-900/40 backdrop-blur-xl p-8 sm:p-10 space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-emerald-300">
              {terms.lastUpdated || 'Last Updated'}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-emerald-50">
              {terms.introductionHeading || 'Terms & Conditions'}
            </h1>
            <p className="text-sm text-emerald-100/80">
              {terms.introduction}
            </p>
          </header>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-emerald-50/90">
            {sections.slice(1).map(
              (section) =>
                section.heading &&
                section.body && (
                  <section key={section.heading} className="space-y-2">
                    <h2 className="text-lg sm:text-xl font-semibold text-emerald-100">
                      {section.heading}
                    </h2>
                    <p className="text-sm text-emerald-100/80">{section.body}</p>
                  </section>
                )
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Term
