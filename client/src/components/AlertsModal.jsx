import React, { useState, useEffect } from 'react'
import { X, Filter, AlertCircle, MapPin, Calendar, Bell, MessageSquare } from 'lucide-react'
import { getUserAlerts, markAlertAsRead, getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

const AlertsModal = ({ isOpen, onClose, onCountChange }) => {
  const { content } = useLanguage()
  const [activeTab, setActiveTab] = useState('alerts') // 'alerts' | 'notifications'
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ severity: '', type: '' })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAlerts()
      loadNotifications()
    }
  }, [isOpen, filters])

  const loadNotifications = async () => {
    try {
      setNotifLoading(true)
      const res = await getNotifications()
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications)
      }
    } catch (_) {
      setNotifications([])
    } finally {
      setNotifLoading(false)
    }
  }

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
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.alertId === alertId ? { ...alert, isRead: true } : alert
          )
        )
        onCountChange?.(true)
      }
    } catch (err) {
      console.error('Error marking alert as read:', err)
    }
  }

  const handleNotificationRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
      onCountChange?.()
    } catch (_) {}
  }

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      onCountChange?.()
    } catch (_) {}
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
        return 'bg-red-100 text-red-800 border-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-400'
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

  const unreadNotifCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl border border-gray-300 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header + Tabs */}
          <div className="border-b border-gray-300">
            <div className="flex items-center justify-between p-6 pb-2">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {content?.alerts?.title || 'Alerts & Notifications'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {activeTab === 'alerts'
                    ? (alerts.length > 0 ? `${alerts.length} active alert${alerts.length === 1 ? '' : 's'}` : 'No active alerts')
                    : (notifications.length > 0 ? `${notifications.length} notification${notifications.length === 1 ? '' : 's'}` : 'No notifications')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'alerts' && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={showFilters ? 'Hide Filters' : 'Show Filters'}
                  >
                    <Filter className="text-gray-700" size={20} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="text-gray-700" size={24} />
                </button>
              </div>
            </div>
            <div className="flex gap-1 px-6 pb-0">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === 'alerts' ? 'bg-gray-100 text-black border-b-2 border-emerald-500' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertCircle size={18} /> Weather Alerts
                </span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === 'notifications' ? 'bg-gray-100 text-black border-b-2 border-emerald-500' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bell size={18} /> Notifications
                  {unreadNotifCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Filters - only for alerts */}
          {activeTab === 'alerts' && showFilters && (
            <div className="px-6 pt-4 pb-2 border-b border-gray-300 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Severity
                  </label>
                  <select
                    value={filters.severity || ''}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  >
                    <option value="">All Severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Alert Type
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
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
                    className="w-full px-4 py-2 bg-gray-200 border border-gray-300 text-black rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'notifications' ? (
              <>
                {unreadNotifCount > 0 && (
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
                {notifLoading && notifications.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-xl border p-4 ${
                          n.read ? 'bg-gray-50 border-gray-200' : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <MessageSquare className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                            <div>
                              <h3 className="font-semibold text-black">{n.title}</h3>
                              {n.body && <p className="text-sm text-gray-700 mt-1">{n.body}</p>}
                              <p className="text-xs text-gray-500 mt-2">{formatDate(n.createdAt)}</p>
                            </div>
                          </div>
                          {!n.read && (
                            <button
                              onClick={() => handleNotificationRead(n.id)}
                              className="shrink-0 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100 rounded-lg"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-300 p-12 text-center">
                    <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-black mb-2">No Notifications</h3>
                    <p className="text-gray-600 text-sm">You have no app notifications yet.</p>
                  </div>
                )}
              </>
            ) : loading && alerts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-700">Loading alerts...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-4 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-red-600" />
                  <div>
                    <h3 className="font-semibold mb-1">Error</h3>
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={loadAlerts}
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.alertId}
                    className={`bg-white rounded-xl border border-gray-300 shadow-lg p-4 transition-all hover:shadow-xl ${
                      alert.isRead ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Alert Icon */}
                      <div className="text-3xl shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>

                      {/* Alert Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-lg font-bold text-black truncate">{alert.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 border ${getSeverityColor(alert.severity)}`}>
                                {alert.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-3">{alert.message}</p>
                          </div>
                          {!alert.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(alert.alertId)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-2"
                              title="Mark as read"
                            >
                              <X size={18} className="text-gray-600" />
                            </button>
                          )}
                        </div>

                        {/* Recommended Actions */}
                        {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                            <h4 className="font-semibold text-black text-sm mb-2 flex items-center gap-2">
                              <AlertCircle size={16} className="text-emerald-600" />
                              Recommended Actions
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                              {alert.recommendedActions.map((action, idx) => (
                                <li key={idx}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Alert Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-2 border-t border-gray-200">
                          {alert.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-gray-500" />
                              <span className="truncate">{alert.location}</span>
                            </div>
                          )}
                          {alert.createdAt && (
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-gray-500" />
                              <span>{formatDate(alert.createdAt)}</span>
                            </div>
                          )}
                          {alert.type && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
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
              <div className="bg-white rounded-xl border border-gray-300 shadow-lg p-12 text-center">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-black mb-2">No Active Alerts</h3>
                <p className="text-gray-600 text-sm">
                  {filters.severity || filters.type
                    ? 'No alerts found matching your filters.'
                    : "You don't have any active weather alerts at the moment."}
                </p>
                {(filters.severity || filters.type) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AlertsModal

