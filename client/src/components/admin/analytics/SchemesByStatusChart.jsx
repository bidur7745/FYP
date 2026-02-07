import React, { useMemo } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { DollarSign } from 'lucide-react'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

const SchemesByStatusChart = ({ schemes = [] }) => {
  const chartData = useMemo(() => {
    if (!schemes || schemes.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // Count schemes by status
    const statusCount = {
      active: 0,
      expired: 0,
      upcoming: 0,
    }

    schemes.forEach((scheme) => {
      const status = scheme.status || 'active'
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status]++
      } else {
        statusCount.active++ // Default to active if unknown status
      }
    })

    const labels = Object.keys(statusCount).map(
      (status) => status.charAt(0).toUpperCase() + status.slice(1)
    )
    const data = Object.values(statusCount)

    // Colors for each status
    const colors = {
      active: 'rgba(34, 197, 94, 0.8)',    // green
      expired: 'rgba(239, 68, 68, 0.8)',  // red
      upcoming: 'rgba(251, 146, 60, 0.8)', // orange
    }

    const backgroundColors = [
      colors.active,
      colors.expired,
      colors.upcoming,
    ]

    const borderColors = backgroundColors.map((color) => color.replace('0.8', '1'))

    return {
      labels,
      datasets: [
        {
          label: 'Schemes',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ],
    }
  }, [schemes])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#475569',
          font: {
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#64748b',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="text-purple-600" size={20} />
        <h3 className="text-lg font-semibold text-slate-800">Schemes by Status</h3>
      </div>
      <div className="h-64">
        {chartData.labels.length > 0 ? (
          <Chart type="pie" data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p>No scheme data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SchemesByStatusChart
