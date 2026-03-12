import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserCheck, ArrowLeft, Loader2, AlertCircle, Users } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getVerifyWithExpertContext, createChatConversation, getDiseaseTreatments, sendChatMessage } from '../../services/api'

const VerifyWithExpert = () => {
  const { content } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const t = content?.diseaseDetection?.verifyWithExpert || {}

  const { predictionId, crop, predictedDisease, diseaseNameDisplay, imageUrl, diseaseConfidence } = location.state || {}

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [context, setContext] = useState(null)
  const [showExpertList, setShowExpertList] = useState(false)
  const [selectedExpertId, setSelectedExpertId] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchContext = async () => {
      setError('')
      setLoading(true)
      try {
        const res = await getVerifyWithExpertContext()
        if (cancelled) return
        if (res?.success && res?.data) setContext(res.data)
        else setContext({ previousExpert: null, availableExperts: [] })
      } catch (err) {
        if (!cancelled) setError(err?.message || t.errorLoad || 'Failed to load experts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchContext()
    return () => { cancelled = true }
  }, [t.errorLoad])

  const handleContinueWithPrevious = () => {
    if (!context?.previousExpert?.id) return
    setSelectedExpertId(context.previousExpert.id)
    startConversation(context.previousExpert.id)
  }

  const handleChooseExpert = (expertId) => {
    setSelectedExpertId(expertId)
    startConversation(expertId)
  }

  const startConversation = async (expertId) => {
    if (!predictionId || !expertId) return
    setCreating(true)
    setError('')
    try {
      const diseaseName = diseaseNameDisplay || predictedDisease || 'Unknown disease'
      const subject = `${diseaseName}${crop ? ` • ${crop}` : ''}`

      const res = await createChatConversation({
        type: 'disease_verification',
        diseasePredictionId: Number(predictionId),
        expertId: Number(expertId),
        subject,
      })
      if (res?.success && res?.data?.id) {
        const convId = res.data.id
        try {
          if (imageUrl) {
            await sendChatMessage(convId, {
              content: `Scan image for ${diseaseName}`,
              contentType: 'image',
              attachmentUrl: imageUrl,
            })
          }

          let treatmentInfo = null
          try {
            const tRes = await getDiseaseTreatments({ crop, className: predictedDisease })
            if (tRes?.success && tRes?.data) treatmentInfo = tRes.data
          } catch (_) {}

          const lines = [
            `🔬 Disease Verification Request`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `📋 Crop: ${crop || 'N/A'}`,
            `🦠 Detected Disease: ${diseaseName}`,
          ]

          if (diseaseConfidence != null) {
            lines.push(`📊 Confidence: ${(Number(diseaseConfidence) * 100).toFixed(1)}%`)
          }

          if (treatmentInfo) {
            if (treatmentInfo.severity_level) {
              lines.push(`⚠️ Severity: ${treatmentInfo.severity_level}`)
            }
            if (treatmentInfo.disease_desc) {
              lines.push(``, `📖 Description:`, treatmentInfo.disease_desc)
            }
            if (Array.isArray(treatmentInfo.preventive_measure) && treatmentInfo.preventive_measure.length) {
              lines.push(``, `🛡️ Preventive Measures:`)
              treatmentInfo.preventive_measure.forEach((m, i) => lines.push(`  ${i + 1}. ${m}`))
            }
            if (Array.isArray(treatmentInfo.treatment) && treatmentInfo.treatment.length) {
              lines.push(``, `💊 Treatment:`)
              treatmentInfo.treatment.forEach((t, i) => lines.push(`  ${i + 1}. ${t}`))
            }
            if (Array.isArray(treatmentInfo.recommended_medicine) && treatmentInfo.recommended_medicine.length) {
              lines.push(``, `💉 Recommended Medicine:`)
              treatmentInfo.recommended_medicine.forEach((m, i) => lines.push(`  ${i + 1}. ${m}`))
            }
          }

          lines.push(``, `━━━━━━━━━━━━━━━━━━━━━━`)
          lines.push(`Please review this diagnosis and provide your expert opinion.`)

          await sendChatMessage(convId, {
            content: lines.join('\n'),
            contentType: 'text',
          })
        } catch (_) {
          // Navigation still proceeds even if the intro messages fail
        }
        navigate(`/dashboard/user/chats?conversationId=${convId}`)
        return
      }
      setError(t.errorCreate || 'Could not start conversation.')
    } catch (err) {
      setError(err?.message || t.errorCreate || 'Could not start conversation.')
    } finally {
      setCreating(false)
      setSelectedExpertId(null)
    }
  }

  if (!predictionId) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-[#0a0f0a] text-slate-100 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/40 backdrop-blur-xl p-8 shadow-lg">
            <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">
              {t.noScanTitle || 'No scan result'}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {t.noScanMessage || 'Run a disease scan first, then use "Verify with expert" from the diagnosis report.'}
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

  const previousExpert = context?.previousExpert
  const availableExperts = context?.availableExperts ?? []

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#0a0f0a] text-slate-100">
      <div className="max-w-lg mx-auto">
        <Link
          to="/disease-detection/scan"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToScan || 'Back to scan'}
        </Link>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/40 backdrop-blur-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {t.title || 'Verify with expert'}
              </h1>
              {(diseaseNameDisplay || predictedDisease) && (
                <p className="text-slate-400 text-sm mt-0.5">
                  {diseaseNameDisplay || predictedDisease}
                  {crop ? ` • ${crop}` : ''}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{t.loading || 'Loading experts...'}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {previousExpert && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">
                    {t.continueWithPrevious || 'Continue with your previous expert'}
                  </p>
                  <button
                    type="button"
                    disabled={creating}
                    onClick={handleContinueWithPrevious}
                    className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-left hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating && selectedExpertId === previousExpert.id ? (
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">
                        {previousExpert.name || previousExpert.email || 'Expert'}
                      </p>
                      {previousExpert.roleSnapshot && (
                        <p className="text-xs text-slate-400">{previousExpert.roleSnapshot}</p>
                      )}
                    </div>
                    <span className="text-sm text-emerald-400 shrink-0">
                      {t.continue || 'Continue'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExpertList((v) => !v)}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {showExpertList ? t.hideList || 'Hide other experts' : t.chooseAnother || 'Choose another expert'}
                  </button>
                </div>
              )}

              {(showExpertList || !previousExpert) && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {previousExpert ? t.otherExperts || 'Other experts' : t.selectExpert || 'Select an expert'}
                  </p>
                  {availableExperts.length === 0 ? (
                    <p className="text-slate-500 text-sm py-2">{t.noExperts || 'No experts available.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {availableExperts
                        .filter((e) => !previousExpert || e.id !== previousExpert.id)
                        .map((expert) => (
                          <li key={expert.id}>
                            <button
                              type="button"
                              disabled={creating}
                              onClick={() => handleChooseExpert(expert.id)}
                              className="w-full flex items-center gap-3 rounded-xl border border-slate-600/80 bg-slate-800/50 px-4 py-3 text-left hover:border-emerald-500/40 hover:bg-emerald-500/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {creating && selectedExpertId === expert.id ? (
                                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-600/80 flex items-center justify-center shrink-0">
                                  <UserCheck className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">
                                  {expert.name || expert.email || 'Expert'}
                                </p>
                                {expert.roleSnapshot && (
                                  <p className="text-xs text-slate-400">{expert.roleSnapshot}</p>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyWithExpert
