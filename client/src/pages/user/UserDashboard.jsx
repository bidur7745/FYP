import React, { useEffect, useState } from 'react'
import { getUserProfile } from '../../services/api'
import ProfileCompletion from '../../components/user/ProfileCompletion'
import OverviewTab from '../../components/user/OverviewTab'
import ProfileTab from '../../components/user/ProfileTab'
import QueriesTab from '../../components/user/QueriesTab'
import SettingsTab from '../../components/user/SettingsTab'
import {
  LayoutDashboard,
  User,
  MessageSquare,
  Settings,
} from 'lucide-react'

const UserDashboard = () => {
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'queries', label: 'My Queries', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async (forceRefresh = false) => {
    try {
      if (!userProfile) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await getUserProfile(forceRefresh)

      if (response.success) {
        setUserProfile(response.data)
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
    const filled = fields.filter((f) => f && f.trim() !== '').length
    return Math.round((filled / fields.length) * 100)
  }

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1
    if (month >= 12 || month <= 2) return 'Winter'
    if (month >= 3 && month <= 5) return 'Spring'
    if (month >= 6 && month <= 9) return 'Monsoon'
    return 'Autumn'
  }

  const completion = calculateProfileCompletion()
  const isProfileComplete = completion === 100
  const profileImage = userProfile?.userDetails?.profileImage

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab userProfile={userProfile} isProfileComplete={isProfileComplete} completion={completion} getCurrentSeason={getCurrentSeason} onCompleteProfile={() => setShowProfileModal(true)} />
      case 'profile':
        return <ProfileTab userProfile={userProfile} profileImage={profileImage} onEdit={() => setShowProfileModal(true)} />
      case 'queries':
        return <QueriesTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <OverviewTab userProfile={userProfile} isProfileComplete={isProfileComplete} completion={completion} getCurrentSeason={getCurrentSeason} onCompleteProfile={() => setShowProfileModal(true)} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-700 rounded w-1/4"></div>
            <div className="h-64 bg-slate-800/50 rounded-xl border border-slate-700"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Secondary Navbar for Farmer */}
      <div className="sticky top-20 z-30 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
          <nav className="flex items-center justify-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-lg ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {renderContent()}
      </div>

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
