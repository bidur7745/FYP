import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertCircle, Loader2, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getRecommendedCrops, getFilteredCrops, searchCrops, getUserProfile } from '../../services/api'
import CropCard from '../../components/CropCard'
import CropFilters from '../../components/CropFilters'

const CropAdvisory = () => {
  const navigate = useNavigate()
  const { content } = useLanguage()
  const t = content?.cropAdvisoryPage || {}
  const [userProfile, setUserProfile] = useState(null)
  const [recommendedData, setRecommendedData] = useState(null)
  const [filteredCrops, setFilteredCrops] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ region: '', season: '', category: '' })
  const [showFilters, setShowFilters] = useState(false)
  const recommendedScrollRef = useRef(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    if (filters.region || filters.season || filters.category) {
      loadFilteredCrops()
    } else {
      setFilteredCrops([])
    }
  }, [filters])

  const scrollRecommended = (direction) => {
    if (recommendedScrollRef.current) {
      const scrollAmount = 400 // Scroll by card width + gap
      recommendedScrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleViewDetails = (crop) => {
    navigate(`/crop-advisory/${crop.cropId}`)
  }

  const checkAuthAndLoadData = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/signup')
      return
    }

    try {
      setLoading(true)
      // Get user profile for location
      const profileResponse = await getUserProfile()
      if (profileResponse.success) {
        setUserProfile(profileResponse.data)
        
        // Check if farm location is set
        if (!profileResponse.data.userDetails?.farmLocation) {
          setError(t.setFarmLocation || 'Please complete your profile and set your farm location to get personalized recommendations.')
          setLoading(false)
          return
        }

        // Load recommended crops
        await loadRecommendedCrops()
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('token')) {
        navigate('/signup')
      } else {
        setError(err.message || t.loadError || 'Failed to load crop advisory')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendedCrops = async () => {
    try {
      const response = await getRecommendedCrops()
      if (response.success) {
        setRecommendedData(response.data)
      }
    } catch (err) {
      console.error('Error loading recommended crops:', err)
    }
  }

  const loadFilteredCrops = async () => {
    try {
      const response = await getFilteredCrops(filters)
      if (response.success) {
        setFilteredCrops(response.crops || [])
      }
    } catch (err) {
      console.error('Error loading filtered crops:', err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    setSearchLoading(true)
    try {
      const response = await searchCrops(searchQuery)
      if (response.success) {
        setSearchResults(response.crops || [])
      }
    } catch (err) {
      console.error('Error searching crops:', err)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleClearFilters = () => {
    setFilters({ region: '', season: '', category: '' })
    setFilteredCrops([])
  }

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1
    if (month === 1 || month === 2) return 'Winter'         // Shishir
    if (month === 3 || month === 4) return 'Spring'         // Basanta
    if (month === 5 || month === 6) return 'Summer'         // Grishma
    if (month === 7 || month === 8) return 'Rainy'          // Barsha
    if (month === 9 || month === 10) return 'Autumn'        // Sharad
    return 'Pre-winter'                                     // Hemanta (Nov-Dec)
  }

  const currentSeason = getCurrentSeason()
  const userRegion = userProfile?.userDetails?.farmLocation

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-400" size={48} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-16">
          <div className="max-w-md w-full bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
              <UserCircle className="text-amber-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {t.profileIncomplete || 'Profile Incomplete'}
            </h3>
            <p className="text-gray-300 mb-2">
              {t.profileIncompleteDesc || 'Your profile is not complete yet. Please fill in your details to access personalized crop recommendations.'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {t.setFarmLocation || 'Please complete your profile and set your farm location to get personalized recommendations.'}
            </p>
            <button
              onClick={() => navigate('/dashboard/user')}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
            >
              {t.completeProfile || 'Complete Profile'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!e.target.value.trim()) {
                    setSearchResults(null)
                  }
                }}
                placeholder={t.searchPlaceholder || 'Search crops by name...'}
                className="w-full pl-12 pr-4 py-3 bg-white border border-black text-black rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-black"
              />
            </div>
            <button type="submit" disabled={searchLoading} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {searchLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                (t.search || 'Search')
              )}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults !== null && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {t.searchResults || 'Search Results'}
                {searchResults.length > 0 && (
                  <span className="text-lg font-normal text-gray-300 ml-2">
                    ({searchResults.length} {searchResults.length === 1 ? (t.crop || 'crop') : (t.crops || 'crops')})
                  </span>
                )}
              </h2>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults(null)
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                {t.clearSearch || 'Clear Search'}
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {searchResults.map((crop) => (
                  <CropCard
                    key={crop.cropId}
                    crop={crop}
                    matchType="none"
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
                <p className="text-gray-300">{(t.noCropsMatching || 'No crops found matching "{query}"').replace('{query}', searchQuery)}</p>
              </div>
            )}
          </div>
        )}

        {/* Recommended Crops Section */}
        {!searchResults && recommendedData && (
          <>
            {recommendedData.perfectMatches && recommendedData.perfectMatches.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                      {t.recommendedForYou || 'Recommended for You'}
                    </h2>
                  </div>
                  {recommendedData.perfectMatches.length > 4 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => scrollRecommended('left')}
                        className="p-2 bg-slate-900/60 border border-slate-600/50 rounded-lg hover:bg-slate-800/80 transition-colors"
                        aria-label={t.scrollLeft || 'Scroll left'}
                      >
                        <ChevronLeft size={20} className="text-white" />
                      </button>
                      <button
                        onClick={() => scrollRecommended('right')}
                        className="p-2 bg-slate-900/60 border border-slate-600/50 rounded-lg hover:bg-slate-800/80 transition-colors"
                        aria-label={t.scrollRight || 'Scroll right'}
                      >
                        <ChevronRight size={20} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <div
                  ref={recommendedScrollRef}
                  className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar"
                >
                  {recommendedData.perfectMatches.map((crop) => (
                    <div key={crop.cropId} className="shrink-0 w-72">
                      <CropCard
                        crop={crop}
                        matchType="perfect"
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters for Other Crops */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white text-center flex-1">
                  {t.otherCrops || 'Other Crops That You Can Consider'}
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-slate-900/60 border border-slate-600/50 text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                >
                  {showFilters ? (t.hideFilters || 'Hide Filters') : (t.showFilters || 'Show Filters')}
                </button>
              </div>
              {showFilters && (
                <CropFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              )}
            </div>

            {/* Other Crops Section */}
            <div className="mb-12">
              {/* Show filtered crops if filters are active, otherwise show all other crops */}
              {filteredCrops.length > 0 || (filters.region || filters.season || filters.category) ? (
                filteredCrops.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredCrops.map((crop) => (
                      <CropCard
                        key={crop.cropId}
                        crop={crop}
                        matchType="none"
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
                    <p className="text-gray-300">{t.noCropsMatchingFilters || 'No crops found matching your filters.'}</p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Location Matches */}
                  {recommendedData.locationMatches && recommendedData.locationMatches.map((crop) => (
                    <CropCard
                      key={crop.cropId}
                      crop={crop}
                      matchType="location"
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                  {/* Season Matches */}
                  {recommendedData.seasonMatches && recommendedData.seasonMatches.map((crop) => (
                    <CropCard
                      key={crop.cropId}
                      crop={crop}
                      matchType="season"
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Empty State */}
            {recommendedData.counts.perfect === 0 &&
              recommendedData.counts.location === 0 &&
              recommendedData.counts.season === 0 && (
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
                  <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t.noCropsFound || 'No crops found'}
                  </h3>
                  <p className="text-gray-300">
                    {t.noCropsForLocationSeason || "We couldn't find any crops matching your location and season."}
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  )
}

export default CropAdvisory
