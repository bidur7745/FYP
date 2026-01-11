import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, X, Filter, ChevronDown, MapPin, Calendar } from 'lucide-react'
import { getUserAlerts, markAlertAsRead, getUnreadAlertCount } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'

const Alerts = () => {
  const navigate = useNavigate()
  const { content } = useLanguage()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ severity: '', type: '' })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/signup')
      return
    }

    loadAlerts()
  }, [navigate, filters])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await getUserAlerts(filters)
      
      if (response.success) {
        setAlerts(response.alerts || [])
      } else {
        throw new Error(response.message || 'Failed to load alerts')
      }
    } catch (err) {
      console.error('Error loading alerts:', err)
      setError(err.message || 'Failed to load alerts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (alertId) => {
    try {
      const response = await markAlertAsRead(alertId)
      
      if (response.success) {
        // Update local state - mark alert as read
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.alertId === alertId ? { ...alert, isRead: true } : alert
          )
        )
        
        // Reload alerts to get updated count
        await loadAlerts()
      }
    } catch (err) {
      console.error('Error marking alert as read:', err)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({ severity: '', type: '' })
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/50'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  const getAlertIcon = (type) => {
    const icons = {
      'freeze': '❄️',
      'cold': '🧊',
      'heat': '🔥',
      'warm': '☀️',
      'rain': '🌧️',
      'heavy-rain': '⛈️',
      'drought': '🌵',
      'wind': '💨',
      'wind-moderate': '🌬️',
      'snow': '❄️',
      'freeze-forecast': '⚠️',
      'heavy-rain-forecast': '⚠️',
    }
    return icons[type] || '📢'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-emerald-400" size={48} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {content?.alerts?.title || 'Alerts & Notifications'}
            </h1>
            <p className="text-slate-400">
              {alerts.length > 0 
                ? `${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`
                : 'No active alerts'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-slate-600/50 text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <Filter size={20} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Severity
                </label>
                <select
                  value={filters.severity || ''}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Alert Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="freeze">Freeze</option>
                  <option value="cold">Cold</option>
                  <option value="heat">Heat</option>
                  <option value="warm">Warm</option>
                  <option value="rain">Rain</option>
                  <option value="heavy-rain">Heavy Rain</option>
                  <option value="drought">Drought</option>
                  <option value="wind">Wind</option>
                  <option value="snow">Snow</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-100 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} />
              <div>
                <h3 className="font-semibold mb-1">Error</h3>
                <p>{error}</p>
                <button
                  onClick={loadAlerts}
                  className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.alertId}
                className={`bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6 transition-all hover:shadow-2xl ${
                  alert.isRead ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Alert Icon */}
                  <div className="text-4xl shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{alert.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-4">{alert.message}</p>
                      </div>
                      {!alert.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(alert.alertId)}
                          className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <X size={20} className="text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* Recommended Actions */}
                    {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                      <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/30">
                        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                          <AlertCircle size={18} className="text-emerald-400" />
                          Recommended Actions
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                          {alert.recommendedActions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Alert Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 pt-3 border-t border-slate-700/30">
                      {alert.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{alert.location}</span>
                        </div>
                      )}
                      {alert.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{formatDate(alert.createdAt)}</span>
                        </div>
                      )}
                      {alert.type && (
                        <span className="px-2 py-1 bg-slate-800/50 rounded text-xs">
                          {alert.type.replace(/-/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Alerts</h3>
            <p className="text-gray-300">
              {filters.severity || filters.type
                ? 'No alerts found matching your filters.'
                : "You don't have any active weather alerts at the moment."}
            </p>
            {(filters.severity || filters.type) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alerts
