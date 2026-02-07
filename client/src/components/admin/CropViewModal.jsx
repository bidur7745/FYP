import React, { useState, useEffect } from 'react'
import { X, Calendar, BookOpen, MapPin, Droplet, Sun, Info, Video, CheckCircle2 } from 'lucide-react'
import { getPlantationGuide, getAllPlantingCalendars } from '../../services/api'

const CropViewModal = ({ crop, isOpen, onClose }) => {
  const [guide, setGuide] = useState(null)
  const [calendars, setCalendars] = useState([])
  const [isLoadingGuide, setIsLoadingGuide] = useState(false)
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false)

  useEffect(() => {
    if (isOpen && crop) {
      fetchCropDetails()
    } else {
      setGuide(null)
      setCalendars([])
    }
  }, [isOpen, crop])

  const fetchCropDetails = async () => {
    if (!crop?.cropId) return

    setIsLoadingGuide(true)
    setIsLoadingCalendars(true)

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
      setIsLoadingGuide(false)
      setIsLoadingCalendars(false)
    }
  }

  if (!isOpen || !crop) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{crop.cropName}</h2>
            {crop.cropCategory && (
              <p className="text-sm text-gray-600 mt-1">{crop.cropCategory}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Crop Image */}
          {crop.imageUrl && (
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                <img src={crop.imageUrl} alt={crop.cropName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Info size={20} className="text-emerald-600" />
                Basic Information
              </h3>
              <div className="space-y-2 text-sm">
                {crop.regions && crop.regions.length > 0 && (
                  <div>
                    <span className="text-gray-600">Regions:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {crop.regions.map((region) => (
                        <span key={region} className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {crop.season && (
                  <div>
                    <span className="text-gray-600">Season:</span>
                    <span className="ml-2 px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700">
                      {crop.season}
                    </span>
                  </div>
                )}
                {crop.soilType && (
                  <div>
                    <span className="text-gray-600">Soil Type:</span>
                    <span className="ml-2 text-gray-800">{crop.soilType}</span>
                  </div>
                )}
                {crop.waterRequirement && (
                  <div className="flex items-center gap-2">
                    <Droplet size={16} className="text-blue-600" />
                    <span className="text-gray-600">Water Requirement:</span>
                    <span className="text-gray-800">{crop.waterRequirement}</span>
                  </div>
                )}
                {crop.climate && (
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-yellow-600" />
                    <span className="text-gray-600">Climate:</span>
                    <span className="text-gray-800">{crop.climate}</span>
                  </div>
                )}
              </div>
            </div>

            {crop.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {crop.notes}
                </p>
              </div>
            )}
          </div>

          {/* Plantation Guide */}
          {isLoadingGuide ? (
            <div className="text-center py-8 text-gray-500">Loading plantation guide...</div>
          ) : guide ? (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-emerald-600" />
                Plantation Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.spacing && (
                  <div>
                    <span className="text-gray-600 text-sm">Spacing:</span>
                    <p className="text-gray-800">{guide.spacing}</p>
                  </div>
                )}
                {guide.maturityPeriod && (
                  <div>
                    <span className="text-gray-600 text-sm">Maturity Period:</span>
                    <p className="text-gray-800">{guide.maturityPeriod}</p>
                  </div>
                )}
                {guide.seedPreparation && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600 text-sm">Seed Preparation:</span>
                    <p className="text-gray-800 mt-1">{guide.seedPreparation}</p>
                  </div>
                )}
                {guide.plantingMethod && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600 text-sm">Planting Method:</span>
                    <p className="text-gray-800 mt-1">{guide.plantingMethod}</p>
                  </div>
                )}
                {guide.irrigationSchedule && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600 text-sm">Irrigation Schedule:</span>
                    <p className="text-gray-800 mt-1">{guide.irrigationSchedule}</p>
                  </div>
                )}
                {guide.harvestingTips && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600 text-sm">Harvesting Tips:</span>
                    <p className="text-gray-800 mt-1">{guide.harvestingTips}</p>
                  </div>
                )}
                {guide.averageYield && (
                  <div>
                    <span className="text-gray-600 text-sm">Average Yield:</span>
                    <p className="text-gray-800">{guide.averageYield}</p>
                  </div>
                )}
                {guide.videoUrl && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600 text-sm flex items-center gap-2">
                      <Video size={16} className="text-red-600" />
                      Guide Video:
                    </span>
                    <a href={guide.videoUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-sm mt-1 block break-all">
                      {guide.videoUrl}
                    </a>
                  </div>
                )}
                {guide.plantationProcess && guide.plantationProcess.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600 text-sm mb-2 block">Plantation Process:</span>
                    <ol className="list-decimal list-inside space-y-2">
                      {guide.plantationProcess.map((step, index) => (
                        <li key={index} className="text-gray-800 text-sm">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Planting Calendar */}
          {isLoadingCalendars ? (
            <div className="text-center py-8 text-gray-500">Loading planting calendar...</div>
          ) : calendars.length > 0 ? (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-emerald-600" />
                Planting Calendar
              </h3>
              <div className="space-y-4">
                {calendars.map((calendar, index) => (
                  <div key={calendar.calendarId || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin size={16} className="text-blue-600" />
                      <span className="font-semibold text-gray-900">{calendar.region}</span>
                      {calendar.season && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700">
                          {calendar.season}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {calendar.sowingPeriod && (
                        <div>
                          <span className="text-gray-600">Sowing Period:</span>
                          <p className="text-gray-800">{calendar.sowingPeriod}</p>
                        </div>
                      )}
                      {calendar.transplantingPeriod && (
                        <div>
                          <span className="text-gray-600">Transplanting Period:</span>
                          <p className="text-gray-800">{calendar.transplantingPeriod}</p>
                        </div>
                      )}
                      {calendar.harvestingPeriod && (
                        <div>
                          <span className="text-gray-600">Harvesting Period:</span>
                          <p className="text-gray-800">{calendar.harvestingPeriod}</p>
                        </div>
                      )}
                    </div>
                    {calendar.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <span className="text-gray-600 text-sm">Notes:</span>
                        <p className="text-gray-700 text-sm mt-1">{calendar.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default CropViewModal

