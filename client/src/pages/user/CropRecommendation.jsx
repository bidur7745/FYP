import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sprout, ArrowLeft, ArrowRight, Loader2, FlaskConical,
  Thermometer, Droplets, CloudRain, TestTubes, Sparkles,
  ExternalLink, AlertTriangle, CheckCircle2, Wand2, RotateCcw,
  Leaf, BarChart3
} from 'lucide-react'
import { recommendCropsWithGuides, generateMissingCropGuide } from '../../services/api'
import { assets } from '../../assets/images/assets'

const STORAGE_KEY = 'crop_recommendation_state'

const FIELDS = [
  { key: 'N', label: 'Nitrogen (N)', icon: TestTubes, unit: 'mg/kg', placeholder: 'e.g. 90', min: 0, max: 300 },
  { key: 'P', label: 'Phosphorus (P)', icon: TestTubes, unit: 'mg/kg', placeholder: 'e.g. 42', min: 0, max: 200 },
  { key: 'K', label: 'Potassium (K)', icon: TestTubes, unit: 'mg/kg', placeholder: 'e.g. 43', min: 0, max: 300 },
  { key: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', placeholder: 'e.g. 25', min: -10, max: 60 },
  { key: 'humidity', label: 'Humidity', icon: Droplets, unit: '%', placeholder: 'e.g. 80', min: 0, max: 100 },
  { key: 'ph', label: 'pH Level', icon: FlaskConical, unit: '', placeholder: 'e.g. 6.5', min: 0, max: 14, step: 0.1 },
  { key: 'rainfall', label: 'Rainfall', icon: CloudRain, unit: 'mm', placeholder: 'e.g. 200', min: 0, max: 5000 },
]

const INITIAL_VALUES = { N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: '' }

const saveState = (values, topK, results, generatedGuides) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ values, topK, results, generatedGuides }))
  } catch {}
}

const loadState = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const clearState = () => {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
}

const CropRecommendation = () => {
  const navigate = useNavigate()

  const saved = loadState()
  const [values, setValues] = useState(saved?.values || INITIAL_VALUES)
  const [topK, setTopK] = useState(saved?.topK || 3)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(saved?.results || null)
  const [error, setError] = useState('')
  const [generatingFor, setGeneratingFor] = useState(null)
  const [generatedGuides, setGeneratedGuides] = useState(saved?.generatedGuides || {})

  const persistState = useCallback(() => {
    saveState(values, topK, results, generatedGuides)
  }, [values, topK, results, generatedGuides])

  useEffect(() => {
    persistState()
  }, [persistState])

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  const isValid = FIELDS.every(f => values[f.key] !== '' && !isNaN(Number(values[f.key])))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError('')
    setResults(null)
    setGeneratedGuides({})
    try {
      const payload = {}
      FIELDS.forEach(f => { payload[f.key] = Number(values[f.key]) })
      payload.top_k = topK
      const res = await recommendCropsWithGuides(payload)
      if (res.success) {
        setResults(res.data)
      } else {
        setError(res.message || 'Failed to get recommendations')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateGuide = async (cropName) => {
    setGeneratingFor(cropName)
    try {
      const res = await generateMissingCropGuide(cropName)
      if (res.success) {
        setGeneratedGuides(prev => ({ ...prev, [cropName]: res.generatedGuide }))
      }
    } catch (err) {
      setGeneratedGuides(prev => ({ ...prev, [cropName]: { error: err.message } }))
    } finally {
      setGeneratingFor(null)
    }
  }

  const handleReset = () => {
    setValues(INITIAL_VALUES)
    setTopK(3)
    setResults(null)
    setError('')
    setGeneratedGuides({})
    clearState()
  }

  return (
    <div
      className="min-h-screen text-slate-100 pt-24 pb-16 px-2 sm:px-4 relative"
      style={{
        backgroundImage: `url(${assets.cropRecommendation})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />

      <div className="relative max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <div className="bg-linear-to-r from-emerald-900/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-emerald-700/30 shadow-xl p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Crop Recommendation</h1>
              <p className="text-emerald-200/70 text-sm mt-0.5">Enter soil & climate parameters for AI-powered crop suggestions</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        {!results && !loading && (
          <form onSubmit={handleSubmit} className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-5 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FIELDS.map(({ key, label, icon: Icon, unit, placeholder, min, max, step }) => (
                <div key={key} className="group">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
                    <Icon size={15} className="text-emerald-400" />
                    {label}
                    {unit && <span className="text-gray-500 text-xs">({unit})</span>}
                  </label>
                  <input
                    type="number"
                    value={values[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    step={step || 'any'}
                    required
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all group-hover:border-slate-500/50"
                  />
                </div>
              ))}

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1.5">
                  <Sparkles size={15} className="text-emerald-400" />
                  Top Recommendations
                </label>
                <select
                  value={topK}
                  onChange={e => setTopK(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all group-hover:border-slate-500/50"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>Top {n}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-5 p-4 bg-red-900/30 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!isValid || loading}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sprout size={18} />
                Get Recommendations
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-600/50 text-gray-300 hover:bg-slate-700/50 transition-all"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400" size={24} />
              </div>
              <p className="text-gray-300 font-medium">Analyzing soil & climate parameters...</p>
              <p className="text-gray-500 text-sm">Our AI is finding the best crops for your conditions</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-5">
            {/* Results header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-400" />
                Recommendations
              </h2>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-600/50 text-gray-300 hover:bg-slate-700/50 transition-all"
              >
                <RotateCcw size={14} />
                New Analysis
              </button>
            </div>

            {/* Input summary */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/30 p-4">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Input Parameters</p>
              <div className="flex flex-wrap gap-2">
                {FIELDS.map(({ key, label, unit }) => (
                  <span key={key} className="px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs text-gray-300 border border-slate-600/30">
                    {label}: <span className="text-emerald-300 font-semibold">{results.inputs?.[key]}</span>
                    {unit && ` ${unit}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommendation cards */}
            {results.recommendations?.map((rec, idx) => (
              <div
                key={idx}
                className={`bg-slate-900/70 backdrop-blur-sm rounded-2xl border shadow-xl overflow-hidden transition-all hover:shadow-2xl ${
                  rec.foundInDatabase
                    ? 'border-emerald-700/40 hover:border-emerald-600/50'
                    : 'border-amber-700/40 hover:border-amber-600/50'
                }`}
              >
                {/* Rank indicator */}
                {idx === 0 && (
                  <div className="bg-linear-to-r from-yellow-600/30 to-amber-600/20 px-5 py-1.5 border-b border-yellow-600/20">
                    <span className="text-yellow-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 size={12} />
                      Best Match
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Crop image */}
                    {rec.foundInDatabase && rec.crop?.imageUrl ? (
                      <img
                        src={rec.crop.imageUrl}
                        alt={rec.cropName}
                        className="w-24 h-24 object-cover rounded-xl border border-slate-600/50 shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-linear-to-br from-emerald-900/40 to-slate-800/60 flex items-center justify-center border border-slate-600/50 shrink-0">
                        <Leaf className="w-10 h-10 text-emerald-500/60" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Name and score */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white capitalize">{rec.cropName}</h3>
                        {rec.score != null && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            rec.score >= 0.5
                              ? 'bg-emerald-800/50 text-emerald-200 border-emerald-600/30'
                              : rec.score >= 0.2
                              ? 'bg-blue-800/50 text-blue-200 border-blue-600/30'
                              : 'bg-slate-700/50 text-slate-300 border-slate-500/30'
                          }`}>
                            {(rec.score * 100).toFixed(1)}% match
                          </span>
                        )}
                      </div>

                      {rec.foundInDatabase ? (
                        <>
                          {/* Crop metadata tags */}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                            {rec.crop?.cropCategory && (
                              <span className="px-2.5 py-1 bg-slate-800/60 rounded-lg border border-slate-600/30 flex items-center gap-1">
                                <Leaf size={10} className="text-emerald-400" />
                                {rec.crop.cropCategory}
                              </span>
                            )}
                            {rec.crop?.season && (
                              <span className="px-2.5 py-1 bg-slate-800/60 rounded-lg border border-slate-600/30">
                                {rec.crop.season}
                              </span>
                            )}
                            {rec.crop?.soilType && (
                              <span className="px-2.5 py-1 bg-slate-800/60 rounded-lg border border-slate-600/30">
                                Soil: {rec.crop.soilType}
                              </span>
                            )}
                            {rec.crop?.waterRequirement && (
                              <span className="px-2.5 py-1 bg-slate-800/60 rounded-lg border border-slate-600/30 flex items-center gap-1">
                                <Droplets size={10} className="text-blue-400" />
                                {rec.crop.waterRequirement}
                              </span>
                            )}
                          </div>

                          {!rec.guideAvailable && rec.guideMessage && (
                            <p className="mt-3 text-amber-300/80 text-sm flex items-center gap-1.5">
                              <AlertTriangle size={14} />
                              {rec.guideMessage}
                            </p>
                          )}

                          {/* Action buttons */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              to={`/crop-advisory/${rec.crop.cropId}`}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-md shadow-emerald-900/30"
                            >
                              View Crop Details
                              <ExternalLink size={14} />
                            </Link>
                            {rec.guideAvailable && (
                              <Link
                                to={`/crop-advisory/${rec.crop.cropId}/agro-recommendations`}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-md shadow-blue-900/30"
                              >
                                Agro Recommendations
                                <ArrowRight size={14} />
                              </Link>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-amber-300/80 text-sm flex items-start gap-1.5">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            {rec.message}
                          </p>

                          {rec.actions?.canGenerateWithDeepSeek && !generatedGuides[rec.cropName] && (
                            <button
                              onClick={() => handleGenerateGuide(rec.cropName)}
                              disabled={generatingFor === rec.cropName}
                              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium transition-all disabled:opacity-50 shadow-md shadow-purple-900/30"
                            >
                              {generatingFor === rec.cropName ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Generating Guide...
                                </>
                              ) : (
                                <>
                                  <Wand2 size={16} />
                                  {rec.actions.buttonLabel || 'Generate Guide with DeepSeek'}
                                </>
                              )}
                            </button>
                          )}

                          {generatedGuides[rec.cropName] && !generatedGuides[rec.cropName].error && (
                            <GeneratedGuidePreview guide={generatedGuides[rec.cropName]} />
                          )}

                          {generatedGuides[rec.cropName]?.error && (
                            <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-xl">
                              <p className="text-red-300 text-sm">{generatedGuides[rec.cropName].error}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const GeneratedGuidePreview = ({ guide }) => {
  const data = guide?.responseJson || guide
  if (!data) return null

  return (
    <div className="mt-4 p-4 bg-purple-900/20 border border-purple-700/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-purple-400" />
        <p className="text-purple-200 text-sm font-medium">
          Guide generated and submitted for admin review
        </p>
      </div>

      {data.overview && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Overview</p>
          <p className="text-gray-200 text-sm leading-relaxed">{data.overview}</p>
        </div>
      )}

      {data.soilPreparation && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Soil Preparation</p>
          <p className="text-gray-200 text-sm leading-relaxed">{data.soilPreparation}</p>
        </div>
      )}

      {data.schedule && data.schedule.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
            Schedule ({data.schedule.length} stages)
          </p>
          <div className="space-y-1.5">
            {data.schedule.slice(0, 3).map((stage, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-purple-400 shrink-0">•</span>
                <span className="text-gray-300">
                  <span className="font-medium text-purple-200">{stage.stage}</span>
                  {stage.timing && <span className="text-gray-500"> — {stage.timing}</span>}
                </span>
              </div>
            ))}
            {data.schedule.length > 3 && (
              <p className="text-gray-500 text-xs pl-4">+{data.schedule.length - 3} more stages</p>
            )}
          </div>
        </div>
      )}

      {data.tips && data.tips.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Tips</p>
          {data.tips.slice(0, 2).map((tip, i) => (
            <p key={i} className="text-gray-300 text-sm flex items-start gap-1.5">
              <span className="text-emerald-400 shrink-0">✓</span>
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default CropRecommendation
