import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UserCheck, Loader2, AlertCircle, Upload, Leaf, Shield, Lock, Download, MoreVertical } from 'lucide-react'
import { predictDisease, getDiseaseTreatments, getDiseaseByCropAndClass } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { openDiagnosisReportPdf } from '../../utils/diagnosisReportPdf'
import { toast } from 'react-toastify'

const reportTabs = [
  { id: 'overview', labelKey: 'overview', icon: Leaf },
  { id: 'prevention', labelKey: 'prevention', icon: Shield },
  { id: 'treatment', labelKey: 'treatment', icon: Lock },
]

const LeafUploadIcon = () => (
  <div className="w-16 h-16 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
    <Leaf className="w-10 h-10 text-emerald-400" />
  </div>
)


const normalizeClassName = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .toLowerCase()
}

const toPercent = (value) => {
  if (value == null) return null
  const n = Number(value)
  if (Number.isNaN(n)) return null

  const pct = n <= 1 ? n * 100 : n
  return Math.max(0, Math.min(100, Math.round(pct)))
}

const ML_TO_DB_CLASSNAME = {
  maize: {
    Blight: 'Blight',
    Common_Rust: 'Common_rust',
    Gray_Leaf_Spot: 'Gray_leaf_spot',
    Healthy: 'Healthy',
    MSV: 'MSV',
    MLB: 'MLB',
  },
  tomato: {
    'Tomato___Bacterial_spot': 'Bacterial_spot',
    'Tomato___Early_blight': 'Early_blight',
    'Tomato___Late_blight': 'Late_blight',
    'Tomato___Leaf_Mold': 'Leaf_mold',
    'Tomato___Septoria_leaf_spot': 'Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite': 'Spider_mites',
    'Tomato___Target_Spot': 'Target_spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus': 'Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus': 'Tomato_mosaic_virus',
    'Tomato___healthy': 'Healthy',
  },
  potato: {
    'Potato__Bacteria': 'Bacterial_infection',
    'Potato__Nematode': 'Nematodes',
    'Potato__Pest': 'Pest',
    'Potato___Early_blight': 'Early_blight',
    'Potato___Late_blight': 'Late_blight',
    'Potato___healthy': 'Healthy',
  },
}

function mlClassNameToDb(mlClass, crop) {
  if (!mlClass || !crop) return mlClass
  const map = ML_TO_DB_CLASSNAME[crop]
  if (!map) return mlClass
  if (map[mlClass]) return map[mlClass]
  // Fallback: strip crop prefix and normalize to DB convention
  let stripped = mlClass
    .replace(/^Tomato___/i, '')
    .replace(/^Potato___/i, '')
    .replace(/^Potato__/i, '')
  if (stripped !== mlClass) {
    stripped = stripped.replace(/\s+.*$/, '') // "Spider_mites Two-spotted_spider_mite" -> "Spider_mites"
    if (/^healthy$/i.test(stripped)) return 'Healthy'
    if (/^bacteria$/i.test(stripped) && crop === 'potato') return 'Bacterial_infection'
    if (/^nematode$/i.test(stripped) && crop === 'potato') return 'Nematodes'
    return stripped
  }
  return mlClass
}

const DiseaseDetectionScan = () => {
  const { content, locale } = useLanguage()
  const scanT = content?.diseaseDetection?.scan || {}

  const [selectedCrop, setSelectedCrop] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const [treatment, setTreatment] = useState(null)
  const [treatmentLoading, setTreatmentLoading] = useState(false)
  const [treatmentError, setTreatmentError] = useState('')
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [reportTab, setReportTab] = useState('overview')
  const [catalogDisease, setCatalogDisease] = useState(null)

  const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB
  const lang = locale === 'ne' ? 'ne' : 'en'

  // Fetch disease catalog (name, category, symptoms) from API when we have a result
  useEffect(() => {
    if (!result?.crop || !(result?.predictedDisease || result?.class)) {
      setCatalogDisease(null)
      return
    }
    const predictedClass = result.predictedDisease || result.class
    const dbClassName = mlClassNameToDb(predictedClass, selectedCrop)
    setCatalogDisease(null)
    const tryFetch = (crop, className) =>
      getDiseaseByCropAndClass(crop, className, lang).then((res) => res?.success && res?.data ? res.data : null)
    tryFetch(selectedCrop, dbClassName).then((data) => {
      if (data) return setCatalogDisease(data)
      if (dbClassName !== predictedClass) {
        return tryFetch(selectedCrop, predictedClass).then((d) => d && setCatalogDisease(d))
      }
    }).catch(() => {})
  }, [result?.crop, result?.predictedDisease, result?.class, selectedCrop, lang])

  // Auto-fetch treatment when we have a successful result so Diagnosis Report can show full data
  useEffect(() => {
    if (!result?.success || !(result?.predictedDisease || result?.class)) return
    const predictedClass = result.predictedDisease || result.class
    const dbClassName = mlClassNameToDb(predictedClass, selectedCrop)
    getDiseaseTreatments({ crop: selectedCrop, className: dbClassName, lang })
      .then((res) => {
        if (res?.success && res?.data) setTreatment(res.data)
      })
      .catch(() => {})
  }, [result?.success, result?.predictedDisease, result?.class, selectedCrop, locale])

  const cropOptions = [
    { cropKey: 'tomato', cropName: locale === 'ne' ? 'टमाटर (Golbera)' : 'Tomato (Golbera)' },
    { cropKey: 'potato', cropName: locale === 'ne' ? 'आलु (Aalu)' : 'Potato (Aalu)' },
    { cropKey: 'maize', cropName: locale === 'ne' ? 'मकै (Makai)' : 'Maize (Makai)' },
  ]

  const validateFile = (f) => {
    if (!f?.type?.match(/^image\/(jpeg|jpg|png|heic)/i)) {
      return scanT.errorUnsupportedFormat || 'Unsupported format. Use JPG, PNG, or HEIC.'
    }
    if (f.size > MAX_FILE_SIZE) {
      return scanT.errorFileTooLarge || 'File too large. Maximum 4 MB.'
    }
    return null
  }

  const setFileAndPreview = (chosen) => {
    if (!chosen) {
      setFile(null)
      setPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url)
        return null
      })
      setError('')
      return
    }
    const err = validateFile(chosen)
    if (err) {
      setError(err)
      toast.error(err)
      return
    }
    setFile(chosen)
    setError('')
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(chosen)
    })
  }

  const handleFileChange = (e) => {
    setFileAndPreview(e.target.files?.[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    setFileAndPreview(e.dataTransfer.files?.[0])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleRemoveFile = () => {
    setFile(null)
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url)
      return null
    })
    setError('')
    setResult(null)
  }

  const handleDownloadFile = () => {
    if (!file) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = file.name
    a.click()
  }

  const handleSaveAsPdf = () => {
    if (!result) return
    openDiagnosisReportPdf({
      title: diseaseNameDisplay || displayName,
      diseaseNameDisplay,
      displayName,
      cropLabel,
      categoryLabel,
      severityLabel,
      confidencePercent,
      descriptionLabel,
      symptomsLabel,
      preventiveMeasures: treatment?.preventive_measure,
      treatments: treatment?.treatment,
      recommendedMedicines: Array.isArray(treatment?.recommended_medicine)
        ? treatment.recommended_medicine
        : treatment?.recommended_medicine
        ? [treatment.recommended_medicine]
        : [],
      imageUrl: previewUrl || null,
    })
  }

  const handleScan = async () => {
    if (!file) {
      const msg = scanT.errorNoImage || 'Please upload a leaf image before scanning.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!selectedCrop) {
      const msg = scanT.errorSelectCrop || 'Please select a crop type before scanning.'
      setError(msg)
      toast.error(msg)
      return
    }
    try {
      setLoading(true)
      setError('')
      setResult(null)
      setTreatment(null)
      setTreatmentError('')
      setShowDiagnosis(false)
      const data = await predictDisease(file, selectedCrop)
      setResult(data)
    } catch (err) {
      const msg = err.message || scanT.errorAnalyzeFailed || 'Failed to analyze leaf image'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSeeDiagnosis = async () => {
    const predictedClass = result?.predictedDisease || result?.class
    if (!predictedClass) return
    const dbClassName = mlClassNameToDb(predictedClass, selectedCrop)
    const lang = locale === 'ne' ? 'ne' : 'en'
    setTreatmentLoading(true)
    setTreatmentError('')
    setTreatment(null)
    setShowDiagnosis(true)
    try {
      const res = await getDiseaseTreatments({
        crop: selectedCrop,
        className: dbClassName,
        lang
      })
      if (res?.success && res?.data) setTreatment(res.data)
      else setTreatmentError(scanT.errorNoTreatment || 'No treatment data found for this diagnosis.')
    } catch (err) {
      setTreatmentError(err?.message || scanT.loginToViewTreatment || 'Please log in as a farmer to view treatment and preventive measures.')
    } finally {
      setTreatmentLoading(false)
    }
  }

  const renderList = (arr, className = '') => {
    if (!arr) return null
    const items = Array.isArray(arr) ? arr : [arr]
    if (items.length === 0) return null
    return (
      <ul className={`list-disc list-inside space-y-1 text-sm text-slate-300 ${className}`}>
        {items.filter(Boolean).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )
  }

  const confidencePercent = toPercent(result?.diseaseConfidence)
  const isErrorState = !!error || (result && !result.success)

  const predictedClass = result?.predictedDisease || result?.class
  const displayName =
    catalogDisease?.general_name || result?.generalName || predictedClass || scanT.detected || 'Detected'

  const diseaseNameDisplay = (catalogDisease?.class_name ?? predictedClass ?? '')
    .replace(/_/g, ' ')
    .toUpperCase()
  // Try to infer category when DB category is missing
  const inferCategory = () => {
    if (catalogDisease?.category) return catalogDisease.category
    const name = (catalogDisease?.class_name || predictedClass || '').toLowerCase()
    if (!name) return null
    if (name.includes('bacterial')) return 'Bacterial'
    if (name.includes('rust')) return 'Fungal'
    if (name.includes('blight') || name.includes('spot') || name.includes('leaf_mold') || name.includes('septoria') || name.includes('target')) {
      return 'Fungal'
    }
    if (name.includes('virus') || name.includes('mosaic') || name.includes('streak')) return 'Viral'
    if (name.includes('nematode')) return 'Nematode'
    if (name.includes('mite') || name.includes('pest') || name.includes('moth')) return 'Insect'
    return null
  }

  const categoryLabel = inferCategory() || '-'
  const severityLabel = treatment?.severity_level || (confidencePercent != null ? `${confidencePercent}%` : '-')
  const descriptionLabel = treatment?.disease_desc ?? catalogDisease?.symptoms ?? '-'
  const symptomsLabel = catalogDisease?.symptoms ?? treatment?.disease_desc ?? '-'
  const cropLabel = cropOptions.find(c => c.cropKey === selectedCrop)?.cropName ?? selectedCrop

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#0a0f0a] text-slate-100 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {scanT.title || 'Disease Detection Scan'}
            </h1>
            <p className="text-slate-400 mt-2 max-w-xl">
              {scanT.subtitle || 'Upload a leaf photo and choose the crop type. Our AI model will analyze it to identify diseases and recommend treatment.'}
            </p>
          </div>
          <Link to="/disease-detection" className="hidden md:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
            {scanT.backToInfo || '← Back to information page'}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Upload */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/40 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                <Upload className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-slate-200">{scanT.upload || 'Upload'}</span>
            </div>

            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`block rounded-xl border-2 border-dashed overflow-hidden bg-slate-950/80 min-h-[280px] cursor-pointer transition-all ${
                isDragging ? 'border-emerald-400 bg-emerald-500/10' : 'border-emerald-500/50 hover:border-emerald-400/70 hover:bg-slate-800/30'
              }`}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Leaf" className="w-full h-full min-h-[280px] object-contain" />
              ) : (
                <div className="min-h-[280px] flex flex-col items-center justify-center gap-2 p-6">
                  <LeafUploadIcon />
                  <span className="text-slate-400 text-sm">{scanT.dragDrop || 'Drag & drop leaf image'}</span>
                  <span className="text-slate-500 text-xs">{scanT.orClick || 'or click to select'}</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/heic" className="hidden" onChange={handleFileChange} />
            </label>

            {file && (
              <div className="mt-3 flex items-center gap-2 text-slate-400 text-sm">
                <span className="flex-1 truncate" title={file.name}>{file.name}</span>
                <button type="button" onClick={handleDownloadFile} className="p-1.5 hover:text-emerald-400 rounded" title={scanT.download}><Download className="w-4 h-4" /></button>
                <button type="button" onClick={handleRemoveFile} className="p-1.5 hover:text-red-400 rounded" title={scanT.removeFile}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </button>
              </div>
            )}

            {loading && <p className="mt-2 text-sm text-emerald-400">{scanT.analyzing || 'Analyzing leaf photo...'}</p>}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{scanT.cropType || 'Crop type'} *</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">{scanT.selectCropPlaceholder || 'Select crop type'}</option>
                {cropOptions.map((opt) => (
                  <option key={opt.cropKey} value={opt.cropKey}>{opt.cropName}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleScan}
              className="mt-6 w-full py-3.5 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {scanT.scanLeaf || 'Scan leaf'}
            </button>

            {file && previewUrl && (
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-3">
                <img src={previewUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-slate-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{scanT.cropType || 'Crop type'}: {cropOptions.find(c => c.cropKey === selectedCrop)?.cropName ?? selectedCrop}</p>
                </div>
                <button type="button" onClick={handleDownloadFile} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg"><Download className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* Right: Diagnosis Report */}
          <div
            id="diagnosis-report"
            className="rounded-2xl border border-emerald-500/30 bg-slate-900/40 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-200">
                {scanT.diagnosisReport ?? 'Diagnosis Report'}
              </span>
              <button type="button" className="p-1.5 text-slate-400 hover:text-white rounded"><MoreVertical className="w-4 h-4" /></button>
            </div>

            {!result ? (
              <div className="rounded-xl overflow-hidden bg-slate-950/80 border border-slate-700/50 min-h-[320px] flex items-center justify-center">
                <p className="text-sm text-slate-500 text-center px-4">
                  {scanT.noImageSelected || 'No image selected. Upload and scan a leaf photo to see the diagnosis here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{diseaseNameDisplay || displayName}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {displayName}
                    {cropLabel ? ` • ${cropLabel}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {categoryLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {severityLabel}
                  </span>
                </div>
                {confidencePercent != null && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">{scanT.confidence || 'Confidence'}: {confidencePercent}%</span>
                    <div className="relative w-12 h-12 rounded-full border-2 border-slate-600 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-700" />
                        <circle
                          cx="18" cy="18" r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${(confidencePercent / 100) * 100.5} ${100.5 - (confidencePercent / 100) * 100.5}`}
                          className={isErrorState ? 'text-red-500' : 'text-emerald-500'}
                        />
                      </svg>
                      <span className={`absolute text-xs font-semibold ${isErrorState ? 'text-red-400' : 'text-emerald-400'}`}>{confidencePercent}%</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-1 border-b border-slate-700 pb-2">
                  {reportTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setReportTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${
                          reportTab === tab.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 border-b-0 -mb-0.5'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {scanT[tab.labelKey] ?? tab.labelKey}
                      </button>
                    )
                  })}
                </div>
                <div className="min-h-[190px] text-[0.95rem] md:text-base text-slate-200">
                  {reportTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{scanT.category || 'Category'}</p>
                          <p className="text-sm md:text-[0.95rem] font-medium text-emerald-300">{categoryLabel}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{scanT.severityLevel || 'Severity'}</p>
                          <p className="text-base md:text-lg font-semibold text-amber-300">{severityLabel}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">{scanT.description || 'Description'}:</p>
                        <p className="leading-relaxed">{descriptionLabel}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">{scanT.symptoms || 'Symptoms'}:</p>
                        <p className="leading-relaxed">{symptomsLabel}</p>
                      </div>
                      {treatment?.preventive_measure && (Array.isArray(treatment.preventive_measure) ? treatment.preventive_measure.length > 0 : treatment.preventive_measure) && (
                        <div>
                          <p className="text-slate-500 mb-1">{scanT.preventiveMeasures || 'Preventive measures'}</p>
                          {renderList(treatment.preventive_measure)}
                        </div>
                      )}
                      {treatment?.recommended_medicine && (Array.isArray(treatment.recommended_medicine) ? treatment.recommended_medicine.length > 0 : treatment.recommended_medicine) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(Array.isArray(treatment.recommended_medicine) ? treatment.recommended_medicine : [treatment.recommended_medicine]).map((m, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-200 text-xs">{m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {reportTab === 'prevention' && (
                    <div>
                      {treatment?.preventive_measure && (Array.isArray(treatment.preventive_measure) ? treatment.preventive_measure.length > 0 : treatment.preventive_measure)
                        ? renderList(treatment.preventive_measure)
                        : <p className="text-slate-500">{scanT.noPrevention ?? 'No preventive measures available.'}</p>}
                    </div>
                  )}
                  {reportTab === 'treatment' && (
                    <div className="space-y-3">
                      {treatment?.treatment && (Array.isArray(treatment.treatment) ? treatment.treatment.length > 0 : treatment.treatment)
                        ? renderList(treatment.treatment)
                        : <p className="text-slate-500">{scanT.noTreatment ?? 'No treatment details available.'}</p>}
                      {treatment?.recommended_medicine && (Array.isArray(treatment.recommended_medicine) ? treatment.recommended_medicine.length > 0 : treatment.recommended_medicine) && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1.5">{scanT.recommendedMedicine || 'Recommended medicine'}</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(treatment.recommended_medicine) ? treatment.recommended_medicine : [treatment.recommended_medicine]).map((m, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {treatmentLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {scanT.loadingTreatment || 'Loading treatment...'}
                  </div>
                )}
                {treatmentError && !treatmentLoading && (
                  <div className="flex items-start gap-2 text-amber-300 text-sm py-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{treatmentError}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    disabled={!result}
                    onClick={handleSaveAsPdf}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold text-sm md:text-base hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {scanT.saveAsPdf ?? 'Save as PDF'}
                  </button>
                  <Link
                    to="/disease-detection/verify-with-expert"
                    state={{
                      predictionId: result?.predictionId ?? result?.id,
                      crop: selectedCrop,
                      predictedDisease: result?.predictedDisease || result?.class,
                      diseaseNameDisplay: diseaseNameDisplay || displayName,
                      imageUrl: result?.imageUrl || null,
                      diseaseConfidence: result?.diseaseConfidence || null,
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-500/60 text-emerald-400 bg-transparent font-semibold text-sm md:text-base hover:bg-emerald-500/10 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    {scanT.verifyWithExpert || 'Verify with expert'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 md:hidden text-center">
          <Link
            to="/disease-detection"
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            {scanT.backToInfo || '← Back to information page'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetectionScan
