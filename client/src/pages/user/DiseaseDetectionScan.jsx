import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { predictDisease } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import diseaseCatalogEn from '../../locales/disease_catalog_en.json'
import diseaseCatalogNe from '../../locales/disease_catalog_ne.json'

// Leaf + upload icon for drag-drop zone
const LeafUploadIcon = () => (
  <div className="relative">
    <div className="w-16 h-16 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
      <svg viewBox="0 0 48 48" className="w-10 h-10 text-emerald-400" fill="currentColor">
        <path d="M24 4c-2 6-6 10-12 12 6 2 10 6 12 12 2-6 6-10 12-12-6-2-10-6-12-12z" opacity="0.9" />
        <path d="M24 20l-4 8h8l-4-8z" opacity="0.6" />
      </svg>
      <span className="absolute -top-1 -right-1 text-emerald-400">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 17L17 7M17 7h-8M17 7v8" />
        </svg>
      </span>
    </div>
  </div>
)

/**
 * Normalize className for lookup - ML may return various formats:
 * Bacterial_spot, Bacterial spot, bacterial_spot, Bacterial-Spot
 */
const normalizeClassName = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .toLowerCase()
}

/**
 * Look up disease from catalog by crop + ML output (className).
 * Handles className variations: Bacterial_spot, Bacterial spot, bacterial_spot, etc.
 */
const getDiseaseFromCatalog = (crop, mlClass, locale) => {
  const catalog = locale === 'ne' ? diseaseCatalogNe : diseaseCatalogEn
  const cropData = catalog.crops?.find((c) => c.cropKey === crop)
  if (!cropData?.diseases) return null

  const normalized = normalizeClassName(mlClass)
  const diseases = cropData.diseases

  // Exact match (case-insensitive, underscore normalized)
  const exact = diseases.find((d) => normalizeClassName(d.className) === normalized)
  if (exact) return exact

  // Partial match: ML returns "Bacterial spot" vs catalog "Bacterial_spot"
  const partial = diseases.find(
    (d) =>
      normalized.includes(normalizeClassName(d.className)) ||
      normalizeClassName(d.className).includes(normalized)
  )
  if (partial) return partial

  // Fallback: compare without underscores (e.g. "Bacterialspot" vs "Bacterial_spot")
  const noUnderscore = (s) => normalizeClassName(s).replace(/_/g, '')
  return diseases.find((d) => noUnderscore(d.className) === noUnderscore(mlClass)) || null
}

const DiseaseDetectionScan = () => {
  const { content, locale } = useLanguage()
  const scanT = content?.diseaseDetection?.scan || {}

  const [selectedCrop, setSelectedCrop] = useState('tomato')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB

  const catalog = locale === 'ne' ? diseaseCatalogNe : diseaseCatalogEn
  const cropOptions = catalog.crops ?? [
    { cropKey: 'tomato', cropName: 'Tomato (Golbera)' },
    { cropKey: 'potato', cropName: 'Potato (Aalu)' },
    { cropKey: 'maize', cropName: 'Maize (Makai)' }
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

  const handleScan = async () => {
    if (!file) return
    try {
      setLoading(true)
      setError('')
      setResult(null)
      const data = await predictDisease(file, selectedCrop)
      setResult(data)
    } catch (err) {
      setError(err.message || scanT.errorAnalyzeFailed || 'Failed to analyze leaf image')
    } finally {
      setLoading(false)
    }
  }

  const confidence = result?.diseaseConfidence != null ? Number(result.diseaseConfidence) : null
  const confidencePercent = confidence != null ? Math.round(confidence * 100) : null
  const isErrorState = !!error || (result && !result.success)

  const predictedClass = result?.predictedDisease || result?.class
  const catalogDisease = getDiseaseFromCatalog(result?.crop, predictedClass, locale)
  const displayName =
    catalogDisease?.generalName || result?.generalName || predictedClass || scanT.detected || 'Detected'

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#0a0f0a] text-slate-100 overflow-hidden relative">
      {/* Background subtle pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.15) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {scanT.title || 'Disease Detection Scan'}
            </h1>
            <p className="text-slate-400 mt-2 max-w-xl">
              {scanT.subtitle ||
                "Upload a clear leaf photo and choose the crop type. In the next step, we'll send the image to the AI microservice for diagnosis."}
            </p>
          </div>
          <Link
            to="/disease-detection"
            className="hidden md:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            {scanT.backToInfo || '← Back to information page'}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Upload panel */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/40 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold text-slate-200">
                {scanT.upload || 'Upload'}
              </span>
              <span
                className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                title={scanT.required || 'Required'}
              />
            </div>

            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-emerald-500/50 hover:border-emerald-400/70 hover:bg-slate-800/30'
              }`}
            >
              <LeafUploadIcon />
              <span className="text-base font-semibold text-white">
                {scanT.dragDrop || 'Drag & drop leaf image'}
              </span>
              <span className="text-sm text-slate-400">
                {scanT.orClick || 'or click to select file'}
              </span>
              <span className="text-xs text-slate-500">
                {scanT.acceptedFormats ||
                  'Accepted formats: JPG, PNG, HEIC · Maximum file size: 4 MB'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/heic"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {file && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-800/60 border border-slate-700/60 px-3 py-2.5">
                <span className="flex-1 text-sm text-slate-200 truncate" title={file.name}>
                  {file.name}
                </span>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                  title={`${(file.size / 1024).toFixed(1)} KB · ${file.type}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                  title={scanT.removeFile || 'Remove file'}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                  title={scanT.download || 'Download'}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {scanT.cropType || 'Crop type'}
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/50"
              >
                {cropOptions.map((opt) => (
                  <option key={opt.cropKey} value={opt.cropKey}>
                    {opt.cropName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={!file || loading}
              onClick={handleScan}
              className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
                file && !loading
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_24px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? (scanT.analyzing || 'Analyzing...') : (scanT.scanLeaf || 'Scan leaf')}
            </button>
          </div>

          {/* Right: Preview & Validation panel */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/40 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-slate-200">
                {scanT.previewValidation || 'Preview & Validation'}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950/80 border border-slate-700/50 min-h-[200px] flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Leaf preview"
                  className="w-full max-h-80 object-contain"
                />
              ) : (
                <p className="text-sm text-slate-500 text-center px-4">
                  {scanT.noImageSelected ||
                    'No image selected. Choose a leaf photo to see a preview here.'}
                </p>
              )}
            </div>

            {confidencePercent != null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className={isErrorState ? 'text-red-400' : 'text-slate-300'}>
                    {scanT.confidence || 'Confidence'}
                  </span>
                  <span
                    className={
                      isErrorState ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'
                    }
                  >
                    {confidencePercent}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isErrorState ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(confidencePercent, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-xl border border-red-500/50 bg-red-500/10">
                <p className="text-sm text-red-300">{error}</p>
                <div className="mt-2 h-0.5 rounded-full bg-red-500/30" />
              </div>
            )}

            {result && result.success && !error && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 space-y-1.5">
                <p className="text-slate-300 text-sm">
                  <span className="text-slate-400">{scanT.className || 'Class name'}:</span>{' '}
                  <span className="font-medium text-slate-100">
                    {catalogDisease?.className ?? predictedClass ?? '-'}
                  </span>
                </p>
                <p className="text-slate-300 text-sm">
                  <span className="text-slate-400">{scanT.generalName || 'General name'}:</span>{' '}
                  <span className="font-medium text-emerald-300">{displayName}</span>
                </p>
                <p className="text-slate-300 text-sm">
                  <span className="text-slate-400">{scanT.category || 'Category'}:</span>{' '}
                  <span className="font-medium text-slate-100">
                    {catalogDisease?.category ?? '-'}
                  </span>
                </p>
                <p className="text-slate-300 text-sm">
                  <span className="text-slate-400">{scanT.scientificName || 'Scientific name'}:</span>{' '}
                  <span className="italic text-slate-200">
                    {catalogDisease?.scientificName ?? '-'}
                  </span>
                </p>
                <p className="text-slate-300 text-sm pt-1">
                  <span className="text-slate-400">{scanT.confidencePercent || 'Confidence percentage'}:</span>{' '}
                  <span className="font-medium text-emerald-400">{confidencePercent}%</span>
                </p>
                {result.leafCheck && (
                  <p className="text-slate-500 text-xs mt-1.5 pt-1 border-t border-slate-600/50">
                    {scanT.leafCheck || 'Leaf check'}: {result.leafCheck.class} (
                    {Math.round((result.leafCheck.confidence ?? 0) * 100)}%)
                  </p>
                )}
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
