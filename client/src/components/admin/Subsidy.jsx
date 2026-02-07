import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Filter, X } from 'lucide-react'
import {
  getAllGovernmentSchemes,
  createGovernmentScheme,
  updateGovernmentScheme,
  deleteGovernmentScheme,
  getGovernmentSchemeById,
  updateGovernmentSchemeDetails,
  searchGovernmentSchemes,
} from '../../services/api'
import SchemeFormModal from './SchemeFormModal'
import SchemeViewModal from './SchemeViewModal'
import nepalData from '../../utils/nepalProvincesDistricts.json'

const Subsidy = () => {
  const [schemes, setSchemes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    level: '',
    province: '',
    district: '',
    schemeType: '',
    regionScope: '',
  })
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingScheme, setEditingScheme] = useState(null)
  const [viewingScheme, setViewingScheme] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')

  // Fetch schemes
  useEffect(() => {
    fetchSchemes()
  }, [filters])

  const fetchSchemes = async () => {
    try {
      setIsLoading(true)
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      const response = await getAllGovernmentSchemes(activeFilters, true)
      if (response.success && response.schemes) {
        setSchemes(response.schemes)
      }
    } catch (err) {
      console.error('Error fetching schemes:', err)
      setError(err.message || 'Failed to load schemes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchSchemes()
      return
    }
    try {
      setIsLoading(true)
      const response = await searchGovernmentSchemes(searchTerm, true)
      if (response.success && response.schemes) {
        setSchemes(response.schemes)
      }
    } catch (err) {
      console.error('Error searching schemes:', err)
      setError(err.message || 'Failed to search schemes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (schemeId, newStatus) => {
    try {
      await updateGovernmentScheme(schemeId, { status: newStatus })
      // Refresh schemes
      await fetchSchemes()
      setSuccess('Status updated successfully')
    } catch (err) {
      console.error('Error updating status:', err)
      // Display the specific error message from the API
      setError(err.message || 'Failed to update status')
    }
  }

  const handleEdit = async (scheme) => {
    try {
      // Fetch full scheme with details
      const response = await getGovernmentSchemeById(scheme.id, true)
      if (response.success && response.scheme) {
        setEditingScheme(response.scheme)
        setShowFormModal(true)
      }
    } catch (err) {
      console.error('Error fetching scheme:', err)
      setError(err.message || 'Failed to load scheme details')
    }
  }

  const handleView = async (scheme) => {
    try {
      // Fetch full scheme with details
      const response = await getGovernmentSchemeById(scheme.id, true)
      if (response.success && response.scheme) {
        setViewingScheme(response.scheme)
        setShowViewModal(true)
      }
    } catch (err) {
      console.error('Error fetching scheme:', err)
      setError(err.message || 'Failed to load scheme details')
    }
  }

  const handleDelete = async (schemeId) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) {
      return
    }

    try {
      setIsSubmitting(true)
      await deleteGovernmentScheme(schemeId)
      setSuccess('Scheme deleted successfully')
      await fetchSchemes()
    } catch (err) {
      setError(err.message || 'Failed to delete scheme')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')
      setFormError('')

      if (editingScheme) {
        // Update scheme
        await updateGovernmentScheme(editingScheme.id, formData.scheme)
        
        // Update details if provided
        if (formData.details) {
          await updateGovernmentSchemeDetails(editingScheme.id, formData.details)
        }
        
        setSuccess('Scheme updated successfully')
      } else {
        // Create new scheme
        const createPayload = {
          ...formData.scheme,
          details: formData.details || null,
        }

        await createGovernmentScheme(createPayload)
        setSuccess('Scheme created successfully')
      }

      setShowFormModal(false)
      setEditingScheme(null)
      await fetchSchemes()
    } catch (err) {
      // Extract the actual error message from the API response
      // The apiRequest function already extracts data.message, so err.message should contain the specific error
      const errorMessage = err.message || 'Failed to save scheme'
      
      // Show errors from create/update inside the modal when it's open
      if (showFormModal) {
        setFormError(errorMessage)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      status: '',
      level: '',
      province: '',
      district: '',
      schemeType: '',
      regionScope: '',
    })
    setSearchTerm('')
  }

  const filteredSchemes = schemes.filter((scheme) => {
    if (!searchTerm) return true
    return scheme.title?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Government Schemes</h2>
          <p className="text-gray-600">Manage government schemes and subsidies</p>
        </div>
        <button
          onClick={() => {
            setEditingScheme(null)
            setShowFormModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add New Scheme
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError('')} className="float-right">
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
          <button onClick={() => setSuccess('')} className="float-right">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={18} />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="upcoming">Upcoming</option>
          </select>

          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Levels</option>
            <option value="Central">Central</option>
            <option value="Provincial">Provincial</option>
            <option value="Local">Local</option>
          </select>

          <select
            value={filters.province}
            onChange={(e) => setFilters({ ...filters, province: e.target.value, district: '' })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Provinces</option>
            {nepalData.provinces.map((province) => (
              <option key={province.province_id} value={province.province_name}>
                {province.province_name}
              </option>
            ))}
          </select>

          <select
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
            disabled={!filters.province}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Districts</option>
            {filters.province &&
              nepalData.provinces
                .find((p) => p.province_name === filters.province)
                ?.districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
          </select>

          <select
            value={filters.regionScope}
            onChange={(e) => setFilters({ ...filters, regionScope: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Scopes</option>
            <option value="specific">Specific</option>
            <option value="district-wide">District-wide</option>
            <option value="province-wide">Province-wide</option>
            <option value="national">National</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search schemes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          Search
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-600">Loading schemes...</div>
      ) : filteredSchemes.length === 0 ? (
        <div className="text-center py-8 text-gray-600">No schemes found</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Province</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">District</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Published</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSchemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{scheme.title}</div>
                      {scheme.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{scheme.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{scheme.schemeType || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{scheme.level || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{scheme.provinceName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{scheme.districtName || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={scheme.status || ''}
                        onChange={(e) => handleStatusChange(scheme.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${getStatusBadgeClass(scheme.status)}`}
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="upcoming">Upcoming</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {scheme.publishedDate ? new Date(scheme.publishedDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(scheme)}
                          className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(scheme)}
                          className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(scheme.id)}
                          disabled={isSubmitting}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <SchemeFormModal
          scheme={editingScheme}
          isOpen={showFormModal}
          error={formError}
          onClose={() => {
            setShowFormModal(false)
            setEditingScheme(null)
            setFormError('')
          }}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* View Modal */}
      {showViewModal && (
        <SchemeViewModal
          scheme={viewingScheme}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setViewingScheme(null)
          }}
        />
      )}
    </div>
  )
}

export default Subsidy
