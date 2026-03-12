import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Info, Leaf, Bug, Sprout, ClipboardList,
  AlertTriangle, Lightbulb, FlaskConical, RefreshCw, CheckCircle2
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getAllCrops, getAgroRecommendations } from '../../services/api'

const AgroRecommendations = () => {
  const { cropId } = useParams()
  const navigate = useNavigate()
  const { content, locale } = useLanguage()
  const t = content?.cropDetailsPage || {}

  const [crop, setCrop] = useState(null)
  const [agroData, setAgroData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agroLoading, setAgroLoading] = useState(true)
  const [error, setError] = useState('')
  const [agroError, setAgroError] = useState('')
  const [activeTab, setActiveTab] = useState('fertilizers')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) { navigate('/signup'); return }
    loadData()
  }, [cropId])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getAllCrops()
      if (res.success) {
        const found = res.crops.find(c => c.cropId === parseInt(cropId))
        if (!found) { setError('Crop not found'); return }
        setCrop(found)
      }
    } catch (err) {
      setError(err.message || 'Failed to load crop')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (crop) fetchRecommendations()
  }, [crop, locale])

  const fetchRecommendations = async () => {
    try {
      setAgroLoading(true)
      setAgroError('')
      const res = await getAgroRecommendations(parseInt(cropId), locale || 'en')
      if (res.success) {
        setAgroData(res.recommendation)
      } else {
        setAgroError(res.message || 'Failed to load recommendations')
      }
    } catch (err) {
      setAgroError(err.message || 'Failed to load recommendations')
    } finally {
      setAgroLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-400" size={48} />
        </div>
      </div>
    )
  }

  if (error || !crop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-900/50 border border-red-500/50 text-red-100 px-6 py-4 rounded-xl">
            <p>{error || 'Crop not found'}</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              {t.backToCropAdvisory || 'Go Back'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'fertilizers', label: t.fertilizers || 'Fertilizers & Manure', icon: Leaf, active: 'bg-emerald-600', border: 'border-emerald-700/25', bg: 'bg-emerald-900/15', heading: 'text-emerald-100', sub: 'text-emerald-300/70' },
    { key: 'pesticides', label: t.pesticides || 'Pesticides & Insecticides', icon: Bug, active: 'bg-red-600', border: 'border-red-700/25', bg: 'bg-red-900/15', heading: 'text-red-100', sub: 'text-red-300/70' },
    { key: 'herbicides', label: t.herbicides || 'Herbicides', icon: Sprout, active: 'bg-yellow-600', border: 'border-yellow-700/25', bg: 'bg-yellow-900/15', heading: 'text-yellow-100', sub: 'text-yellow-300/70' },
    { key: 'schedule', label: t.applicationSchedule || 'Application Schedule', icon: ClipboardList, active: 'bg-blue-600', border: 'border-blue-700/25', bg: 'bg-blue-900/15', heading: 'text-blue-100', sub: 'text-blue-300/70' },
    { key: 'tips', label: t.tipsAndWarnings || 'Tips & Warnings', icon: Lightbulb, active: 'bg-purple-600', border: 'border-purple-700/25', bg: 'bg-purple-900/15', heading: 'text-purple-100', sub: 'text-purple-300/70' },
  ]

  const TypeBadge = ({ type }) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      type?.toLowerCase().includes('organic') ? 'bg-green-800/60 text-green-200 border border-green-600/30'
      : type?.toLowerCase().includes('bio') ? 'bg-teal-800/60 text-teal-200 border border-teal-600/30'
      : 'bg-slate-700/60 text-slate-200 border border-slate-500/30'
    }`}>
      {type}
    </span>
  )

  const InfoGrid = ({ item, fields }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      {fields.map(({ key, label, color }) => item[key] && (
        <div key={key}>
          <span className="text-gray-400">{label}:</span>{' '}
          <span className={color || 'text-gray-200'}>{item[key]}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate(`/crop-advisory/${cropId}`)} className="mb-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          <ArrowLeft size={20} />
          <span>{crop.cropName} — {t.backToCropAdvisory || 'Back to Details'}</span>
        </button>

        {/* Crop Header */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-5">
          {crop.imageUrl ? (
            <img src={crop.imageUrl} alt={crop.cropName} className="w-24 h-24 object-cover rounded-xl border border-slate-600/50" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-emerald-900/30 flex items-center justify-center text-4xl border border-slate-600/50">🌾</div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <FlaskConical className="text-emerald-400" size={24} />
              {t.agroRecommendations || 'Fertilizer & Pesticide Guide'}
            </h1>
            <p className="text-emerald-200/70 text-sm mt-1">{crop.cropName} {crop.cropCategory ? `· ${crop.cropCategory}` : ''}</p>
            <p className="text-gray-400 text-xs mt-0.5">{t.agroSubtitle || 'AI-powered fertilizer, pesticide & herbicide advice for this crop'}</p>
          </div>
          {agroData && !agroLoading && (
            <button onClick={fetchRecommendations} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg transition-colors border border-slate-600/50">
              <RefreshCw size={14} />
              {t.agroRetry || 'Regenerate'}
            </button>
          )}
        </div>

        {/* Loading */}
        {agroLoading && (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-emerald-400" size={40} />
              <p className="text-gray-400 text-sm">{t.agroLoading || 'Generating personalized recommendations...'}</p>
              <p className="text-gray-500 text-xs">This may take 10-15 seconds on first load</p>
            </div>
          </div>
        )}

        {/* Error */}
        {agroError && !agroLoading && (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-red-700/30 shadow-xl p-6 text-center py-16">
            <p className="text-red-400 text-sm mb-4">{agroError}</p>
            <button onClick={fetchRecommendations} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">
              {t.agroRetry || 'Retry'}
            </button>
          </div>
        )}

        {/* Content */}
        {agroData && !agroLoading && (
          <>
            {/* Overview & Soil Preparation */}
            {(agroData.overview || agroData.soilPreparation) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {agroData.overview && (
                  <div className="p-5 bg-slate-900/60 rounded-2xl border border-emerald-700/30 shadow-xl">
                    <h4 className="font-semibold text-emerald-200 mb-2 text-sm flex items-center gap-1.5">
                      <Info size={16} />
                      {t.overview || 'Overview'}
                    </h4>
                    <p className="text-gray-200 text-sm leading-relaxed">{agroData.overview}</p>
                  </div>
                )}
                {agroData.soilPreparation && (
                  <div className="p-5 bg-slate-900/60 rounded-2xl border border-amber-700/30 shadow-xl">
                    <h4 className="font-semibold text-amber-200 mb-2 text-sm flex items-center gap-1.5">
                      <Sprout size={16} />
                      {t.soilPreparation || 'Soil Preparation'}
                    </h4>
                    <p className="text-gray-200 text-sm leading-relaxed">{agroData.soilPreparation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {tabs.map(({ key, label, icon: Icon, active }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === key
                      ? `${active} text-white shadow-lg`
                      : 'bg-slate-800/70 text-gray-300 hover:bg-slate-700 border border-slate-600/40'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Fertilizers */}
            {activeTab === 'fertilizers' && agroData.fertilizers && (
              <div className="space-y-3">
                {agroData.fertilizers.map((item, i) => (
                  <div key={i} className="p-5 bg-slate-900/60 rounded-2xl border border-emerald-700/25 shadow-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-emerald-100">{item.name}</h5>
                        {item.nepaliName && <p className="text-emerald-300/70 text-xs mt-0.5">{item.nepaliName}</p>}
                      </div>
                      <TypeBadge type={item.type} />
                    </div>
                    <InfoGrid item={item} fields={[
                      { key: 'dosage', label: t.dosage || 'Dosage' },
                      { key: 'timing', label: t.timing || 'Timing' },
                      { key: 'method', label: t.method || 'Method' },
                      { key: 'estimatedCostNPR', label: t.estimatedCost || 'Est. Cost', color: 'text-emerald-300' },
                    ]} />
                  </div>
                ))}
              </div>
            )}

            {/* Pesticides */}
            {activeTab === 'pesticides' && agroData.pesticides_and_insecticides && (
              <div className="space-y-3">
                {agroData.pesticides_and_insecticides.map((item, i) => (
                  <div key={i} className="p-5 bg-slate-900/60 rounded-2xl border border-red-700/25 shadow-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-red-100">{item.name}</h5>
                        {item.nepaliName && <p className="text-red-300/70 text-xs mt-0.5">{item.nepaliName}</p>}
                      </div>
                      <TypeBadge type={item.type} />
                    </div>
                    {item.targetPest && (
                      <p className="text-xs text-red-300/80 mb-3"><span className="text-gray-400">{t.targetPest || 'Target Pest'}:</span> {item.targetPest}</p>
                    )}
                    <InfoGrid item={item} fields={[
                      { key: 'dosage', label: t.dosage || 'Dosage' },
                      { key: 'timing', label: t.timing || 'Timing' },
                      { key: 'method', label: t.method || 'Method' },
                      { key: 'safetyPeriod', label: t.safetyPeriod || 'Safety Period', color: 'text-yellow-300' },
                      { key: 'estimatedCostNPR', label: t.estimatedCost || 'Est. Cost', color: 'text-emerald-300' },
                    ]} />
                  </div>
                ))}
              </div>
            )}

            {/* Herbicides */}
            {activeTab === 'herbicides' && agroData.herbicides_and_weedicides && (
              <div className="space-y-3">
                {agroData.herbicides_and_weedicides.map((item, i) => (
                  <div key={i} className="p-5 bg-slate-900/60 rounded-2xl border border-yellow-700/25 shadow-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-yellow-100">{item.name}</h5>
                        {item.nepaliName && <p className="text-yellow-300/70 text-xs mt-0.5">{item.nepaliName}</p>}
                      </div>
                      <TypeBadge type={item.type} />
                    </div>
                    {item.targetWeed && (
                      <p className="text-xs text-yellow-300/80 mb-3"><span className="text-gray-400">{t.targetWeed || 'Target Weed'}:</span> {item.targetWeed}</p>
                    )}
                    <InfoGrid item={item} fields={[
                      { key: 'dosage', label: t.dosage || 'Dosage' },
                      { key: 'timing', label: t.timing || 'Timing' },
                      { key: 'method', label: t.method || 'Method' },
                      { key: 'estimatedCostNPR', label: t.estimatedCost || 'Est. Cost', color: 'text-emerald-300' },
                    ]} />
                  </div>
                ))}
              </div>
            )}

            {/* Schedule */}
            {activeTab === 'schedule' && agroData.schedule && (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-blue-700/30" />
                <div className="space-y-4">
                  {agroData.schedule.map((item, i) => (
                    <div key={i} className="relative pl-12">
                      <div className="absolute left-3.5 top-5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-slate-800 z-10" />
                      <div className="p-5 bg-slate-900/60 rounded-2xl border border-blue-700/25 shadow-xl">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h5 className="font-semibold text-blue-100">{item.stage}</h5>
                          {item.timing && (
                            <span className="px-2.5 py-0.5 bg-blue-800/50 text-blue-200 rounded-full text-xs border border-blue-600/30">
                              {item.timing}
                            </span>
                          )}
                        </div>
                        {item.actions && (
                          <ul className="space-y-1.5">
                            {(Array.isArray(item.actions) ? item.actions : [item.action]).map((action, j) => (
                              <li key={j} className="text-gray-200 text-sm flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-blue-400 mt-0.5 shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        )}
                        {!item.actions && item.action && (
                          <p className="text-gray-200 text-sm">{item.action}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips & Warnings */}
            {activeTab === 'tips' && (
              <div className="space-y-5">
                {agroData.tips && agroData.tips.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-purple-200 mb-3 flex items-center gap-1.5">
                      <Lightbulb size={16} />
                      {t.tips || 'Tips'}
                    </h4>
                    <div className="space-y-2">
                      {agroData.tips.map((tip, i) => (
                        <div key={i} className="p-4 bg-slate-900/60 rounded-2xl border border-purple-700/25 shadow-xl flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-purple-400 mt-0.5 shrink-0" />
                          <p className="text-gray-200 text-sm leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {agroData.warnings && agroData.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-200 mb-3 flex items-center gap-1.5">
                      <AlertTriangle size={16} />
                      {t.warnings || 'Warnings'}
                    </h4>
                    <div className="space-y-2">
                      {agroData.warnings.map((warning, i) => (
                        <div key={i} className="p-4 bg-slate-900/60 rounded-2xl border border-orange-700/25 shadow-xl flex items-start gap-3">
                          <AlertTriangle size={16} className="text-orange-400 mt-0.5 shrink-0" />
                          <p className="text-gray-200 text-sm leading-relaxed">{warning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AgroRecommendations
