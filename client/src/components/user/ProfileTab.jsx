import React from 'react'
import { User, MapPin, Phone, Home, Edit, Award, GraduationCap, Briefcase } from 'lucide-react'

const ProfileTab = ({ userProfile, profileImage, onEdit }) => {
  return (
    <div className="space-y-6 pt-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">Profile Information</h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Edit size={18} />
          Edit Profile
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 space-y-4 pb-6">
          {/* Profile picture + Name */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
            <div className="shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userProfile?.user?.name || 'Profile'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/40"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                  <User className="text-slate-400" size={32} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-400 mb-1">Full Name</p>
              <p className="text-slate-100 font-medium text-lg truncate">
                {userProfile?.user?.name || 'Not set'}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
            <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
              <User className="text-slate-300" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-400 mb-1">Email</p>
              <p className="text-slate-100 font-medium truncate">
                {userProfile?.user?.email || 'Not set'}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
            <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
              <Phone className="text-slate-300" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-400 mb-1">Phone Number</p>
              <p className="text-slate-100 font-medium">
                {userProfile?.userDetails?.phone || 'Not set'}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
            <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
              <Home className="text-slate-300" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-400 mb-1">Address</p>
              <p className="text-slate-100 font-medium">
                {userProfile?.userDetails?.address || 'Not set'}
              </p>
            </div>
          </div>

          {/* Farm Location */}
          <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
            <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
              <MapPin className="text-slate-300" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-400 mb-1">Farm Location</p>
              <p className="text-slate-100 font-medium">
                {userProfile?.userDetails?.farmLocation || 'Not set'}
              </p>
              {userProfile?.userDetails?.farmLocation && (
                <p className="text-xs text-emerald-400 mt-1">
                  Used for personalized crop recommendations
                </p>
              )}
            </div>
          </div>

          {/* Skills */}
          {userProfile?.userDetails?.skills && (
            <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
              <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
                <Award className="text-slate-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-400 mb-1">Skills</p>
                <p className="text-slate-100 font-medium">{userProfile.userDetails.skills}</p>
              </div>
            </div>
          )}

          {/* Education */}
          {userProfile?.userDetails?.education && (
            <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
              <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
                <GraduationCap className="text-slate-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-400 mb-1">Education</p>
                <p className="text-slate-100 font-medium">{userProfile.userDetails.education}</p>
              </div>
            </div>
          )}

          {/* Years of Experience */}
          {userProfile?.userDetails?.yearsOfExperience !== null && userProfile?.userDetails?.yearsOfExperience !== undefined && (
            <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
              <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
                <Briefcase className="text-slate-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-400 mb-1">Years of Experience</p>
                <p className="text-slate-100 font-medium">
                  {userProfile.userDetails.yearsOfExperience} {userProfile.userDetails.yearsOfExperience === 1 ? 'year' : 'years'}
                </p>
              </div>
            </div>
          )}

          {/* Bio */}
          {userProfile?.userDetails?.bio && (
            <div className="flex items-start gap-4 pt-4 border-t border-slate-700">
              <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
                <User className="text-slate-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-400 mb-1">Bio</p>
                <p className="text-slate-300 text-sm">{userProfile.userDetails.bio}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileTab
