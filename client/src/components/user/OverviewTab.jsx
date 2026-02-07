import React from 'react'
import { User, MapPin, Calendar, Sprout, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const OverviewTab = ({ userProfile, isProfileComplete, completion, getCurrentSeason, onCompleteProfile }) => {
  const profileImage = userProfile?.userDetails?.profileImage

  return (
    <div className="space-y-6 pt-14 pb-4">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={userProfile?.user?.name || 'Profile'}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <User className="text-emerald-400" size={32} />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">
              Welcome back, {userProfile?.user?.name || 'User'}!
            </h1>
            <p className="text-slate-300">
              Manage your profile and access personalized crop recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {!isProfileComplete && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/40 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-amber-400 mt-1 shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">Complete Your Profile</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Complete your profile to get personalized crop recommendations based on your location and season.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-2 max-w-[200px]">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-100">{completion}% Complete</span>
                </div>
              </div>
            </div>
            <button
              onClick={onCompleteProfile}
              className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
              <User className="text-emerald-400" size={24} />
            </div>
            {isProfileComplete ? (
              <CheckCircle2 className="text-emerald-400" size={20} />
            ) : (
              <AlertCircle className="text-amber-400" size={20} />
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-400 mb-1">Profile Status</h3>
          <p className="text-2xl font-bold text-slate-100">
            {isProfileComplete ? 'Complete' : 'Incomplete'}
          </p>
          <p className="text-xs text-slate-400 mt-1">{completion}% filled</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
              <MapPin className="text-emerald-400" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-400 mb-1">Farm Location</h3>
          <p className="text-2xl font-bold text-slate-100">
            {userProfile?.userDetails?.farmLocation || 'Not Set'}
          </p>
          {userProfile?.userDetails?.farmLocation && (
            <p className="text-xs text-emerald-400 mt-1">Ready for recommendations</p>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
              <Calendar className="text-emerald-400" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-400 mb-1">Current Season</h3>
          <p className="text-2xl font-bold text-slate-100">{getCurrentSeason()}</p>
          <p className="text-xs text-slate-400 mt-1">Based on current date</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="border-b border-slate-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-100">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/crop-advisory"
              className="flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all group"
            >
              <div className="p-2 bg-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                <Sprout className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100">Crop Advisory</p>
                <p className="text-xs text-slate-400">
                  {userProfile?.userDetails?.farmLocation
                    ? `View crops for ${userProfile.userDetails.farmLocation}`
                    : 'Complete profile to view'}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {isProfileComplete && userProfile?.userDetails?.farmLocation && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-emerald-500/40 p-6 pb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 mt-1 shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">Profile Complete!</h3>
                <p className="text-sm text-slate-300">
                  You're all set to receive personalized crop recommendations based on your location in{' '}
                  <span className="font-semibold text-emerald-400">
                    {userProfile.userDetails.farmLocation}
                  </span>{' '}
                  and the current season.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OverviewTab
