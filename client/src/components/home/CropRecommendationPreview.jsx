import React from 'react'
import { Link } from 'react-router-dom'
import { Sprout, ArrowRight, FlaskConical, Thermometer, Droplets } from 'lucide-react'
import { assets } from '../../assets/images/assets'

const highlights = [
  { icon: FlaskConical, label: 'Soil Nutrients (N, P, K)' },
  { icon: Thermometer, label: 'Temperature & Humidity' },
  { icon: Droplets, label: 'Rainfall & pH Level' },
]

const CropRecommendationPreview = () => {
  return (
    <section className="relative w-full overflow-hidden rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.2),0_2px_4px_-2px_rgb(0_0_0/0.1)]">
      <div
        className="absolute inset-0 bg-cover bg-center rounded-xl"
        style={{ backgroundImage: `url(${assets.cropRecommendation})` }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/70 to-black/40 rounded-xl" />

      <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <Sprout className="w-4 h-4" />
              <span>AI-Powered</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Smart Crop{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-green-300">
                Recommendation
              </span>
            </h2>

            <p className="text-gray-300 text-base sm:text-lg max-w-lg leading-relaxed">
              Enter your soil and climatic parameters and our AI model will
              recommend the best crops suited for your land — complete with
              detailed plantation guides.
            </p>

            <div className="space-y-3 pt-2">
              {highlights.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-gray-200 text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/crop-recommendation"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:from-emerald-400 hover:to-green-400 transition-all duration-300"
              >
                Try Crop Recommendation
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative w-full h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <Sprout className="w-10 h-10 text-white" />
                </div>
                <p className="text-white font-semibold text-lg text-center">
                  Soil + Climate Analysis
                </p>
                <p className="text-gray-400 text-sm text-center leading-relaxed">
                  Powered by Random Forest ML model trained on real agricultural data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CropRecommendationPreview
