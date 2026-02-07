import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { createCropWithDetails, getAllCrops, updateCrop, deleteCrop } from '../../services/api'
import CropViewModal from './CropViewModal'

const CropManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [seasonFilter, setSeasonFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    cropName: '',
    cropCategory: '',
    regions: [], // array input with add button
    season: '',
    soilType: '',
    waterRequirement: '',
    climate: '',
    notes: '',
    imageUrl: '',
    plantationGuide: {
      spacing: '',
      maturityPeriod: '',
      seedPreparation: '',
      plantingMethod: '',
      irrigationSchedule: '',
      harvestingTips: '',
      averageYield: '',
      videoUrl: '',
      plantationProcess: [], // array input with add button
    },
    plantingCalendar: [], // array of { region, season, sowingPeriod, transplantingPeriod, harvestingPeriod, notes }
  })
  const [regionInput, setRegionInput] = useState('')
  const [plantationStepInput, setPlantationStepInput] = useState('')
  const [calendarEntry, setCalendarEntry] = useState({
    region: '',
    season: '',
    sowingPeriod: '',
    transplantingPeriod: '',
    harvestingPeriod: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [crops, setCrops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCropId, setEditingCropId] = useState(null)
  const [viewingCrop, setViewingCrop] = useState(null)

  // Fetch crops from API
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setIsLoading(true)
        const response = await getAllCrops()
        if (response.success && response.crops) {
          setCrops(response.crops)
        }
      } catch (error) {
        console.error('Error fetching crops:', error)
        setSubmitError('Failed to load crops')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCrops()
  }, [])

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.cropName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crop.cropCategory?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = regionFilter === 'all' || (crop.regions && crop.regions.includes(regionFilter))
    const matchesSeason = seasonFilter === 'all' || crop.season === seasonFilter
    return matchesSearch && matchesRegion && matchesSeason
  })

  const handleAddRegion = () => {
    if (!regionInput.trim()) return
    if (!['Terai', 'Hill', 'Mountain'].includes(regionInput.trim())) {
      alert('Region must be one of: Terai, Hill, Mountain')
      return
    }
    if (!formData.regions.includes(regionInput.trim())) {
      setFormData({ ...formData, regions: [...formData.regions, regionInput.trim()] })
    }
    setRegionInput('')
  }

  const handleRemoveRegion = (region) => {
    setFormData({
      ...formData,
      regions: formData.regions.filter((r) => r !== region)
    })
  }

  const handleAddPlantationStep = () => {
    if (!plantationStepInput.trim()) return
    setFormData({
      ...formData,
      plantationGuide: {
        ...formData.plantationGuide,
        plantationProcess: [...formData.plantationGuide.plantationProcess, plantationStepInput.trim()]
      }
    })
    setPlantationStepInput('')
  }

  const handleRemovePlantationStep = (index) => {
    setFormData({
      ...formData,
      plantationGuide: {
        ...formData.plantationGuide,
        plantationProcess: formData.plantationGuide.plantationProcess.filter((_, i) => i !== index)
      }
    })
  }

  const handleAddCalendarEntry = () => {
    if (!calendarEntry.region || !calendarEntry.season) {
      alert('Calendar entry needs at least region and season')
      return
    }
    setFormData({
      ...formData,
      plantingCalendar: [...formData.plantingCalendar, calendarEntry]
    })
    setCalendarEntry({
      region: '',
      season: '',
      sowingPeriod: '',
      transplantingPeriod: '',
      harvestingPeriod: '',
      notes: '',
    })
  }

  const handleRemoveCalendarEntry = (index) => {
    setFormData({
      ...formData,
      plantingCalendar: formData.plantingCalendar.filter((_, i) => i !== index)
    })
  }

  const handleAddCrop = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (formData.regions.length === 0) {
      setSubmitError('Please add at least one region')
      return
    }

    const payload = {
      cropName: formData.cropName,
      cropCategory: formData.cropCategory,
      regions: formData.regions,
      season: formData.season,
      soilType: formData.soilType || undefined,
      waterRequirement: formData.waterRequirement || undefined,
      climate: formData.climate || undefined,
      notes: formData.notes || undefined,
      imageUrl: formData.imageUrl || undefined,
    }

    const hasGuideFields = Object.values({
      spacing: formData.plantationGuide.spacing,
      maturityPeriod: formData.plantationGuide.maturityPeriod,
      seedPreparation: formData.plantationGuide.seedPreparation,
      plantingMethod: formData.plantationGuide.plantingMethod,
      irrigationSchedule: formData.plantationGuide.irrigationSchedule,
      harvestingTips: formData.plantationGuide.harvestingTips,
      averageYield: formData.plantationGuide.averageYield,
      videoUrl: formData.plantationGuide.videoUrl,
    }).some((v) => v && String(v).trim() !== '') || formData.plantationGuide.plantationProcess.length > 0

    if (hasGuideFields) {
      payload.plantationGuide = {
        ...formData.plantationGuide,
      }
    }

    if (formData.plantingCalendar.length > 0) {
      payload.plantingCalendar = formData.plantingCalendar
    }

    try {
      setIsSubmitting(true)

      if (editingCropId) {
        await updateCrop(editingCropId, payload)
        setSubmitSuccess('Crop updated successfully.')
      } else {
        await createCropWithDetails(payload)
        setSubmitSuccess('Crop and related information uploaded successfully.')
      }

    setShowAddForm(false)

      // Refresh crops list
      const response = await getAllCrops()
      if (response.success && response.crops) {
        setCrops(response.crops)
      }

    setFormData({
      cropName: '',
      cropCategory: '',
      regions: [],
      season: '',
      soilType: '',
      waterRequirement: '',
      climate: '',
      notes: '',
      imageUrl: '',
        plantationGuide: {
          spacing: '',
          maturityPeriod: '',
          seedPreparation: '',
          plantingMethod: '',
          irrigationSchedule: '',
          harvestingTips: '',
          averageYield: '',
          videoUrl: '',
          plantationProcess: [],
        },
        plantingCalendar: [],
      })
      setEditingCropId(null)
    } catch (err) {
      setSubmitError(err.message || 'Failed to upload crop')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCrop = (crop) => {
    setFormData({
      cropName: crop.cropName || '',
      cropCategory: crop.cropCategory || '',
      regions: crop.regions || [],
      season: crop.season || '',
      soilType: crop.soilType || '',
      waterRequirement: crop.waterRequirement || '',
      climate: crop.climate || '',
      notes: crop.notes || '',
      imageUrl: crop.imageUrl || '',
      plantationGuide: {
        spacing: '',
        maturityPeriod: '',
        seedPreparation: '',
        plantingMethod: '',
        irrigationSchedule: '',
        harvestingTips: '',
        averageYield: '',
        videoUrl: '',
        plantationProcess: [],
      },
      plantingCalendar: [],
    })
    setEditingCropId(crop.cropId)
    setShowAddForm(true)
    setSubmitError('')
    setSubmitSuccess('Editing existing crop.')
  }

  const handleDeleteCrop = async (cropId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this crop?')
    if (!confirmDelete) return

    try {
      setIsSubmitting(true)
      await deleteCrop(cropId)

      const response = await getAllCrops()
      if (response.success && response.crops) {
        setCrops(response.crops)
      }
    } catch (error) {
      setSubmitError(error.message || 'Failed to delete crop')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Crop Management</h2>
          <p className="text-gray-600">Manage crop database, add new crops, and update existing information</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
          <Plus size={20} />
          Add New Crop
        </button>
      </div>

      {/* Add Crop Form */}
      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Crop</h3>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          {submitSuccess && <p className="text-sm text-emerald-600">{submitSuccess}</p>}
          <form onSubmit={handleAddCrop} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Name *
                </label>
                <input type="text" required value={formData.cropName} onChange={(e) => setFormData({ ...formData, cropName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input type="text" required value={formData.cropCategory} onChange={(e) => setFormData({ ...formData, cropCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season *
                </label>
                <select required value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select Season</option>
                  <option value="Winter">Winter</option>
                  <option value="Spring">Spring</option>
                  <option value="Monsoon">Monsoon</option>
                  <option value="Autumn">Autumn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soil Type
                </label>
                <input type="text" value={formData.soilType} onChange={(e) => setFormData({ ...formData, soilType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Water Requirement
                </label>
                <input type="text" value={formData.waterRequirement} onChange={(e) => setFormData({ ...formData, waterRequirement: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Climate
                </label>
                <input type="text" value={formData.climate} onChange={(e) => setFormData({ ...formData, climate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input type="text" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            {/* Regions (array) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Regions (Terai, Hill, Mountain) *
              </label>
              <div className="flex gap-2">
                <input type="text" placeholder="e.g. Terai" value={regionInput} onChange={(e) => setRegionInput(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={handleAddRegion} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.regions.map((region) => (
                  <span key={region} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                    {region}
                    <button type="button" onClick={() => handleRemoveRegion(region)} className="text-emerald-600 hover:text-emerald-800">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {/* Plantation Guide */}
            <div className="border-t border-gray-200 pt-4 mt-2 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Plantation Guide (optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Spacing</label>
                  <input
                    type="text"
                    value={formData.plantationGuide.spacing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: { ...formData.plantationGuide, spacing: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Maturity Period
                  </label>
                  <input
                    type="text"
                    value={formData.plantationGuide.maturityPeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: {
                          ...formData.plantationGuide,
                          maturityPeriod: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Seed Preparation
                  </label>
                  <textarea
                    rows={2}
                    value={formData.plantationGuide.seedPreparation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: {
                          ...formData.plantationGuide,
                          seedPreparation: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Planting Method
                  </label>
                  <input
                    type="text"
                    value={formData.plantationGuide.plantingMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: {
                          ...formData.plantationGuide,
                          plantingMethod: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Irrigation Schedule
                  </label>
                  <input
                    type="text"
                    value={formData.plantationGuide.irrigationSchedule}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: {
                          ...formData.plantationGuide,
                          irrigationSchedule: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Harvesting Tips
                  </label>
                  <textarea
                    rows={2}
                    value={formData.plantationGuide.harvestingTips}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: {
                          ...formData.plantationGuide,
                          harvestingTips: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Average Yield
                  </label>
                  <input
                    type="text"
                    value={formData.plantationGuide.averageYield}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: {
                          ...formData.plantationGuide,
                          averageYield: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Guide Video URL
                  </label>
                  <input
                    type="text"
                    value={formData.plantationGuide.videoUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plantationGuide: {
                          ...formData.plantationGuide,
                          videoUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Plantation process steps (array) */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  Plantation Process Steps
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Prepare seedbed"
                    value={plantationStepInput}
                    onChange={(e) => setPlantationStepInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPlantationStep}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
                <ul className="list-disc list-inside text-xs text-gray-800 space-y-1">
                  {formData.plantationGuide.plantationProcess.map((step, index) => (
                    <li key={index} className="flex justify-between items-center gap-2">
                      <span>{step}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlantationStep(index)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Planting Calendar (array of objects) */}
            <div className="border-t border-gray-200 pt-4 mt-2 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Planting Calendar (optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                  <select
                    value={calendarEntry.region}
                    onChange={(e) =>
                      setCalendarEntry({ ...calendarEntry, region: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Region</option>
                    <option value="Terai">Terai</option>
                    <option value="Hill">Hill</option>
                    <option value="Mountain">Mountain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Season</label>
                  <select
                    value={calendarEntry.season}
                    onChange={(e) =>
                      setCalendarEntry({ ...calendarEntry, season: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Season</option>
                    <option value="Winter">Winter</option>
                    <option value="Spring">Spring</option>
                    <option value="Monsoon">Monsoon</option>
                    <option value="Autumn">Autumn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Sowing Period
                  </label>
                  <input
                    type="text"
                    value={calendarEntry.sowingPeriod}
                    onChange={(e) =>
                      setCalendarEntry({ ...calendarEntry, sowingPeriod: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Transplanting Period
                  </label>
                  <input
                    type="text"
                    value={calendarEntry.transplantingPeriod}
                    onChange={(e) =>
                      setCalendarEntry({
                        ...calendarEntry,
                        transplantingPeriod: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Harvesting Period
                  </label>
                  <input
                    type="text"
                    value={calendarEntry.harvestingPeriod}
                    onChange={(e) =>
                      setCalendarEntry({
                        ...calendarEntry,
                        harvestingPeriod: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={calendarEntry.notes}
                    onChange={(e) =>
                      setCalendarEntry({ ...calendarEntry, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCalendarEntry}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
              >
                Add Calendar Entry
              </button>
              <div className="space-y-2 text-xs text-gray-800">
                {formData.plantingCalendar.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white/60 px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold">
                        {entry.region} – {entry.season}
                      </p>
                      <p className="text-[11px]">
                        Sowing: {entry.sowingPeriod || '-'} | Transplanting:{' '}
                        {entry.transplantingPeriod || '-'} | Harvesting:{' '}
                        {entry.harvestingPeriod || '-'}
                      </p>
                      {entry.notes && (
                        <p className="text-[11px] text-gray-600">Notes: {entry.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCalendarEntry(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Add Crop'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search crops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Regions</option>
          <option value="Terai">Terai</option>
          <option value="Hill">Hill</option>
          <option value="Mountain">Mountain</option>
        </select>
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Seasons</option>
          <option value="Winter">Winter</option>
          <option value="Spring">Spring</option>
          <option value="Monsoon">Monsoon</option>
          <option value="Autumn">Autumn</option>
        </select>
      </div>

      {/* Crops Grid */}
      {isLoading ? (
        <div className="col-span-full text-center py-8 text-gray-600">
          Loading crops...
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCrops.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-600">
              {searchTerm || regionFilter !== 'all' || seasonFilter !== 'all'
                ? 'No crops found matching your criteria'
                : 'No crops found yet. Use the form above to add a crop and its related information.'}
          </div>
        ) : (
          filteredCrops.map((crop) => (
            <div
                key={crop.cropId}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{crop.cropName}</h3>
                    <p className="text-sm text-gray-600">{crop.cropCategory || 'N/A'}</p>
                </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setViewingCrop(crop)} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors" title="View Details">
                      <Eye size={18} />
                    </button>
                  <button type="button" onClick={() => handleEditCrop(crop)} className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors" title="Edit Crop">
                    <Edit size={18} />
                  </button>
                  <button type="button" onClick={() => handleDeleteCrop(crop.cropId)} className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors" title="Delete Crop">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                  {crop.regions && crop.regions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {crop.regions.map((region) => (
                    <span key={region} className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                      {region}
                    </span>
                  ))}
                </div>
                  )}
                  {crop.season && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Season:</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700">
                    {crop.season}
                  </span>
                </div>
                  )}
                {crop.notes && (
                    <p className="text-sm text-gray-500 line-clamp-2">{crop.notes}</p>
                )}
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {/* Crop View Modal */}
      <CropViewModal
        crop={viewingCrop}
        isOpen={!!viewingCrop}
        onClose={() => setViewingCrop(null)}
      />
    </div>
  )
}

export default CropManagement


