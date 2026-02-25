import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

const DiseaseDetectionScan = () => {
  const { content } = useLanguage()
  const [selectedCrop, setSelectedCrop] = useState('tomato')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0]
    if (!chosen) {
      setFile(null)
      setPreviewUrl(null)
      return
    }
    setFile(chosen)
    const url = URL.createObjectURL(chosen)
    setPreviewUrl(url)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 pt-24 pb-16 bg-slate-950 text-slate-100">
      <div className="max-w-3xl w-full rounded-2xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              KrishiMitra&apos;s
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">
              Disease Detection Scan
            </h1>
            <p className="text-slate-300 text-sm mt-2">
              Upload a clear leaf photo and choose the crop type. In the next step this page will send the image to the AI microservice for diagnosis.
            </p>
          </div>
          <Link
            to="/disease-detection"
            className="hidden md:inline-flex text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            ← Back to information page
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left: upload and crop selection */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Leaf image
              </label>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-emerald-500/40 rounded-xl px-4 py-6 cursor-pointer hover:border-emerald-400 hover:bg-slate-800/40 transition-colors">
                <span className="text-sm text-slate-200">
                  {file ? file.name : 'Click to choose an image'}
                </span>
                <span className="text-xs text-slate-400">
                  Supported: JPG, PNG, HEIC (max a few MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Crop type
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full rounded-lg border border-emerald-500/40 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                <option value="tomato">🍅 Tomato (Golbera)</option>
                <option value="potato">🥔 Potato (Aalu)</option>
                <option value="maize">🌽 Maize (Makai)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Choose the crop that matches the leaf in your image so results are interpreted correctly.
              </p>
            </div>

            <button
              type="button"
              disabled={!file}
              className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                file
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              Scan leaf (frontend only for now)
            </button>
          </div>

          {/* Right: preview */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-4 flex flex-col items-center justify-center">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Selected leaf preview"
                    className="w-full max-h-72 object-contain rounded-xl mb-3"
                  />
                  <p className="text-xs text-slate-300">
                    Preview of your leaf image for <span className="font-semibold">{selectedCrop}</span>.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center">
                  No image selected yet. Choose a leaf photo on the left to see a preview here.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 md:hidden text-center">
          <Link
            to="/disease-detection"
            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
          >
            ← Back to information page
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetectionScan
