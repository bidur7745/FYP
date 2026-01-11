import React, { useMemo } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Thermometer, CloudRain, Snowflake, Droplet } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const WeatherGraph = ({ currentWeather, forecastData, extendedWeather }) => {
  // Process 48-hour temperature data (past 12h + future 36h)
  const temperatureData = useMemo(() => {
    if (!currentWeather) return null

    const now = Date.now() / 1000 // Current timestamp in seconds
    const past12Hours = now - (12 * 60 * 60) // 12 hours ago
    const future36Hours = now + (36 * 60 * 60) // 36 hours from now

    // Get current weather data
    const currentTemp = currentWeather.main?.temp || 0
    const currentFeelsLike = currentWeather.main?.feels_like || 0
    const currentDt = currentWeather.dt || now

    // Get hourly data from extended weather (usually only future data)
    // Fallback to forecast data if extended weather not available
    let hourlyFuture = []
    if (extendedWeather && extendedWeather.hourly && Array.isArray(extendedWeather.hourly)) {
      hourlyFuture = extendedWeather.hourly
    } else if (forecastData && forecastData.list && Array.isArray(forecastData.list)) {
      // Transform forecast data (3-hour intervals) to hourly-like data
      // Interpolate between forecast points to create hourly data
      hourlyFuture = []
      for (let i = 0; i < forecastData.list.length - 1; i++) {
        const current = forecastData.list[i]
        const next = forecastData.list[i + 1]
        const timeDiff = next.dt - current.dt
        const steps = Math.ceil(timeDiff / 3600) // Steps per hour
        
        for (let step = 0; step < steps; step++) {
          const ratio = step / steps
          hourlyFuture.push({
            dt: current.dt + (step * 3600),
            temp: current.main.temp + (next.main.temp - current.main.temp) * ratio,
            feels_like: current.main.feels_like + (next.main.feels_like - current.main.feels_like) * ratio,
            pop: current.pop || 0,
            rain: current.rain || {},
            snow: current.snow || {},
          })
        }
      }
    }
    
    // Filter for next 36 hours (future data only)
    const futureHourlyData = hourlyFuture
      .filter((item) => item.dt > now && item.dt <= future36Hours)
      .slice(0, 36) // Take first 36 hours
      .map(item => ({
        ...item,
        temp: Math.round(item.temp * 10) / 10, // Round to 1 decimal
        feels_like: Math.round(item.feels_like * 10) / 10,
      }))

    // Create past 12 hours data (estimated based on current weather)
    // Note: In production, you'd use historical API data. For now, we estimate based on typical daily patterns
    const pastHourlyData = []
    const hoursInPast = 12
    const currentHour = new Date(now * 1000).getHours()
    
    // Calculate temperature range based on current temp (assume ~8°C variation throughout day)
    const tempRange = 8
    const baseTemp = currentTemp
    
    for (let i = hoursInPast; i >= 1; i--) {
      const hourAgo = now - (i * 60 * 60)
      const hourAgoDate = new Date(hourAgo * 1000)
      const hourOfDay = hourAgoDate.getHours()
      
      // Estimate temperature based on time of day (deterministic daily cycle)
      // Temperature typically peaks around 2-3 PM (14-15) and is lowest around 4-6 AM (4-6)
      // Create a smooth sine wave pattern
      const hourOfDayRad = ((hourOfDay - 6) / 24) * 2 * Math.PI // Shift so 6 AM is near minimum
      const dailyVariation = Math.sin(hourOfDayRad) * (tempRange / 2) // ±4°C variation
      
      // Calculate current hour's expected temp for calibration
      const currentHourRad = ((currentHour - 6) / 24) * 2 * Math.PI
      const currentExpectedVariation = Math.sin(currentHourRad) * (tempRange / 2)
      
      // Adjust past temps relative to current temp
      const pastTemp = baseTemp + (dailyVariation - currentExpectedVariation)
      
      pastHourlyData.push({
        dt: hourAgo,
        temp: Math.max(currentTemp - tempRange, Math.min(currentTemp + tempRange, pastTemp)), // Clamp within reasonable range
        feels_like: Math.max(currentFeelsLike - tempRange, Math.min(currentFeelsLike + tempRange, pastTemp)), // Same for feels like
      })
    }

    // Add current weather as transition point
    const allHourlyData = [
      ...pastHourlyData,
      {
        dt: currentDt,
        temp: currentTemp,
        feels_like: currentFeelsLike,
      },
      ...futureHourlyData,
    ]

    // Ensure we have exactly 48 hours (or close to it)
    const finalData = allHourlyData.slice(0, 48)

    if (finalData.length === 0) return null

    // Sort by timestamp (should already be sorted, but just in case)
    finalData.sort((a, b) => a.dt - b.dt)

    // Prepare labels (time) - format timestamps, show every 6 hours for readability
    const labels = finalData.map((item, index) => {
      const date = new Date(item.dt * 1000)
      const nowDate = new Date(now * 1000)
      const isPast = item.dt < now
      const isToday = date.toDateString() === nowDate.toDateString()
      
      // Show label every 6 hours, or if it's the current time point
      if (index % 6 === 0 || Math.abs(item.dt - now) < 1800) { // Every 6 hours or within 30 min of now
        if (isPast || isToday) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        } else {
          // Future: show time with day indicator if tomorrow or later
          const dayDiff = Math.floor((item.dt - now) / (60 * 60 * 24))
          if (dayDiff === 0) {
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          } else {
            return date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          }
        }
      }
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    })

    // Prepare temperature datasets
    const temperatures = finalData.map((item) => item.temp || 0)
    const feelsLikeTemps = finalData.map((item) => item.feels_like || 0)

    // Calculate statistics
    const maxTemp = Math.max(...temperatures)
    const minTemp = Math.min(...temperatures)
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length

    return {
      labels,
      temperatures,
      feelsLikeTemps,
      maxTemp,
      minTemp,
      avgTemp,
      timestamps: finalData.map((item) => item.dt),
    }
  }, [currentWeather, extendedWeather, forecastData])

  // Process 48-hour precipitation data (past 12h + future 36h)
  const precipitationData = useMemo(() => {
    if (!currentWeather) return null

    const now = Date.now() / 1000
    const past12Hours = now - (12 * 60 * 60)
    const future36Hours = now + (36 * 60 * 60)

    // Get hourly data from extended weather (future forecast)
    let hourlyFuture = []
    if (extendedWeather && extendedWeather.hourly && Array.isArray(extendedWeather.hourly)) {
      hourlyFuture = extendedWeather.hourly
    } else if (forecastData && forecastData.list && Array.isArray(forecastData.list)) {
      // Transform forecast data (3-hour intervals) to hourly-like data
      // Interpolate between forecast points to create hourly data for better visualization
      hourlyFuture = []
      for (let i = 0; i < forecastData.list.length - 1; i++) {
        const current = forecastData.list[i]
        const next = forecastData.list[i + 1]
        const timeDiff = next.dt - current.dt
        const steps = Math.ceil(timeDiff / 3600) // Steps per hour
        
        for (let step = 0; step < steps; step++) {
          const ratio = step / steps
          hourlyFuture.push({
            dt: current.dt + (step * 3600),
            pop: current.pop || 0, // Probability of precipitation (0-1)
            rain: current.rain || {},
            snow: current.snow || {},
          })
        }
      }
    }
    
    // Filter for next 36 hours (future data only)
    const futureHourlyData = hourlyFuture
      .filter((item) => item.dt > now && item.dt <= future36Hours)
      .slice(0, 36) // Take first 36 hours

    // Create past 12 hours data (estimated - no historical data available in free tier)
    // Use current weather conditions to estimate past precipitation
    const pastHourlyData = []
    const hoursInPast = 12
    
    // Check current weather for precipitation
    const currentWeatherMain = currentWeather.weather?.[0]?.main || ''
    const isCurrentlyRaining = currentWeatherMain === 'Rain' || currentWeatherMain === 'Drizzle'
    const isCurrentlySnowing = currentWeatherMain === 'Snow'
    
    const currentRain = currentWeather.rain 
      ? (typeof currentWeather.rain === 'object' ? (currentWeather.rain['1h'] || currentWeather.rain['3h'] || 0) : currentWeather.rain) 
      : 0
    const currentSnow = currentWeather.snow 
      ? (typeof currentWeather.snow === 'object' ? (currentWeather.snow['1h'] || currentWeather.snow['3h'] || 0) : currentWeather.snow) 
      : 0
    
    // Estimate past precipitation (gradually decrease from current if any)
    for (let i = hoursInPast; i >= 1; i--) {
      const hourAgo = now - (i * 60 * 60)
      const hoursAgo = i
      
      // If currently raining/snowing, estimate past 12h had some precipitation
      // Decrease probability and amount as we go further back
      let pastPop = 0
      let pastRain = 0
      let pastSnow = 0
      
      if (isCurrentlyRaining || currentRain > 0) {
        // Estimate past had some rain, decreasing with time
        const decayFactor = Math.max(0, 1 - (hoursAgo / 12))
        pastPop = (isCurrentlyRaining ? 80 : 40) * decayFactor
        pastRain = currentRain * decayFactor * 0.5 // Less intense in past
      }
      
      if (isCurrentlySnowing || currentSnow > 0) {
        const decayFactor = Math.max(0, 1 - (hoursAgo / 12))
        pastPop = Math.max(pastPop, (isCurrentlySnowing ? 80 : 40) * decayFactor)
        pastSnow = currentSnow * decayFactor * 0.5
      }
      
      pastHourlyData.push({
        dt: hourAgo,
        pop: pastPop / 100, // Convert to 0-1 range
        rain: pastRain > 0 ? { '1h': pastRain } : {},
        snow: pastSnow > 0 ? { '1h': pastSnow } : {},
      })
    }

    // Current weather data point
    const firstForecastPop = futureHourlyData[0]?.pop || 0
    const currentPop = (isCurrentlyRaining || isCurrentlySnowing) ? 100 : Math.max(10, firstForecastPop * 100)

    // Combine all data: past 12h + current + future 36h
    const allHourlyData = [
      ...pastHourlyData,
      {
        dt: currentWeather.dt || now,
        pop: currentPop / 100,
        rain: currentRain > 0 ? { '1h': currentRain } : {},
        snow: currentSnow > 0 ? { '1h': currentSnow } : {},
      },
      ...futureHourlyData,
    ]

    // Ensure exactly 48 hours total (12 past + 1 current + 35 future = 48, or adjust)
    const finalData = allHourlyData.slice(0, 48)

    if (finalData.length === 0) return null

    // Sort by timestamp
    finalData.sort((a, b) => a.dt - b.dt)

    // Prepare labels - format timestamps, show every 6 hours for readability
    const labels = finalData.map((item, index) => {
      const date = new Date(item.dt * 1000)
      const nowDate = new Date(now * 1000)
      const isPast = item.dt < now
      const isToday = date.toDateString() === nowDate.toDateString()
      
      // Show label every 6 hours, or if it's very close to current time
      if (index % 6 === 0 || Math.abs(item.dt - now) < 1800) {
        if (isPast || isToday) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        } else {
          // Future: show time with day indicator if tomorrow or later
          const dayDiff = Math.floor((item.dt - now) / (60 * 60 * 24))
          if (dayDiff === 0) {
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          } else {
            return date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          }
        }
      }
      // For intermediate points, still show time but shorter
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    })

    // Extract precipitation data
    const precipitationProb = finalData.map((item) => {
      // pop is 0-1, convert to percentage
      return (item.pop || 0) * 100
    })
    
    const rainfall = finalData.map((item) => {
      if (item.rain && typeof item.rain === 'object') {
        // Rain data: { "1h": 0.5 } or { "3h": 1.2 }
        const rain1h = item.rain['1h'] || 0
        const rain3h = item.rain['3h'] || 0
        // If 3h data, divide by 3 to get hourly average
        return rain1h || (rain3h / 3)
      }
      return 0
    })
    
    const snowfall = finalData.map((item) => {
      if (item.snow && typeof item.snow === 'object') {
        const snow1h = item.snow['1h'] || 0
        const snow3h = item.snow['3h'] || 0
        return snow1h || (snow3h / 3)
      }
      return 0
    })

    // Calculate probability statistics
    const maxProb = Math.max(...precipitationProb)
    const avgProb = precipitationProb.reduce((a, b) => a + b, 0) / precipitationProb.length
    const periodsWithPrecip = precipitationProb.filter(p => p > 50).length

    return {
      labels,
      precipitationProb,
      rainfall,
      snowfall,
      maxProb,
      avgProb,
      periodsWithPrecip,
      timestamps: finalData.map((item) => item.dt),
    }
  }, [extendedWeather, currentWeather, forecastData])

  // Temperature chart configuration
  const temperatureChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12,
          },
          padding: 12,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: '48-Hour Temperature Trend (Past 12h + Next 36h)',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#64748b',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`
          },
        },
      },
    },
    scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#94a3b8',
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: 12, // Show max 12 labels for readability
            font: {
              size: 10,
            },
          },
          title: {
            display: true,
            text: 'Time',
            color: '#94a3b8',
          },
        },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          callback: function (value) {
            return value + '°C'
          },
        },
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#94a3b8',
        },
      },
    },
  }

  // Precipitation chart configuration
  const precipitationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12,
          },
          padding: 12,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: '48-Hour Precipitation Forecast (Past 12h + Next 36h)',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#64748b',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex
            const timestamp = precipitationData?.timestamps?.[index]
            if (timestamp) {
              const date = new Date(timestamp * 1000)
              return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            }
            return context[0].label
          },
          label: function (context) {
            if (context.datasetIndex === 0) {
              const prob = context.parsed.y
              let severity = 'Low'
              if (prob >= 70) severity = 'High'
              else if (prob >= 40) severity = 'Medium'
              return `Probability: ${prob.toFixed(0)}% (${severity})`
            } else if (context.datasetIndex === 1) {
              const rain = context.parsed.y
              return rain > 0 
                ? `Rainfall: ${rain.toFixed(2)} mm` 
                : 'Rainfall: 0 mm'
            } else {
              const snow = context.parsed.y
              return snow > 0 
                ? `Snowfall: ${snow.toFixed(2)} mm` 
                : 'Snowfall: 0 mm'
            }
          },
          afterBody: function (context) {
            const index = context[0].dataIndex
            const prob = precipitationData?.precipitationProb?.[index] || 0
            const rain = precipitationData?.rainfall?.[index] || 0
            const snow = precipitationData?.snowfall?.[index] || 0
            
            if (prob > 50 && rain === 0 && snow === 0) {
              return 'High probability but no precipitation recorded yet'
            }
            return ''
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 12, // Show max 12 labels
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: 'Time (Past 12h → Future 36h)',
          color: '#94a3b8',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          stepSize: 10,
          callback: function (value) {
            return value + '%'
          },
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: 'Precipitation Probability (%)',
          color: '#94a3b8',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        max: 100,
        min: 0,
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false, // Don't draw grid for right axis
        },
        ticks: {
          color: '#60a5fa',
          callback: function (value) {
            return value.toFixed(1) + ' mm'
          },
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: 'Precipitation Amount (mm)',
          color: '#60a5fa',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        beginAtZero: true,
      },
    },
  }

  if (!temperatureData && !precipitationData) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
        <p className="text-slate-300 text-center">Loading weather graphs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Temperature Graph */}
      {temperatureData && (
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="text-red-400" size={24} />
            <h3 className="text-xl font-bold text-white">48-Hour Temperature Graph</h3>
          </div>

          {/* Temperature Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="text-red-400" size={20} />
                <span className="text-sm text-slate-400">Maximum</span>
              </div>
              <p className="text-2xl font-bold text-white">{temperatureData.maxTemp.toFixed(1)}°C</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="text-blue-400" size={20} />
                <span className="text-sm text-slate-400">Minimum</span>
              </div>
              <p className="text-2xl font-bold text-white">{temperatureData.minTemp.toFixed(1)}°C</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="text-green-400" size={20} />
                <span className="text-sm text-slate-400">Average</span>
              </div>
              <p className="text-2xl font-bold text-white">{temperatureData.avgTemp.toFixed(1)}°C</p>
            </div>
          </div>

          {/* Temperature Chart */}
          <div className="h-80">
            <Chart
              type="line"
              data={{
                labels: temperatureData.labels,
                datasets: [
                  {
                    type: 'line',
                    label: 'Temperature (°C)',
                    data: temperatureData.temperatures,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(239, 68, 68)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    borderWidth: 2,
                  },
                  {
                    type: 'line',
                    label: 'Feels Like (°C)',
                    data: temperatureData.feelsLikeTemps,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderDash: [8, 4],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    borderWidth: 2,
                  },
                ],
              }}
              options={temperatureChartOptions}
            />
          </div>
        </div>
      )}

      {/* Precipitation Graph */}
      {precipitationData && (
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CloudRain className="text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-white">Precipitation Forecast</h3>
          </div>

          {/* Precipitation Chart - Combined Line (Probability) and Bars (Rain/Snow) */}
          <div className="h-80">
            <Chart
              type="line"
              data={{
                labels: precipitationData.labels,
                datasets: [
                  {
                    type: 'line',
                    label: 'Precipitation Probability (%)',
                    data: precipitationData.precipitationProb,
                    borderColor: 'rgba(96, 165, 250, 1)',
                    backgroundColor: 'rgba(96, 165, 250, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(96, 165, 250, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y',
                    order: 3,
                    spanGaps: false,
                  },
                  {
                    type: 'bar',
                    label: 'Rainfall (mm)',
                    data: precipitationData.rainfall,
                    backgroundColor: 'rgba(34, 197, 94, 0.75)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    yAxisID: 'y1',
                    order: 2,
                    maxBarThickness: 40,
                    categoryPercentage: 0.6,
                    barPercentage: 0.8,
                  },
                  {
                    type: 'bar',
                    label: 'Snowfall (mm)',
                    data: precipitationData.snowfall,
                    backgroundColor: 'rgba(147, 197, 253, 0.85)',
                    borderColor: 'rgba(147, 197, 253, 1)',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    yAxisID: 'y1',
                    order: 1,
                    maxBarThickness: 40,
                    categoryPercentage: 0.6,
                    barPercentage: 0.8,
                  },
                ],
              }}
              options={precipitationChartOptions}
            />
          </div>

          {/* Precipitation Summary with Probability Indicators */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="text-blue-400" size={18} />
                <span className="text-sm text-slate-400">Max Probability</span>
              </div>
              <p className="text-xl font-bold text-white mb-1">
                {precipitationData.maxProb.toFixed(0)}%
              </p>
              <div className="flex items-center gap-1 text-xs">
                <div className={`h-2 w-2 rounded-full ${
                  precipitationData.maxProb >= 70 ? 'bg-red-400' :
                  precipitationData.maxProb >= 40 ? 'bg-yellow-400' : 'bg-green-400'
                }`}></div>
                <span className="text-slate-400">
                  {precipitationData.maxProb >= 70 ? 'High Risk' :
                   precipitationData.maxProb >= 40 ? 'Moderate' : 'Low Risk'}
                </span>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="text-purple-400" size={18} />
                <span className="text-sm text-slate-400">Avg Probability</span>
              </div>
              <p className="text-xl font-bold text-white mb-1">
                {precipitationData.avgProb.toFixed(1)}%
              </p>
              <div className="text-xs text-slate-400">
                {precipitationData.periodsWithPrecip} periods &gt;50%
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="text-green-400" size={18} />
                <span className="text-sm text-slate-400">Total Rainfall</span>
              </div>
              <p className="text-xl font-bold text-white">
                {precipitationData.rainfall.reduce((a, b) => a + b, 0).toFixed(2)} mm
              </p>
              {precipitationData.rainfall.reduce((a, b) => a + b, 0) > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Expected: {(precipitationData.rainfall.reduce((a, b) => a + b, 0) * 
                    (precipitationData.avgProb / 100)).toFixed(2)} mm
                </p>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Snowflake className="text-cyan-400" size={18} />
                <span className="text-sm text-slate-400">Total Snowfall</span>
              </div>
              <p className="text-xl font-bold text-white">
                {precipitationData.snowfall.reduce((a, b) => a + b, 0).toFixed(2)} mm
              </p>
              {precipitationData.snowfall.reduce((a, b) => a + b, 0) > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Expected: {(precipitationData.snowfall.reduce((a, b) => a + b, 0) * 
                    (precipitationData.avgProb / 100)).toFixed(2)} mm
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherGraph

