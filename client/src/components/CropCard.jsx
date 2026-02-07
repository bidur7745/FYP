import React from 'react'
import { MapPin, Calendar, Eye, CheckCircle2, MapPin as LocationIcon } from 'lucide-react'

const CropCard = ({ crop, matchType = 'none', onViewDetails }) => {
  const getBadgeConfig = () => {
    switch (matchType) {
      case 'perfect':
        return {
          label: 'Perfect Match',
          className: 'bg-emerald-500 text-white',
          icon: CheckCircle2,
        }
      case 'location':
        return {
          label: 'Location Match',
          className: 'bg-blue-500 text-white',
          icon: LocationIcon,
        }
      case 'season':
        return {
          label: 'Season Match',
          className: 'bg-yellow-500 text-white',
          icon: Calendar,
        }
      default:
        return null
    }
  }

  const badge = getBadgeConfig()

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-900/30 to-green-900/30 overflow-hidden">
        {crop.imageUrl ? (
          <img
            src={crop.imageUrl}
            alt={crop.cropName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">🌾</div>
          </div>
        )}
        
        {/* Badge */}
        {badge && (
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badge.className}`}>
            <badge.icon size={12} />
            {badge.label}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
          {crop.cropName}
        </h3>
        
        {crop.cropCategory && (
          <p className="text-sm text-gray-300 mb-3">{crop.cropCategory}</p>
        )}

        {/* Quick Info */}
        <div className="space-y-2 mb-4">
          {crop.regions && crop.regions.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MapPin size={16} className="text-blue-400" />
              <span className="line-clamp-1">
                {crop.regions.join(', ')}
              </span>
            </div>
          )}
          
          {crop.season && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar size={16} className="text-purple-400" />
              <span>{crop.season}</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails(crop)}
          className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn"
        >
          <Eye size={18} />
          <span>View Details</span>
        </button>
      </div>
    </div>
  )
}

export default CropCard

