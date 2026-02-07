import React, { useState, useEffect } from 'react'
import { X, MapPin, Calendar, Droplet, Sun, Info, Video, CheckCircle2, ArrowLeft } from 'lucide-react'
import { getPlantationGuide, getAllPlantingCalendars } from '../services/api'

const CropDetailsModal = ({ crop, userRegion, onClose }) => {
  const [guide, setGuide] = useState(null)
  const [calendars, setCalendars] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('basic') // 'basic', 'guide', 'calendar'

  useEffect(() => {
    if (crop?.cropId) {
      fetchCropDetails()
    }
  }, [crop])

  const fetchCropDetails = async () => {
    setIsLoading(true)
    try {
      // Fetch plantation guide
      try {
        const guideResponse = await getPlantationGuide(crop.cropId)
        if (guideResponse.success) {
          setGuide(guideResponse)
        }
      } catch (error) {
        console.log('No plantation guide found')
      }

      // Fetch planting calendars
      try {
        const calendarsResponse = await getAllPlantingCalendars(crop.cropId)
        if (calendarsResponse.success) {
          setCalendars(calendarsResponse.calendars || [])
        }
      } catch (error) {
        console.log('No planting calendars found')
      }
    } catch (error) {
      console.error('Error fetching crop details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserRegionCalendar = () => {
    if (!userRegion || !calendars.length) return null
    return calendars.find(cal => cal.region === userRegion) || calendars[0]
  }

  if (!crop) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-white" size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">{crop.cropName}</h2>
                {crop.cropCategory && (
                  <p className="text-emerald-100 text-sm">{crop.cropCategory}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="text-white" size={24} />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="h-64 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
          {crop.imageUrl ? (
            <img
              src={crop.imageUrl}
              alt={crop.cropName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-8xl">🌾</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'guide'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Plantation Guide
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Planting Calendar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Info className="text-emerald-600" size={20} />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {crop.regions && crop.regions.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="text-blue-600" size={18} />
                            <span className="font-semibold text-gray-700">Regions</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {crop.regions.map((region) => (
                              <span
                                key={region}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  region === userRegion
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-blue-700 border border-blue-200'
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
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="text-purple-600" size={18} />
                            <span className="font-semibold text-gray-700">Season</span>
                          </div>
                          <span className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                            {crop.season}
                          </span>
                        </div>
                      )}

                      {crop.soilType && (
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sun className="text-orange-600" size={18} />
                            <span className="font-semibold text-gray-700">Soil Type</span>
                          </div>
                          <p className="text-gray-700">{crop.soilType}</p>
                        </div>
                      )}

                      {crop.waterRequirement && (
                        <div className="p-4 bg-cyan-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Droplet className="text-cyan-600" size={18} />
                            <span className="font-semibold text-gray-700">Water Requirement</span>
                          </div>
                          <p className="text-gray-700">{crop.waterRequirement}</p>
                        </div>
                      )}

                      {crop.climate && (
                        <div className="p-4 bg-green-50 rounded-lg md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Sun className="text-green-600" size={18} />
                            <span className="font-semibold text-gray-700">Climate</span>
                          </div>
                          <p className="text-gray-700">{crop.climate}</p>
                        </div>
                      )}

                      {crop.notes && (
                        <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="text-gray-600" size={18} />
                            <span className="font-semibold text-gray-700">Notes</span>
                          </div>
                          <p className="text-gray-700">{crop.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Plantation Guide Tab */}
              {activeTab === 'guide' && (
                <div className="space-y-6">
                  {guide ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Plantation Guide
                      </h3>
                      <div className="space-y-4">
                        {guide.spacing && (
                          <div className="p-4 bg-emerald-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Spacing</h4>
                            <p className="text-gray-700">{guide.spacing}</p>
                          </div>
                        )}
                        {guide.maturityPeriod && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Maturity Period</h4>
                            <p className="text-gray-700">{guide.maturityPeriod}</p>
                          </div>
                        )}
                        {guide.seedPreparation && (
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Seed Preparation</h4>
                            <p className="text-gray-700 whitespace-pre-line">{guide.seedPreparation}</p>
                          </div>
                        )}
                        {guide.plantingMethod && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Planting Method</h4>
                            <p className="text-gray-700 whitespace-pre-line">{guide.plantingMethod}</p>
                          </div>
                        )}
                        {guide.irrigationSchedule && (
                          <div className="p-4 bg-cyan-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Irrigation Schedule</h4>
                            <p className="text-gray-700 whitespace-pre-line">{guide.irrigationSchedule}</p>
                          </div>
                        )}
                        {guide.harvestingTips && (
                          <div className="p-4 bg-orange-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Harvesting Tips</h4>
                            <p className="text-gray-700 whitespace-pre-line">{guide.harvestingTips}</p>
                          </div>
                        )}
                        {guide.averageYield && (
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Average Yield</h4>
                            <p className="text-gray-700">{guide.averageYield}</p>
                          </div>
                        )}
                        {guide.plantationProcess && guide.plantationProcess.length > 0 && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Plantation Process</h4>
                            <ol className="list-decimal list-inside space-y-2">
                              {guide.plantationProcess.map((step, index) => (
                                <li key={index} className="text-gray-700">{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {guide.videoUrl && (
                          <div className="p-4 bg-red-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Video className="text-red-600" size={20} />
                              Video Guide
                            </h4>
                            <div className="mt-2">
                              <iframe
                                src={guide.videoUrl}
                                className="w-full h-64 rounded-lg"
                                allowFullScreen
                                title="Plantation Guide Video"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No plantation guide available for this crop.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Planting Calendar Tab */}
              {activeTab === 'calendar' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Planting Calendar
                  </h3>
                  {calendars.length > 0 ? (
                    <div className="space-y-4">
                      {calendars.map((calendar) => (
                        <div
                          key={calendar.calendarId}
                          className={`p-4 rounded-lg border-2 ${
                            calendar.region === userRegion
                              ? 'bg-emerald-50 border-emerald-500'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="text-emerald-600" size={18} />
                              <span className="font-semibold text-gray-900">{calendar.region}</span>
                              {calendar.region === userRegion && (
                                <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full">
                                  Your Region
                                </span>
                              )}
                            </div>
                            {calendar.season && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                {calendar.season}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {calendar.sowingPeriod && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-600 mb-1">Sowing Period</h4>
                                <p className="text-gray-900">{calendar.sowingPeriod}</p>
                              </div>
                            )}
                            {calendar.transplantingPeriod && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-600 mb-1">Transplanting Period</h4>
                                <p className="text-gray-900">{calendar.transplantingPeriod}</p>
                              </div>
                            )}
                            {calendar.harvestingPeriod && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-600 mb-1">Harvesting Period</h4>
                                <p className="text-gray-900">{calendar.harvestingPeriod}</p>
                              </div>
                            )}
                          </div>
                          {calendar.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600">{calendar.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No planting calendar available for this crop.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CropDetailsModal

