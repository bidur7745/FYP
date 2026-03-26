import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getMarketPriceTrends, getMarketPricesByCrop } from '../../services/api'

const RANGE_7 = '7'
const RANGE_ALL = '3650'

const CropPriceDetail = () => {
  const { cropName } = useParams()
  const navigate = useNavigate()
  const { content, locale } = useLanguage()
  const t = content?.cropPriceDetailPage || {}

  const decodedCrop = decodeURIComponent(cropName)

  const [range, setRange] = useState(RANGE_7)
  const [trends, setTrends] = useState([])
  const [allPrices, setAllPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [cropName, range])

  useEffect(() => {
    loadAllForStats()
  }, [cropName])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getMarketPriceTrends(decodedCrop, Number(range))
      if (res.success) {
        setTrends(res.trends || [])
      } else {
        setError(t.loadError || 'Failed to load price data')
      }
    } catch (err) {
      setError(err.message || t.loadError || 'Failed to load price data')
    } finally {
      setLoading(false)
    }
  }

  const loadAllForStats = async () => {
    try {
      const res = await getMarketPricesByCrop(decodedCrop, Number(RANGE_ALL))
      if (res.success) {
        setAllPrices(res.prices || [])
      }
    } catch {
      // stats are best-effort
    }
  }

  const stats = useMemo(() => {
    if (allPrices.length === 0) return null
    const avgArr = allPrices.map((p) => Number(p.averagePrice)).filter((n) => !isNaN(n))
    const minArr = allPrices.map((p) => Number(p.minPrice)).filter((n) => !isNaN(n))
    const maxArr = allPrices.map((p) => Number(p.maxPrice)).filter((n) => !isNaN(n))
    if (avgArr.length === 0) return null

    const allTimeHigh = Math.max(...maxArr)
    const allTimeLow = Math.min(...minArr)
    const avgOverall = avgArr.reduce((a, b) => a + b, 0) / avgArr.length

    const highRow = allPrices.find((p) => Number(p.maxPrice) === allTimeHigh)
    const lowRow = allPrices.find((p) => Number(p.minPrice) === allTimeLow)

    const latestAvg = avgArr[0]
    const prevAvg = avgArr.length > 1 ? avgArr[1] : null
    let changePercent = null
    if (prevAvg && prevAvg !== 0) {
      changePercent = ((latestAvg - prevAvg) / prevAvg) * 100
    }

    return {
      allTimeHigh,
      allTimeLow,
      avgOverall,
      latestAvg,
      changePercent,
      highDate: highRow?.priceDate,
      lowDate: lowRow?.priceDate,
      totalRecords: allPrices.length,
      unit: allPrices[0]?.unit || 'kg',
    }
  }, [allPrices])

  const chartData = useMemo(() => {
    if (trends.length === 0) return null
    const labels = trends.map((item) =>
      new Date(item.priceDate).toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    )
    return {
      labels,
      datasets: [
        {
          label: t.avgPrice || 'Avg Price',
          data: trends.map((item) => Number(item.averagePrice)),
          borderColor: '#10b981',
          backgroundColor: (ctx) => {
            const chart = ctx.chart
            const { ctx: c, chartArea } = chart
            if (!chartArea) return 'rgba(16,185,129,0.08)'
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, 'rgba(16,185,129,0.25)')
            gradient.addColorStop(1, 'rgba(16,185,129,0.0)')
            return gradient
          },
          fill: true,
          tension: 0.4,
          pointRadius: trends.length > 30 ? 0 : 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          borderWidth: 2.5,
        },
        {
          label: t.maxPrice || 'Max Price',
          data: trends.map((item) => Number(item.maxPrice)),
          borderColor: 'rgba(251,191,36,0.6)',
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#fbbf24',
          borderWidth: 1.5,
        },
        {
          label: t.minPrice || 'Min Price',
          data: trends.map((item) => Number(item.minPrice)),
          borderColor: 'rgba(129,140,248,0.6)',
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#818cf8',
          borderWidth: 1.5,
        },
      ],
    }
  }, [trends, locale, t])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        displayColors: true,
        boxPadding: 6,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: Rs. ${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', maxRotation: 0, font: { size: 11 } },
        grid: { display: false },
        border: { color: 'rgba(71,85,105,0.2)' },
      },
      y: {
        ticks: {
          color: '#64748b',
          callback: (v) => `Rs.${v}`,
          font: { size: 11 },
          padding: 8,
        },
        grid: { color: 'rgba(71,85,105,0.15)', drawBorder: false },
        border: { display: false },
      },
    },
  }

  const formatPrice = (p) => (p == null ? '–' : `Rs. ${Number(p).toFixed(2)}`)
  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isUp = stats?.changePercent != null && stats.changePercent >= 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/market-prices')}
              className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 hover:bg-slate-700/70 hover:border-slate-600/50 transition-all shrink-0"
              aria-label={t.back || 'Back'}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{decodedCrop}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {t.subtitle || 'Price history & insights'}
              </p>
            </div>
          </div>
          {stats && (
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{t.latestPrice || 'Latest Price'}</p>
                <p className="text-xl font-bold text-white">{formatPrice(stats.latestAvg)}</p>
              </div>
              {stats.changePercent != null && (
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold ${
                  isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {Math.abs(stats.changePercent).toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* All-Time High */}
            <div className="relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/40 backdrop-blur-sm p-5 group hover:border-amber-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="text-amber-400" size={18} />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  {t.allTimeHigh || 'All-Time High'}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{formatPrice(stats.allTimeHigh)}</p>
              <p className="text-xs text-slate-500">
                {stats.highDate && formatDate(stats.highDate)}<span className="mx-1.5 text-slate-700">·</span>/{stats.unit}
              </p>
            </div>

            {/* All-Time Low */}
            <div className="relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/40 backdrop-blur-sm p-5 group hover:border-indigo-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <TrendingDown className="text-indigo-400" size={18} />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  {t.allTimeLow || 'All-Time Low'}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{formatPrice(stats.allTimeLow)}</p>
              <p className="text-xs text-slate-500">
                {stats.lowDate && formatDate(stats.lowDate)}<span className="mx-1.5 text-slate-700">·</span>/{stats.unit}
              </p>
            </div>

            {/* Overall Average */}
            <div className="relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/40 backdrop-blur-sm p-5 group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="text-emerald-400" size={18} />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  {t.overallAvg || 'Overall Average'}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{formatPrice(stats.avgOverall)}</p>
              <p className="text-xs text-slate-500">
                {stats.totalRecords} {t.records || 'records'}<span className="mx-1.5 text-slate-700">·</span>/{stats.unit}
              </p>
            </div>
          </div>
        )}

        {/* Chart Section */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
          {/* Chart Header */}
          <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-2 flex-wrap gap-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-400" />
              {t.priceChart || 'Price Chart'}
            </h2>
            <div className="flex bg-slate-900/60 rounded-lg p-0.5 border border-slate-700/40">
              <button
                onClick={() => setRange(RANGE_7)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  range === RANGE_7
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.last7Days || 'Last 7 Days'}
              </button>
              <button
                onClick={() => setRange(RANGE_ALL)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  range === RANGE_ALL
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.allTime || 'All Time'}
              </button>
            </div>
          </div>

          {/* Chart Body */}
          <div className="px-3 md:px-5 pb-5 md:pb-6">
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-emerald-400" size={36} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-20 gap-3 text-slate-500">
                <AlertCircle size={36} />
                <p className="text-sm">{error}</p>
              </div>
            ) : trends.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-slate-500">
                <BarChart3 size={36} />
                <p className="text-sm">{t.noChartData || 'No price data available for this period.'}</p>
              </div>
            ) : (
              <div className="h-72 sm:h-80 md:h-96 mt-2">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CropPriceDetail
