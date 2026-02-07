import React, { useMemo } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { TrendingUp } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const UserGrowthChart = ({ users = [] }) => {
  const chartData = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // Group users by month based on createdAt
    const monthlyData = {}
    
    users.forEach((user) => {
      if (user.createdAt || user.created_at) {
        const date = new Date(user.createdAt || user.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            label: monthLabel,
            count: 0,
          }
        }
        monthlyData[monthKey].count++
      }
    })

    // Sort by month key and create cumulative data
    const sortedMonths = Object.keys(monthlyData).sort()
    const labels = sortedMonths.map((key) => monthlyData[key].label)
    const counts = sortedMonths.map((key) => monthlyData[key].count)
    
    // Calculate cumulative totals
    const cumulative = []
    let total = 0
    counts.forEach((count) => {
      total += count
      cumulative.push(total)
    })

    // If no data, create default labels for last 6 months
    if (labels.length === 0) {
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
        cumulative.push(0)
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Total Users',
          data: cumulative,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
      ],
    }
  }, [users])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#475569',
          font: {
            size: 12,
          },
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
            return `Total Users: ${context.parsed.y}`
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
          color: '#64748b',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#64748b',
          stepSize: 1,
          font: {
            size: 11,
          },
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold text-slate-800">User Growth Over Time</h3>
      </div>
      <div className="h-64">
        {chartData.labels.length > 0 ? (
          <Chart type="line" data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p>No user data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserGrowthChart
