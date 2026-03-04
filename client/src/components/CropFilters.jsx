import React from 'react'
import { X, Filter } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const CropFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const { content } = useLanguage()
  const f = content?.cropAdvisoryPage?.filters || {}
  const regions = ['Terai', 'Hill', 'Mountain']
  const seasons = ['Spring', 'Summer', 'Rainy', 'Autumn', 'Pre-winter', 'Winter']

  const hasActiveFilters = filters.region || filters.season || filters.category

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-emerald-400" />
          <h3 className="font-semibold text-white">{f.filterCrops || 'Filter Crops'}</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          >
            <X size={16} />
            {f.clearAll || 'Clear All'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Region Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            {f.region || 'Region'}
          </label>
          <select
            value={filters.region || ''}
            onChange={(e) => onFilterChange('region', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="">{f.allRegions || 'All Regions'}</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Season Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            {f.season || 'Season'}
          </label>
          <select
            value={filters.season || ''}
            onChange={(e) => onFilterChange('season', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="">{f.allSeasons || 'All Seasons'}</option>
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            {f.category || 'Category'}
          </label>
          <input
            type="text"
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            placeholder={f.categoryPlaceholder || 'e.g., Cereal, Vegetable'}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.region && (
            <span className="px-3 py-1 bg-emerald-900/50 text-emerald-200 border border-emerald-700/30 rounded-full text-sm font-medium flex items-center gap-1">
              {f.region || 'Region'}: {filters.region}
              <button
                onClick={() => onFilterChange('region', '')}
                className="hover:text-emerald-100 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.season && (
            <span className="px-3 py-1 bg-blue-900/50 text-blue-200 border border-blue-700/30 rounded-full text-sm font-medium flex items-center gap-1">
              {f.season || 'Season'}: {filters.season}
              <button
                onClick={() => onFilterChange('season', '')}
                className="hover:text-blue-100 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="px-3 py-1 bg-purple-900/50 text-purple-200 border border-purple-700/30 rounded-full text-sm font-medium flex items-center gap-1">
              {f.category || 'Category'}: {filters.category}
              <button
                onClick={() => onFilterChange('category', '')}
                className="hover:text-purple-100 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default CropFilters

