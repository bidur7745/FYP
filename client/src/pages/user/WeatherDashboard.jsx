import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Loader2, AlertCircle, RefreshCw, Cloud, Droplet, Wind, Thermometer } from 'lucide-react'
import { getCurrentWeather, getWeatherForecast, getExtendedWeather } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import WeatherGraph from './WeatherGraph'

const WeatherDashboard = () => {
  const navigate = useNavigate()
  const { content } = useLanguage()
  const [locationStatus, setLocationStatus] = useState('checking') // checking, requesting, granted, denied, error, ready
  const [coordinates, setCoordinates] = useState(null) // {latitude, longitude}
  const [locationName, setLocationName] = useState(null) // City name from reverse geocode
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [extendedWeatherData, setExtendedWeatherData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/signup')
      return
    }

    // Request location on mount
    requestBrowserLocation()
  }, [navigate])

  // Request browser geolocation
  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please use a modern browser.')
      setLocationStatus('error')
      return
    }

    setLocationStatus('requesting')
    setLoading(true)
    setError('')

    const options = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0, // Don't use cached location
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const coords = { latitude, longitude }

          setCoordinates(coords)
          setLocationStatus('granted')

          // Load weather data using coordinates
          await loadWeatherData(latitude, longitude)

        } catch (err) {
          console.error('Error processing location:', err)
          setError(err.message || 'Failed to process location. Please try again.')
          setLocationStatus('error')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        handleGeolocationError(error)
      },
      options
    )
  }

  // Handle geolocation errors
  const handleGeolocationError = (error) => {
    let errorMessage = ''

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
        setLocationStatus('denied')
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please try again or check your device settings.'
        setLocationStatus('error')
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.'
        setLocationStatus('error')
        break
      default:
        errorMessage = 'An unknown error occurred while getting location.'
        setLocationStatus('error')
        break
    }

    setError(errorMessage)
  }

  // Handle refresh button click - force refresh from API
  const handleRefresh = () => {
    if (coordinates) {
      loadWeatherData(coordinates.latitude, coordinates.longitude, true)
    } else {
      requestBrowserLocation()
    }
  }

  // Load weather data using coordinates
  const loadWeatherData = async (latitude, longitude, forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')

      // Get current weather (includes alerts) - will use cache if available and not forcing refresh
      const weatherResponse = await getCurrentWeather(latitude, longitude, forceRefresh)
      
      if (weatherResponse.success) {
        setWeatherData(weatherResponse.weather)
        setLocationName(weatherResponse.location?.name || weatherResponse.location?.city || 'Unknown')
        setAlerts(weatherResponse.alerts || [])

        // Load extended weather (hourly + daily) for graphs
        try {
          const extendedResponse = await getExtendedWeather(latitude, longitude, forceRefresh)
          if (extendedResponse.success) {
            setExtendedWeatherData(extendedResponse)
          }
        } catch (extendedErr) {
          console.error('Extended weather load error:', extendedErr)
          // Fallback to forecast if extended weather fails
          try {
            const forecastResponse = await getWeatherForecast(latitude, longitude, forceRefresh)
            if (forecastResponse.success) {
              setForecastData(forecastResponse.forecast)
            }
          } catch (forecastErr) {
            console.error('Forecast load error:', forecastErr)
            // Non-critical error, continue without forecast
          }
        }

        // Load extended weather data (hourly forecast) for graphs - will use cache if available
        try {
          const extendedResponse = await getExtendedWeather(latitude, longitude, forceRefresh)
          if (extendedResponse.success) {
            setExtendedWeatherData(extendedResponse)
          }
        } catch (extendedErr) {
          console.error('Extended weather load error:', extendedErr)
          // Non-critical error, continue without extended data
        }
      } else {
        throw new Error(weatherResponse.message || 'Failed to load weather data')
      }
    } catch (err) {
      console.error('Error loading weather:', err)
      setError(err.message || 'Failed to load weather data. Please try again.')
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // Format temperature
  const formatTemp = (temp) => {
    return `${Math.round(temp)}°C`
  }

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Process forecast data to get daily forecasts
  const getDailyForecast = (forecastList) => {
    if (!forecastList || forecastList.length === 0) return []

    // Group forecasts by day
    const dailyForecasts = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    
    forecastList.forEach((item) => {
      const itemDate = new Date(item.dt * 1000)
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate())
      const dayKey = itemDateOnly.getTime() // Use timestamp for day key
      
      // Skip today if we want to start from tomorrow
      // For now, include today
      if (!dailyForecasts[dayKey]) {
        dailyForecasts[dayKey] = {
          date: itemDateOnly,
          items: [],
          maxTemp: item.main.temp,
          minTemp: item.main.temp,
          maxTempRecord: item.main.temp_max || item.main.temp,
          minTempRecord: item.main.temp_min || item.main.temp,
        }
      }
      
      dailyForecasts[dayKey].items.push(item)
      
      // Track actual max/min from the data
      if (item.main.temp > dailyForecasts[dayKey].maxTemp) {
        dailyForecasts[dayKey].maxTemp = item.main.temp
      }
      if (item.main.temp < dailyForecasts[dayKey].minTemp) {
        dailyForecasts[dayKey].minTemp = item.main.temp
      }
      
      // Also check temp_max/temp_min fields if available
      if (item.main.temp_max && item.main.temp_max > dailyForecasts[dayKey].maxTempRecord) {
        dailyForecasts[dayKey].maxTempRecord = item.main.temp_max
      }
      if (item.main.temp_min && item.main.temp_min < dailyForecasts[dayKey].minTempRecord) {
        dailyForecasts[dayKey].minTempRecord = item.main.temp_min
      }
    })

    // Convert to array and get representative forecast for each day
    const dailyArray = Object.values(dailyForecasts)
      .sort((a, b) => a.date - b.date) // Sort by date
      .slice(0, 5) // Get first 5 days
      .map((dayData) => {
        // Find the item closest to 12 PM (noon) for representative weather
        let representativeItem = dayData.items[0]
        let closestToNoon = Infinity
        
        dayData.items.forEach((item) => {
          const itemDate = new Date(item.dt * 1000)
          const hour = itemDate.getHours()
          const distanceFromNoon = Math.abs(hour - 12)
          
          if (distanceFromNoon < closestToNoon) {
            closestToNoon = distanceFromNoon
            representativeItem = item
          }
        })
        
        // Use maxTempRecord and minTempRecord, fallback to calculated max/min
        const maxTemp = dayData.maxTempRecord || dayData.maxTemp
        const minTemp = dayData.minTempRecord || dayData.minTemp
        
        return {
          ...representativeItem,
          dt: dayData.date.getTime() / 1000, // Use the day's start timestamp
          main: {
            ...representativeItem.main,
            temp: Math.round((maxTemp + minTemp) / 2), // Average of max and min for display
            temp_max: maxTemp,
            temp_min: minTemp,
          },
        }
      })

    return dailyArray
  }

  // Get weather icon
  const getWeatherIcon = (main) => {
    const icons = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️',
    }
    return icons[main] || '🌤️'
  }

  // Get severity badge color
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

  // Loading state
  if (locationStatus === 'checking' || locationStatus === 'requesting' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="animate-spin text-emerald-400 mx-auto mb-4" size={48} />
              <p className="text-slate-300 text-lg">
                {locationStatus === 'requesting'
                  ? 'Requesting location permission...'
                  : 'Loading weather data...'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {locationStatus === 'requesting' && 'Please allow location access when prompted'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error or permission denied state
  if (locationStatus === 'denied' || locationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/60 backdrop-blur-xl shadow-xl p-8 text-center">
              <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
              <h2 className="text-xl font-semibold text-white mb-2">Location Access Required</h2>
              <p className="text-slate-300 mb-4">{error}</p>
              <div className="space-y-2 text-sm text-slate-400 mb-6">
                <p><strong className="text-white">To enable location:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Click the lock/info icon in your browser address bar</li>
                  <li>Set Location permission to "Allow"</li>
                  <li>Click the button below to try again</li>
                </ol>
              </div>
              <button
                onClick={requestBrowserLocation}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main weather dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Location Header */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="text-emerald-400" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white">{locationName || 'Loading...'}</h2>
                {coordinates && (
                  <p className="text-sm text-slate-400">
                    {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh Weather Data (Force API Update)"
            >
              <RefreshCw className={`text-white ${loading ? 'animate-spin' : ''}`} size={20} />
            </button>
          </div>
        </div>

        {weatherData ? (
          <div className="space-y-6">
            {/* Current Weather Card */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Weather Info */}
                <div className="flex items-center gap-6">
                  <div className="text-6xl">
                    {getWeatherIcon(weatherData.weather[0]?.main)}
                  </div>
                  <div>
                    <h3 className="text-5xl font-bold text-white mb-2">
                      {formatTemp(weatherData.main.temp)}
                    </h3>
                    <p className="text-slate-300 capitalize text-lg">
                      {weatherData.weather[0]?.description || 'N/A'}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Feels like {formatTemp(weatherData.main.feels_like)}
                    </p>
                  </div>
                </div>

                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Droplet size={18} />
                      <span className="text-sm">Humidity</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{weatherData.main.humidity}%</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Wind size={18} />
                      <span className="text-sm">Wind</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {weatherData.wind?.speed ? `${(weatherData.wind.speed * 3.6).toFixed(1)} km/h` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Cloud size={18} />
                      <span className="text-sm">Clouds</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{weatherData.clouds?.all || 0}%</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Thermometer size={18} />
                      <span className="text-sm">Pressure</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{weatherData.main.pressure} hPa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            {alerts.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="text-red-400" size={24} />
                  Active Weather Alerts ({alerts.length})
                </h3>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{alert.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mb-3 opacity-90">{alert.message}</p>
                      {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current/20">
                          <p className="text-xs font-semibold mb-2">Recommended Actions:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                            {alert.recommendedActions.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forecast Section */}
            {forecastData && forecastData.list && (() => {
              const dailyForecasts = getDailyForecast(forecastData.list)
              return dailyForecasts.length > 0 ? (
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">5-Day Forecast</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {dailyForecasts.map((item, index) => (
                      <div
                        key={index}
                        className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 text-center"
                      >
                        <p className="text-slate-400 text-sm mb-2">
                          {formatDate(item.dt)}
                        </p>
                        <div className="text-3xl mb-2">
                          {getWeatherIcon(item.weather[0]?.main)}
                        </div>
                        <div className="mb-1">
                          <p className="text-lg font-bold text-white">
                            {formatTemp(item.main.temp)}
                          </p>
                          {(item.main.temp_max && item.main.temp_min) && (
                            <p className="text-xs text-slate-400">
                              {formatTemp(item.main.temp_max)} / {formatTemp(item.main.temp_min)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 capitalize mb-2">
                          {item.weather[0]?.description || 'N/A'}
                        </p>
                        <div className="flex flex-col gap-1.5 mt-2 text-xs text-slate-400">
                          <div className="flex items-center justify-center gap-1.5">
                            <Droplet size={14} />
                            <span>{item.main.humidity}%</span>
                          </div>
                          <div className="flex items-center justify-center gap-1.5">
                            <Wind size={14} />
                            <span>{(item.wind?.speed * 3.6 || 0).toFixed(0)} km/h</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {/* Weather Graphs - Temperature and Precipitation */}
            {weatherData && (extendedWeatherData || forecastData) && (
              <WeatherGraph
                currentWeather={weatherData}
                forecastData={forecastData}
                extendedWeather={extendedWeatherData}
              />
            )}

          </div>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-emerald-400 mx-auto mb-4" size={48} />
            <p className="text-slate-300">Loading weather data...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeatherDashboard
