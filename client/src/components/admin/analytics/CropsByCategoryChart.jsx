import React, { useMemo } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Sprout } from 'lucide-react'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

const CropsByCategoryChart = ({ crops = [] }) => {
  const chartData = useMemo(() => {
    if (!crops || crops.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // Count crops by category
    const categoryCount = {}
    crops.forEach((crop) => {
      const category = crop.cropCategory || 'Uncategorized'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })

    const labels = Object.keys(categoryCount)
    const data = Object.values(categoryCount)

    // Color palette for categories
    const colors = [
      'rgba(34, 197, 94, 0.8)',   // emerald
      'rgba(59, 130, 246, 0.8)',  // blue
      'rgba(168, 85, 247, 0.8)',  // purple
      'rgba(251, 146, 60, 0.8)',  // orange
      'rgba(236, 72, 153, 0.8)',  // pink
      'rgba(14, 165, 233, 0.8)',  // sky
      'rgba(34, 211, 238, 0.8)',  // cyan
      'rgba(251, 191, 36, 0.8)',  // amber
    ]

    const backgroundColors = labels.map((_, index) => colors[index % colors.length])
    const borderColors = backgroundColors.map((color) => color.replace('0.8', '1'))

    return {
      labels,
      datasets: [
        {
          label: 'Crops',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ],
    }
  }, [crops])

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
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sprout className="text-emerald-600" size={20} />
        <h3 className="text-lg font-semibold text-slate-800">Crops by Category</h3>
      </div>
      <div className="h-64">
        {chartData.labels.length > 0 ? (
          <Chart type="pie" data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p>No crop data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CropsByCategoryChart
