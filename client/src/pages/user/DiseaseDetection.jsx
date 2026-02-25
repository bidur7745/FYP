import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { assets } from '../../assets/images/assets'

const DiseaseDetection = () => {
  const { content } = useLanguage()
  const info = content?.diseaseDetection?.info || {}

  return (
    <div
      className="min-h-screen text-slate-100 pt-24 pb-16 px-4 relative"
      style={{
        backgroundImage: `url(${assets.diseaseBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-sm" />
      <div className="relative max-w-6xl mx-auto space-y-12">
        {/* Hero section */}
        <section className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <p className="text-sm font-bold tracking-[0.35em] mb-2 bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-100 bg-clip-text text-transparent uppercase">
              KrishiMitra&apos;s
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold mb-4">
              {content?.nav?.diseaseDetection || 'Disease Detection'}
            </h1>
            <p className="text-slate-200 mb-6 max-w-xl">
              {info.ctaLine ||
                "Upload a clear photo of a plant leaf to get an instant AI-based diagnosis and know what the model can and can't detect."}
            </p>
            <Link
              to="/disease-detection/scan"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              {info.ctaButton || 'Start detection'}
            </Link>
          </div>
          <div className="flex justify-center">
            <img
              src={assets.diseasedetection}
              alt="Disease detection preview"
              className="w-full max-w-md rounded-3xl shadow-2xl border border-emerald-500/40 object-cover"
            />
          </div>
        </section>

        {/* 2. How it works */}
        <section className="rounded-2xl border border-emerald-500/20 bg-slate-900/70 backdrop-blur-xl p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-xl font-semibold text-emerald-300 mb-4">
                {info.howItWorksTitle || 'How it works'}
              </h2>
              <ul className="space-y-4">
                <li>
                  <h3 className="font-medium text-slate-100 mb-1">{info.step1Title || 'Leaf check'}</h3>
                  <p className="text-slate-300 text-sm">{info.step1Desc}</p>
                </li>
                <li>
                  <h3 className="font-medium text-slate-100 mb-1">{info.step2Title || 'Disease diagnosis'}</h3>
                  <p className="text-slate-300 text-sm">{info.step2Desc}</p>
                </li>
                <li>
                  <h3 className="font-medium text-slate-100 mb-1">{info.step3Title || 'Result'}</h3>
                  <p className="text-slate-300 text-sm">{info.step3Desc}</p>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <img
                src={assets.leavesAI}
                alt="AI leaf analysis"
                className="w-full max-w-sm rounded-2xl shadow-xl border border-emerald-500/40 object-cover"
              />
            </div>
          </div>
        </section>

        {/* 3. What the model can detect */}
        <section className="rounded-2xl border border-emerald-500/20 bg-slate-900/70 backdrop-blur-xl p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-2 items-start">
            <div>
              <h2 className="text-xl font-semibold text-emerald-300 mb-4">
                {info.whatModelTitle || 'What the model can detect'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={assets.tomatoIcon}
                    alt="Tomato"
                    className="h-10 w-10 object-contain drop-shadow-lg"
                  />
                  <div>
                    <h3 className="font-medium text-slate-100 mb-1">{info.tomatoTitle || 'Tomato (leaf)'}</h3>
                    <p className="text-slate-300 text-sm">{info.tomatoConditions}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <img
                    src={assets.potatoIcon}
                    alt="Potato"
                    className="h-10 w-10 object-contain drop-shadow-lg"
                  />
                  <div>
                    <h3 className="font-medium text-slate-100 mb-1">{info.potatoTitle || 'Potato (leaf)'}</h3>
                    <p className="text-slate-300 text-sm">{info.potatoConditions}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <img
                    src={assets.maizeIcon}
                    alt="Maize"
                    className="h-10 w-10 object-contain drop-shadow-lg"
                  />
                  <div>
                    <h3 className="font-medium text-slate-100 mb-1">{info.maizeTitle || 'Maize (leaf)'}</h3>
                    <p className="text-slate-300 text-sm">{info.maizeConditions}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={assets.potomaiz}
                alt="Tomato, potato and maize basket"
                className="w-full max-w-md rounded-2xl shadow-xl border border-emerald-500/40 object-cover"
              />
            </div>
          </div>
        </section>

        {/* 4. Tips for best results + CTA */}
        <section className="rounded-2xl border border-emerald-500/20 bg-slate-900/70 backdrop-blur-xl p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="flex justify-center">
              <img
                src={assets.leavesAI}
                alt="Leaf tips"
                className="w-full max-w-sm rounded-2xl shadow-xl border border-emerald-500/40 object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-emerald-300 mb-4">
                {info.tipsTitle || 'Tips for best results'}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm mb-6">
                <li>{info.tip1}</li>
                <li>{info.tip2}</li>
                <li>{info.tip3}</li>
              </ul>
              <p className="text-slate-300 mb-4">
                {info.ctaLine ||
                  "Upload a clear photo of a plant leaf to get an instant AI-based diagnosis and know what the model can and can't detect."}
              </p>
              <Link
                to="/disease-detection/scan"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {info.ctaButton || 'Start detection'}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DiseaseDetection
