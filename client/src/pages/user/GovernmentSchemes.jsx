import React, { useState, useEffect } from 'react'
import { Search, Filter, X, MapPin, Calendar, Building, CheckCircle2, XCircle, Clock, ExternalLink, FileText, Landmark, Home, Clipboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAllGovernmentSchemes, searchGovernmentSchemes, getFilteredGovernmentSchemes } from '../../services/api'
import nepalData from '../../utils/nepalProvincesDistricts.json'

const GovernmentSchemes = () => {
  const navigate = useNavigate()
  const [schemes, setSchemes] = useState([])
  const [filteredSchemes, setFilteredSchemes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    status: '',
    level: '',
    province: '',
    district: '',
    schemeType: '',
    regionScope: '',
  })

  // Fetch schemes on mount
  useEffect(() => {
    fetchSchemes()
  }, [])

  // Apply filters when they change
  useEffect(() => {
    if (schemes.length > 0) {
      applyFilters()
    }
  }, [filters, searchTerm, schemes])

  const fetchSchemes = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await getAllGovernmentSchemes({}, false) // Use cache
      if (response.success && response.schemes) {
        setSchemes(response.schemes)
        setFilteredSchemes(response.schemes)
      }
    } catch (err) {
      console.error('Error fetching schemes:', err)
      setError(err.message || 'Failed to load government schemes')
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
      const response = await searchGovernmentSchemes(searchTerm, false)
      if (response.success && response.schemes) {
        setFilteredSchemes(response.schemes)
      }
    } catch (err) {
      console.error('Error searching schemes:', err)
      setError(err.message || 'Failed to search schemes')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...schemes]

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(scheme =>
        scheme.title?.toLowerCase().includes(query) ||
        scheme.description?.toLowerCase().includes(query) ||
        scheme.schemeType?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(scheme => scheme.status === filters.status)
    }

    // Apply level filter
    if (filters.level) {
      filtered = filtered.filter(scheme => scheme.level === filters.level)
    }

    // Apply province filter
    if (filters.province) {
      filtered = filtered.filter(scheme => scheme.provinceName === filters.province)
    }

    // Apply district filter
    if (filters.district) {
      filtered = filtered.filter(scheme => scheme.districtName === filters.district)
    }

    // Apply scheme type filter
    if (filters.schemeType) {
      filtered = filtered.filter(scheme => scheme.schemeType === filters.schemeType)
    }

    // Apply region scope filter
    if (filters.regionScope) {
      filtered = filtered.filter(scheme => scheme.regionScope === filters.regionScope)
    }

    setFilteredSchemes(filtered)
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
    setFilteredSchemes(schemes)
  }

  const handleViewDetails = (scheme) => {
    navigate(`/government-schemes/${scheme.id}`)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/40">
            <CheckCircle2 size={12} />
            Active
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
            <XCircle size={12} />
            Expired
          </span>
        )
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/40">
            <Clock size={12} />
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
        return <Landmark size={20} className="text-slate-300" />
      case 'Provincial':
        return <Building size={20} className="text-slate-300" />
      case 'Local':
        return <Home size={20} className="text-slate-300" />
      default:
        return <Clipboard size={20} className="text-slate-300" />
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

  const availableDistricts = filters.province
    ? nepalData.provinces.find(p => p.province_name === filters.province)?.districts || []
    : []

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
              <Building className="text-emerald-400" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Government Schemes & Subsidies</h1>
          </div>
          <p className="text-slate-300 text-lg">
            Discover available government programs and subsidies for farmers
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search schemes by title, description, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              <Filter size={18} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-emerald-600 rounded-full px-2 py-0.5 text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Sidebar */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>

                {/* Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Levels</option>
                    <option value="Central">Central</option>
                    <option value="Provincial">Provincial</option>
                    <option value="Local">Local</option>
                  </select>
                </div>

                {/* Province Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Province</label>
                  <select
                    value={filters.province}
                    onChange={(e) => setFilters({ ...filters, province: e.target.value, district: '' })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Provinces</option>
                    {nepalData.provinces.map((province) => (
                      <option key={province.province_id} value={province.province_name}>
                        {province.province_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">District</label>
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    disabled={!filters.province}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-900/50 disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    <option value="">All Districts</option>
                    {availableDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scheme Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Scheme Type</label>
                  <input
                    type="text"
                    placeholder="e.g., Subsidy, Grant"
                    value={filters.schemeType}
                    onChange={(e) => setFilters({ ...filters, schemeType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Region Scope Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Region Scope</label>
                  <select
                    value={filters.regionScope}
                    onChange={(e) => setFilters({ ...filters, regionScope: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Scopes</option>
                    <option value="specific">Specific</option>
                    <option value="district-wide">District-wide</option>
                    <option value="province-wide">Province-wide</option>
                    <option value="national">National</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-slate-300">
            {isLoading ? 'Loading...' : `Found ${filteredSchemes.length} scheme${filteredSchemes.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSchemes.length === 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
            <div className="max-w-md mx-auto">
              <FileText className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-slate-100 mb-2">No schemes found</h3>
              <p className="text-slate-300 mb-6">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              {(activeFiltersCount > 0 || searchTerm) && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scheme Cards Grid */}
        {!isLoading && filteredSchemes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((scheme) => {
              const daysRemaining = getDaysRemaining(scheme.expiryDate)
              const isExpired = scheme.status === 'expired' || (daysRemaining !== null && daysRemaining < 0)

              return (
                <div
                  key={scheme.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleViewDetails(scheme)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(scheme.level)}
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        {scheme.level || 'General'}
                      </span>
                    </div>
                    {getStatusBadge(scheme.status)}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-100 mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {scheme.title}
                  </h3>

                  {/* Description */}
                  {scheme.description && (
                    <p className="text-sm text-slate-300 mb-4 line-clamp-3">
                      {scheme.description}
                    </p>
                  )}

                  {/* Location */}
                  {(scheme.provinceName || scheme.districtName) && (
                    <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                      <MapPin size={14} className="text-emerald-400" />
                      <span>
                        {scheme.provinceName}
                        {scheme.districtName && `, ${scheme.districtName}`}
                      </span>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    {scheme.publishedDate && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Published: {new Date(scheme.publishedDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {scheme.expiryDate && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {isExpired ? (
                          <span className="text-red-400 font-semibold">Expired</span>
                        ) : daysRemaining !== null && daysRemaining <= 30 ? (
                          <span className="text-orange-400 font-semibold">
                            {daysRemaining} days left
                          </span>
                        ) : (
                          <span>Expires: {new Date(scheme.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-green-700 transition-all flex items-center justify-center gap-2">
                    View Details
                    <ExternalLink size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default GovernmentSchemes
