import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Droplet, Sun, Info, Video, CheckCircle2, Loader2, FlaskConical, ChevronRight } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getAllCrops, getPlantationGuide, getAllPlantingCalendars, getUserProfile } from '../../services/api'

const CropDetails = () => {
  const { cropId } = useParams()
  const navigate = useNavigate()
  const { content } = useLanguage()
  const t = content?.cropDetailsPage || {}
  const [crop, setCrop] = useState(null)
  const [guide, setGuide] = useState(null)
  const [calendars, setCalendars] = useState([])
  const [userRegion, setUserRegion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllRegions, setShowAllRegions] = useState(false)

  // Helper function to convert YouTube URL to embed format
  const convertToEmbedUrl = (url) => {
    if (!url) return null
    
    // If already embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url
    }
    
    // Extract video ID from various YouTube URL formats
    let videoId = null
    
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/)
    if (watchMatch) {
      videoId = watchMatch[1]
    }
    
    // Format: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
    if (shortMatch) {
      videoId = shortMatch[1]
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    return url // Return original if can't parse
  }

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/signup')
      return
    }

    loadCropDetails()
  }, [cropId, navigate])

  const loadCropDetails = async () => {
    try {
      setLoading(true)
      
      // Get user profile for region
      try {
        const profileResponse = await getUserProfile()
        if (profileResponse.success) {
          setUserRegion(profileResponse.data.userDetails?.farmLocation)
        }
      } catch (err) {
        console.log('Could not load user profile')
      }

      // Get all crops and find the one we need
      const cropsResponse = await getAllCrops()
      if (cropsResponse.success) {
        const foundCrop = cropsResponse.crops.find(c => c.cropId === parseInt(cropId))
        if (!foundCrop) {
          setError(t.cropNotFound || 'Crop not found')
          setLoading(false)
          return
        }
        setCrop(foundCrop)

        // Fetch plantation guide
        try {
          const guideResponse = await getPlantationGuide(parseInt(cropId))
          if (guideResponse.success) {
            setGuide(guideResponse)
          }
        } catch (error) {
          console.log('No plantation guide found')
        }

        // Fetch planting calendars
        try {
          const calendarsResponse = await getAllPlantingCalendars(parseInt(cropId))
          if (calendarsResponse.success) {
            setCalendars(calendarsResponse.calendars || [])
          }
        } catch (error) {
          console.log('No planting calendars found')
        }
      }
    } catch (err) {
      setError(err.message || t.loadError || 'Failed to load crop details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-400" size={48} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !crop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-900/50 border border-red-500/50 text-red-100 px-6 py-4 rounded-xl">
            <p>{error || t.cropNotFound || 'Crop not found'}</p>
            <button
              onClick={() => navigate('/crop-advisory')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t.backToCropAdvisory || 'Back to Crop Advisory'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const embedVideoUrl = guide?.videoUrl ? convertToEmbedUrl(guide.videoUrl) : null

  // Filter calendars based on user region
  const filteredCalendars = showAllRegions 
    ? calendars 
    : calendars.filter(cal => cal.region === userRegion)

  // Check if there are other regions available
  const hasOtherRegions = calendars.some(cal => cal.region !== userRegion)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/crop-advisory')}
          className="mb-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t.backToCropAdvisory || 'Back to Crop Advisory'}</span>
        </button>

        {/* Title and Type */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl px-6 py-6 mb-6 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-1">{crop.cropName}</h1>
          {crop.cropCategory && (
            <p className="text-emerald-100">{crop.cropCategory}</p>
          )}
        </div>

        {/* Image and Basic Information Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Image - Just display the image without background */}
          {crop.imageUrl ? (
            <img
              src={crop.imageUrl}
              alt={crop.cropName}
              className="w-full h-auto object-contain max-h-[] rounded-3xl"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-emerald-900/30 to-green-900/30 rounded-3xl">
              <div className="text-6xl">🌾</div>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Info className="text-emerald-400" size={20} />
              {t.basicInformation || 'Basic Information'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {crop.regions && crop.regions.length > 0 && (
                <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="text-blue-400" size={18} />
                    <span className="font-semibold text-blue-100 text-sm">{t.regions || 'Regions'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {crop.regions.map((region) => (
                      <span
                        key={region}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          region === userRegion
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-slate-800/50 text-blue-200 border border-blue-600/30'
                        }`}
                      >
                        {region}
                        {region === userRegion && (
                          <CheckCircle2 className="inline ml-1" size={14} />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {crop.season && (
                <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-purple-400" size={18} />
                    <span className="font-semibold text-purple-100 text-sm">{t.season || 'Season'}</span>
                  </div>
                  <span className="px-3 py-1 bg-slate-800/50 text-purple-200 rounded-full text-xs font-medium border border-purple-600/30">
                    {crop.season}
                  </span>
                </div>
              )}

              {crop.soilType && (
                <div className="p-4 bg-orange-900/30 rounded-xl border border-orange-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="text-orange-400" size={18} />
                    <span className="font-semibold text-orange-100 text-sm">{t.soilType || 'Soil Type'}</span>
                  </div>
                  <p className="text-gray-200 text-sm">{crop.soilType}</p>
                </div>
              )}

              {crop.waterRequirement && (
                <div className="p-4 bg-cyan-900/30 rounded-xl border border-cyan-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="text-cyan-400" size={18} />
                    <span className="font-semibold text-cyan-100 text-sm">{t.waterRequirement || 'Water Requirement'}</span>
                  </div>
                  <p className="text-gray-200 text-sm">{crop.waterRequirement}</p>
                </div>
              )}

              {crop.climate && (
                <div className="p-4 bg-green-900/30 rounded-xl border border-green-700/30 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="text-green-400" size={18} />
                    <span className="font-semibold text-green-100 text-sm">{t.climate || 'Climate'}</span>
                  </div>
                  <p className="text-gray-200 text-sm">{crop.climate}</p>
                </div>
              )}

              {crop.notes && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-600/30 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="text-gray-400" size={18} />
                    <span className="font-semibold text-gray-200 text-sm">{t.notes || 'Notes'}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{crop.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plantation Guide and Calendar Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Plantation Guide Section */}
          {guide ? (
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Video className="text-emerald-400" size={20} />
                {t.plantationGuide || 'Plantation Guide'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {guide.spacing && (
                  <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-700/30">
                    <h4 className="font-semibold text-emerald-200 mb-1 text-sm">{t.spacing || 'Spacing'}</h4>
                    <p className="text-gray-200 text-sm">{guide.spacing}</p>
                  </div>
                )}
                {guide.maturityPeriod && (
                  <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-700/30">
                    <h4 className="font-semibold text-blue-200 mb-1 text-sm">{t.maturityPeriod || 'Maturity Period'}</h4>
                    <p className="text-gray-200 text-sm">{guide.maturityPeriod}</p>
                  </div>
                )}
                {guide.seedPreparation && (
                  <div className="p-4 bg-yellow-900/20 rounded-xl border border-yellow-700/30">
                    <h4 className="font-semibold text-yellow-200 mb-1 text-sm">{t.seedPreparation || 'Seed Preparation'}</h4>
                    <p className="text-gray-200 text-xs whitespace-pre-line leading-relaxed">{guide.seedPreparation}</p>
                  </div>
                )}
                {guide.plantingMethod && (
                  <div className="p-4 bg-green-900/20 rounded-xl border border-green-700/30">
                    <h4 className="font-semibold text-green-200 mb-1 text-sm">{t.plantingMethod || 'Planting Method'}</h4>
                    <p className="text-gray-200 text-xs whitespace-pre-line leading-relaxed">{guide.plantingMethod}</p>
                  </div>
                )}
                {guide.irrigationSchedule && (
                  <div className="p-4 bg-cyan-900/20 rounded-xl border border-cyan-700/30">
                    <h4 className="font-semibold text-cyan-200 mb-1 text-sm">Irrigation Schedule</h4>
                    <p className="text-gray-200 text-xs whitespace-pre-line leading-relaxed">{guide.irrigationSchedule}</p>
                  </div>
                )}
                {guide.harvestingTips && (
                  <div className="p-4 bg-orange-900/20 rounded-xl border border-orange-700/30">
                    <h4 className="font-semibold text-orange-200 mb-1 text-sm">{t.harvestingTips || 'Harvesting Tips'}</h4>
                    <p className="text-gray-200 text-xs whitespace-pre-line leading-relaxed">{guide.harvestingTips}</p>
                  </div>
                )}
                {guide.averageYield && (
                  <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-700/30">
                    <h4 className="font-semibold text-purple-200 mb-1 text-sm">{t.averageYield || 'Average Yield'}</h4>
                    <p className="text-gray-200 text-sm">{guide.averageYield}</p>
                  </div>
                )}
                {guide.plantationProcess && guide.plantationProcess.length > 0 && (
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-600/30 col-span-2">
                    <h4 className="font-semibold text-gray-200 mb-2 text-sm">{t.plantationProcess || 'Plantation Process'}</h4>
                    <ol className="list-decimal list-inside space-y-1 text-gray-200 text-xs">
                      {guide.plantationProcess.map((step, index) => (
                        <li key={index} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No plantation guide available for this crop.</p>
              </div>
            </div>
          )}

          {/* Planting Calendar Section */}
          {calendars.length > 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="text-emerald-400" size={20} />
                  {t.plantingCalendar || 'Planting Calendar'}
                </h3>
                {hasOtherRegions && (
                  <button
                    onClick={() => setShowAllRegions(!showAllRegions)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    {showAllRegions ? (t.showOnlyMyRegion || 'Show Only My Region') : (t.viewOtherRegions || 'View Other Regions')}
                  </button>
                )}
              </div>
              {filteredCalendars.length > 0 ? (
                <div className="space-y-4">
                  {filteredCalendars.map((calendar) => (
                    <div
                      key={calendar.calendarId}
                      className={`p-4 rounded-xl border-2 ${
                        calendar.region === userRegion
                          ? 'bg-emerald-900/30 border-emerald-500/50 shadow-lg'
                          : 'bg-slate-800/50 border-slate-600/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-emerald-400" size={18} />
                          <span className="font-semibold text-white text-sm">{calendar.region}</span>
                          {calendar.region === userRegion && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full font-medium">
                              {t.yourRegion || 'Your Region'}
                            </span>
                          )}
                        </div>
                        {calendar.season && (
                          <span className="px-3 py-1 bg-purple-900/50 text-purple-200 rounded-full text-xs font-medium border border-purple-700/30">
                            {calendar.season}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {calendar.sowingPeriod && (
                          <div className="bg-slate-900/50 p-3 rounded-lg">
                            <h4 className="text-xs font-semibold text-gray-300 mb-1">Sowing Period</h4>
                            <p className="text-white font-medium text-sm">{calendar.sowingPeriod}</p>
                          </div>
                        )}
                        {calendar.transplantingPeriod && (
                          <div className="bg-slate-900/50 p-3 rounded-lg">
                            <h4 className="text-xs font-semibold text-gray-300 mb-1">{t.transplantingPeriod || 'Transplanting Period'}</h4>
                            <p className="text-white font-medium text-sm">{calendar.transplantingPeriod}</p>
                          </div>
                        )}
                        {calendar.harvestingPeriod && (
                          <div className="bg-slate-900/50 p-3 rounded-lg">
                            <h4 className="text-xs font-semibold text-gray-300 mb-1">{t.harvestingPeriod || 'Harvesting Period'}</h4>
                            <p className="text-white font-medium text-sm">{calendar.harvestingPeriod}</p>
                          </div>
                        )}
                      </div>
                      {calendar.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-600/30">
                          <p className="text-xs text-gray-300 leading-relaxed">{calendar.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">{t.noCalendarForRegion || 'No calendar available for your region.'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No planting calendar available for this crop.</p>
              </div>
            </div>
          )}
        </div>

        {/* Agro Recommendations CTA */}
        <button
          onClick={() => navigate(`/crop-advisory/${cropId}/agro-recommendations`)}
          className="w-full mb-6 group"
        >
          <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 backdrop-blur-sm rounded-2xl border border-emerald-500/30 shadow-xl p-5 flex items-center justify-between hover:border-emerald-400/50 hover:shadow-emerald-900/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-600/30 flex items-center justify-center border border-emerald-500/30">
                <FlaskConical className="text-emerald-300" size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">{t.agroRecommendations || 'Fertilizer & Pesticide Guide'}</h3>
                <p className="text-emerald-200/70 text-sm">{t.agroSubtitle || 'AI-powered fertilizer, pesticide & herbicide advice for this crop'}</p>
              </div>
            </div>
            <ChevronRight size={22} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Video Guide Section - Full Width at Bottom */}
        {embedVideoUrl && (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Video className="text-red-400" size={20} />
              {t.videoGuide || 'Video Guide'}
            </h3>
            <div className="rounded-lg overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedVideoUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={t.videoGuideTitle || 'Plantation Guide Video'}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CropDetails