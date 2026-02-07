import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Building, Globe, ExternalLink, FileText, CheckCircle2, XCircle, Clock, Share2, Download, DollarSign, ClipboardList, AlertTriangle, Landmark, Home, Clipboard } from 'lucide-react'
import { getGovernmentSchemeById } from '../../services/api'

const SchemeDetails = () => {
  const { schemeId } = useParams()
  const navigate = useNavigate()
  const [scheme, setScheme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (schemeId) {
      fetchSchemeDetails()
    }
  }, [schemeId])

  const fetchSchemeDetails = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getGovernmentSchemeById(schemeId, false) // Use cache
      if (response.success && response.scheme) {
        setScheme(response.scheme)
      } else {
        setError('Scheme not found')
      }
    } catch (err) {
      console.error('Error fetching scheme details:', err)
      setError(err.message || 'Failed to load scheme details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/40">
            <CheckCircle2 size={14} />
            Active
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
            <XCircle size={14} />
            Expired
          </span>
        )
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/40">
            <Clock size={14} />
            Upcoming
          </span>
        )
      default:
        return null
    }
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Central':
        return <Landmark size={24} className="text-slate-300" />
      case 'Provincial':
        return <Building size={24} className="text-slate-300" />
      case 'Local':
        return <Home size={24} className="text-slate-300" />
      default:
        return <Clipboard size={24} className="text-slate-300" />
    }
  }

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: scheme?.title,
        text: scheme?.description,
        url: window.location.href,
      }).catch(() => {})
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-slate-300">Loading scheme details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/government-schemes')}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-200 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Schemes
          </button>
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center">
            <p className="text-red-300">{error || 'Scheme not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(scheme.expiryDate)
  const isExpired = scheme.status === 'expired' || (daysRemaining !== null && daysRemaining < 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/government-schemes')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-200 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Schemes
        </button>

        {/* Header Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {getStatusBadge(scheme.status)}
                {getLevelIcon(scheme.level)}
                <span className="text-sm font-semibold text-slate-400 uppercase">
                  {scheme.level || 'General'} Level
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">{scheme.title}</h1>
              {scheme.schemeType && (
                <p className="text-slate-300">{scheme.schemeType}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {scheme.description && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                  Description
                </h2>
                <p className="text-slate-200 leading-relaxed">{scheme.description}</p>
              </div>
            )}

            {/* Eligibility */}
            {scheme.details?.eligibility && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-green-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Eligibility
                </h2>
                <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {scheme.details.eligibility}
                </div>
              </div>
            )}

            {/* Benefits */}
            {scheme.details?.benefits && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-emerald-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign size={16} />
                  Benefits
                </h2>
                <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {scheme.details.benefits}
                </div>
              </div>
            )}

            {/* Application Process */}
            {scheme.details?.applicationProcess && scheme.details.applicationProcess.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-yellow-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <ClipboardList size={16} />
                  Application Process
                </h2>
                <ol className="space-y-3">
                  {scheme.details.applicationProcess.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="shrink-0 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-slate-200 flex-1 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Required Documents */}
            {scheme.details?.requiredDocuments && scheme.details.requiredDocuments.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-orange-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <FileText size={16} />
                  Required Documents
                </h2>
                <ul className="space-y-2">
                  {scheme.details.requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span className="text-slate-200">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Usage Conditions */}
            {scheme.details?.usageConditions && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-red-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Usage Conditions
                </h2>
                <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {scheme.details.usageConditions}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-6">
            {/* Location Information */}
            {(scheme.provinceName || scheme.districtName || scheme.regionScope) && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-blue-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <MapPin size={16} />
                  Location
                </h2>
                <div className="space-y-3">
                  {scheme.provinceName && (
                    <div>
                      <span className="text-xs text-slate-400">Province:</span>
                      <p className="text-slate-100 font-medium">{scheme.provinceName}</p>
                    </div>
                  )}
                  {scheme.districtName && (
                    <div>
                      <span className="text-xs text-slate-400">District:</span>
                      <p className="text-slate-100 font-medium">{scheme.districtName}</p>
                    </div>
                  )}
                  {scheme.localBodyType && (
                    <div>
                      <span className="text-xs text-slate-400">Local Body Type:</span>
                      <p className="text-slate-100 font-medium">{scheme.localBodyType}</p>
                    </div>
                  )}
                  {scheme.localBodyName && (
                    <div>
                      <span className="text-xs text-slate-400">Local Body Name:</span>
                      <p className="text-slate-100 font-medium">{scheme.localBodyName}</p>
                    </div>
                  )}
                  {scheme.regionScope && (
                    <div>
                      <span className="text-xs text-slate-400">Region Scope:</span>
                      <p className="text-slate-100 font-medium capitalize">{scheme.regionScope.replace('-', ' ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Important Dates */}
            {(scheme.publishedDate || scheme.expiryDate) && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={16} />
                  Important Dates
                </h2>
                <div className="space-y-3">
                  {scheme.publishedDate && (
                    <div>
                      <span className="text-xs text-slate-400">Published:</span>
                      <p className="text-slate-100 font-medium">
                        {new Date(scheme.publishedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {scheme.expiryDate && (
                    <div>
                      <span className="text-xs text-slate-400">Expiry Date:</span>
                      <p className={`font-medium ${
                        isExpired
                          ? 'text-red-400'
                          : daysRemaining !== null && daysRemaining <= 30
                          ? 'text-orange-400'
                          : 'text-slate-100'
                      }`}>
                        {new Date(scheme.expiryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {!isExpired && daysRemaining !== null && daysRemaining > 0 && (
                          <span className="block text-xs mt-1">
                            ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {scheme.sector && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                  Additional Info
                </h2>
                <div>
                  <span className="text-xs text-slate-400">Sector:</span>
                  <p className="text-slate-100 font-medium">{scheme.sector}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {scheme.sourceUrl && (
                <a
                  href={scheme.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-100 transition-colors text-sm font-medium"
                >
                  <Globe size={16} />
                  View Source
                  <ExternalLink size={14} />
                </a>
              )}
              {scheme.documentUrl && (
                <a
                  href={scheme.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-100 transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  Download Document
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-100 transition-colors text-sm font-medium"
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                onClick={() => navigate('/government-schemes')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-green-700 transition-all"
              >
                Back to Schemes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchemeDetails

