import React, { useEffect, useState } from 'react'
import { getDashboard, getUserProfile } from '../../services/api'
import ProfileCompletion from '../../components/user/ProfileCompletion'
import { 
  User, 
  MapPin, 
  Phone, 
  Home, 
  Edit, 
  CheckCircle2, 
  AlertCircle,
  Sprout,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'

const UserDashboard = () => {
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async (forceRefresh = false) => {
    try {
      // Show loading only if no cached data exists
      if (!userProfile) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      
      const response = await getUserProfile(forceRefresh)
      
      if (response.success) {
        setUserProfile(response.data)
        // Show profile modal if profile is incomplete
        const details = response.data.userDetails
        if (!details?.farmLocation || !details?.phone || !details?.address) {
          setShowProfileModal(true)
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleProfileUpdate = (updatedData) => {
    setUserProfile(updatedData)
    // Refresh cache after update
    fetchUserProfile(true)
  }

  const calculateProfileCompletion = () => {
    if (!userProfile) return 0
    const { user, userDetails } = userProfile
    const fields = [
      user?.name,
      userDetails?.phone,
      userDetails?.address,
      userDetails?.farmLocation,
    ]
    const filled = fields.filter(f => f && f.trim() !== '').length
    return Math.round((filled / fields.length) * 100)
  }

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1 // 1-12
    if (month >= 12 || month <= 2) return 'Winter'
    if (month >= 3 && month <= 5) return 'Spring'
    if (month >= 6 && month <= 9) return 'Monsoon'
    return 'Autumn'
  }

  const completion = calculateProfileCompletion()
  const isProfileComplete = completion === 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {userProfile?.user?.name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Manage your profile and access personalized crop recommendations
            </p>
          </div>
          <button
            onClick={() => fetchUserProfile(true)}
            disabled={isRefreshing}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Refresh data"
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Completion Banner */}
        {!isProfileComplete && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-yellow-600 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Complete your profile to get personalized crop recommendations based on your location and season.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {completion}% Complete
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Profile Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <User className="text-emerald-600" size={24} />
              </div>
              {isProfileComplete ? (
                <CheckCircle2 className="text-emerald-500" size={20} />
              ) : (
                <AlertCircle className="text-yellow-500" size={20} />
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Profile Status</h3>
            <p className="text-2xl font-bold text-gray-900">
              {isProfileComplete ? 'Complete' : 'Incomplete'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{completion}% filled</p>
          </div>

          {/* Farm Location */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <MapPin className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Farm Location</h3>
            <p className="text-2xl font-bold text-gray-900">
              {userProfile?.userDetails?.farmLocation || 'Not Set'}
            </p>
            {userProfile?.userDetails?.farmLocation && (
              <p className="text-xs text-emerald-600 mt-1">Ready for recommendations</p>
            )}
          </div>

          {/* Current Season */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Current Season</h3>
            <p className="text-2xl font-bold text-gray-900">{getCurrentSeason()}</p>
            <p className="text-xs text-gray-500 mt-1">Based on current date</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit size={18} className="text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Name */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <User className="text-emerald-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Full Name</p>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.user?.name || 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.user?.email || 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Phone className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Phone Number</p>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.userDetails?.phone || 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Home className="text-orange-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.userDetails?.address || 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Farm Location */}
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="text-purple-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Farm Location</p>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.userDetails?.farmLocation || 'Not set'}
                    </p>
                    {userProfile?.userDetails?.farmLocation && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Used for personalized crop recommendations
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {userProfile?.userDetails?.bio && (
                  <div className="flex items-start gap-4 pt-4 border-t border-gray-100">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="text-gray-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Bio</p>
                      <p className="text-gray-700 text-sm">{userProfile.userDetails.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Crop Advisory Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  to="/crop-advisory"
                  className="flex items-center gap-4 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group"
                >
                  <div className="p-2 bg-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Sprout className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Crop Advisory</p>
                    <p className="text-xs text-gray-600">
                      {userProfile?.userDetails?.farmLocation
                        ? `View crops for ${userProfile.userDetails.farmLocation}`
                        : 'Complete profile to view'}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-gray-400 rounded-lg">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Coming Soon</p>
                    <p className="text-xs text-gray-600">More features</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            {isProfileComplete && userProfile?.userDetails?.farmLocation && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Profile Complete!</h3>
                    <p className="text-sm text-gray-700">
                      You're all set to receive personalized crop recommendations based on your location in{' '}
                      <span className="font-semibold text-emerald-700">
                        {userProfile.userDetails.farmLocation}
                      </span>
                      {' '}and the current season.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <ProfileCompletion
          userProfile={userProfile}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  )
}

export default UserDashboard
