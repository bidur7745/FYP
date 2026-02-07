import React, { useState, useEffect } from 'react'
import { X, Plus, XCircle } from 'lucide-react'
import nepalData from '../../utils/nepalProvincesDistricts.json'

const SchemeFormModal = ({ scheme, isOpen, onClose, onSubmit, isSubmitting, error }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schemeType: '',
    sector: 'Agriculture',
    level: '',
    provinceName: '',
    districtName: '',
    localBodyType: '',
    localBodyName: '',
    regionScope: '',
    sourceUrl: '',
    documentUrl: '',
    status: 'active',
    publishedDate: '',
    expiryDate: '',
  })

  const [details, setDetails] = useState({
    eligibility: '',
    benefits: '',
    applicationProcess: [],
    requiredDocuments: [],
    usageConditions: '',
  })

  const [appProcessInput, setAppProcessInput] = useState('')
  const [docInput, setDocInput] = useState('')
  const [availableDistricts, setAvailableDistricts] = useState([])

  // Get all province names
  const provinceNames = nepalData.provinces.map(p => p.province_name)

  // Update available districts when province changes
  useEffect(() => {
    if (formData.provinceName) {
      const selectedProvince = nepalData.provinces.find(
        p => p.province_name === formData.provinceName
      )
      if (selectedProvince) {
        setAvailableDistricts(selectedProvince.districts)
      } else {
        setAvailableDistricts([])
      }
    } else {
      setAvailableDistricts([])
    }
  }, [formData.provinceName])

  // Initialize districts when editing a scheme
  useEffect(() => {
    if (scheme && scheme.provinceName) {
      const selectedProvince = nepalData.provinces.find(
        p => p.province_name === scheme.provinceName
      )
      if (selectedProvince) {
        setAvailableDistricts(selectedProvince.districts)
      }
    }
  }, [scheme])

  useEffect(() => {
    if (scheme) {
      // Edit mode - populate form with scheme data
      setFormData({
        title: scheme.title || '',
        description: scheme.description || '',
        schemeType: scheme.schemeType || '',
        sector: scheme.sector || 'Agriculture',
        level: scheme.level || '',
        provinceName: scheme.provinceName || '',
        districtName: scheme.districtName || '',
        localBodyType: scheme.localBodyType || '',
        localBodyName: scheme.localBodyName || '',
        regionScope: scheme.regionScope || '',
        sourceUrl: scheme.sourceUrl || '',
        documentUrl: scheme.documentUrl || '',
        status: scheme.status || 'active',
        publishedDate: scheme.publishedDate || '',
        expiryDate: scheme.expiryDate || '',
      })

      // Populate details if available
      if (scheme.details) {
        setDetails({
          eligibility: scheme.details.eligibility || '',
          benefits: scheme.details.benefits || '',
          applicationProcess: scheme.details.applicationProcess || [],
          requiredDocuments: scheme.details.requiredDocuments || [],
          usageConditions: scheme.details.usageConditions || '',
        })
      }
    } else {
      // Add mode - reset form
      resetForm()
    }
  }, [scheme, isOpen])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      schemeType: '',
      sector: 'Agriculture',
      level: '',
      provinceName: '',
      districtName: '',
      localBodyType: '',
      localBodyName: '',
      regionScope: '',
      sourceUrl: '',
      documentUrl: '',
      status: 'active',
      publishedDate: '',
      expiryDate: '',
    })
    setDetails({
      eligibility: '',
      benefits: '',
      applicationProcess: [],
      requiredDocuments: [],
      usageConditions: '',
    })
    setAppProcessInput('')
    setDocInput('')
  }

  const handleAddProcessStep = () => {
    if (!appProcessInput.trim()) return
    setDetails({
      ...details,
      applicationProcess: [...details.applicationProcess, appProcessInput.trim()],
    })
    setAppProcessInput('')
  }

  const handleRemoveProcessStep = (index) => {
    setDetails({
      ...details,
      applicationProcess: details.applicationProcess.filter((_, i) => i !== index),
    })
  }

  const handleAddDocument = () => {
    if (!docInput.trim()) return
    setDetails({
      ...details,
      requiredDocuments: [...details.requiredDocuments, docInput.trim()],
    })
    setDocInput('')
  }

  const handleRemoveDocument = (index) => {
    setDetails({
      ...details,
      requiredDocuments: details.requiredDocuments.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      scheme: formData,
      details: Object.values(details).some(v => 
        (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v.trim() !== '')
      ) ? details : null,
    }

    onSubmit(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {scheme ? 'Edit Scheme' : 'Add New Scheme'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error inside modal */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scheme Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Scheme Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheme Type
                </label>
                <input
                  type="text"
                  value={formData.schemeType}
                  onChange={(e) => setFormData({ ...formData, schemeType: e.target.value })}
                  placeholder="e.g., Subsidy, Grant, Loan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Level</option>
                  <option value="Central">Central</option>
                  <option value="Provincial">Provincial</option>
                  <option value="Local">Local</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <select
                  value={formData.provinceName}
                  onChange={(e) => setFormData({ ...formData, provinceName: e.target.value, districtName: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Province</option>
                  {provinceNames.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <select
                  value={formData.districtName}
                  onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                  disabled={!formData.provinceName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select District</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local Body Type
                </label>
                <select
                  value={formData.localBodyType}
                  onChange={(e) => setFormData({ ...formData, localBodyType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Type</option>
                  <option value="Municipality">Municipality</option>
                  <option value="Metro">Metro</option>
                  <option value="Rural Municipality">Rural Municipality</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local Body Name
                </label>
                <input
                  type="text"
                  value={formData.localBodyName}
                  onChange={(e) => setFormData({ ...formData, localBodyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region Scope
                </label>
                <select
                  value={formData.regionScope}
                  onChange={(e) => setFormData({ ...formData, regionScope: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Scope</option>
                  <option value="specific">Specific</option>
                  <option value="district-wide">District-wide</option>
                  <option value="province-wide">Province-wide</option>
                  <option value="national">National</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Published Date
                </label>
                <input
                  type="date"
                  value={formData.publishedDate}
                  onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source URL
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document URL
                </label>
                <input
                  type="url"
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Scheme Details */}
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Scheme Details (Optional)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eligibility
              </label>
              <textarea
                value={details.eligibility}
                onChange={(e) => setDetails({ ...details, eligibility: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Benefits
              </label>
              <textarea
                value={details.benefits}
                onChange={(e) => setDetails({ ...details, benefits: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Process
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add step..."
                  value={appProcessInput}
                  onChange={(e) => setAppProcessInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProcessStep())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddProcessStep}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {details.applicationProcess.map((step, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm text-gray-700">{index + 1}. {step}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProcessStep(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Documents
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add document..."
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDocument())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddDocument}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {details.requiredDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm text-gray-700">{doc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Conditions
              </label>
              <textarea
                value={details.usageConditions}
                onChange={(e) => setDetails({ ...details, usageConditions: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : scheme ? 'Update Scheme' : 'Create Scheme'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SchemeFormModal

