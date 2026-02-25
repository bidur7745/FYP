import React, { useState, useEffect } from 'react'
import { Search, RefreshCw, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getMarketPrices, getMarketPriceCrops, refreshMarketPrices } from '../../services/api'

const PAGE_SIZE = 30

const MarketPrices = () => {
  const { content, locale } = useLanguage()
  const t = content?.marketPricesPage || {}
  const [prices, setPrices] = useState([])
  const [crops, setCrops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchCrops()
  }, [])

  useEffect(() => {
    fetchPrices()
  }, [cropFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [cropFilter, prices.length])

  const fetchCrops = async () => {
    try {
      const res = await getMarketPriceCrops(false)
      if (res.success && res.commodities) {
        setCrops(res.commodities)
      }
    } catch (err) {
      console.error('Error fetching crops:', err)
    }
  }

  const fetchPrices = async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      setError('')
      setInfo('')
      const params = { limit: 200 }
      if (cropFilter) params.crop = cropFilter
      const res = await getMarketPrices(params, forceRefresh)
      if (res.success && res.prices) {
        setPrices(res.prices)
        // Decide if we're showing today's prices or fallback to previous date
        if (res.prices.length > 0) {
          const latest = res.prices[0]
          const latestDate = latest.priceDate ? new Date(latest.priceDate) : null
          if (latestDate) {
            const todayStr = new Date().toISOString().slice(0, 10)
            const latestStr = latestDate.toISOString().slice(0, 10)
            if (latestStr !== todayStr) {
              const niceDate = formatDate(latest.priceDate)
              setInfo(
                t.fallbackInfo ||
                  `Today's prices are not available. Showing prices as of ${niceDate}.`
              )
            }
          }
        }
      } else {
        setPrices([])
      }
    } catch (err) {
      setError(err.message || t.loadError || 'Failed to load market prices')
      setPrices([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setIsLoading(true)
      setError('')
      setInfo('')
      // Try to scrape today's prices
      const scrapeRes = await refreshMarketPrices().catch((err) => {
        console.error('Error scraping prices:', err)
        return { success: false, message: err.message }
      })
      if (!scrapeRes?.success) {
        // Non-fatal: we'll fall back to latest available data
        setInfo(
          t.refreshFallback ||
            'Could not fetch today\'s prices from the market. Showing the latest available prices instead.'
        )
      }
      await fetchPrices(true)
    } catch (err) {
      setError(err.message || t.refreshError || 'Failed to refresh market prices')
      await fetchPrices(true)
    }
  }

  const formatDate = (d) => {
    if (!d) return '–'
    return new Date(d).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPrice = (p) => {
    if (p == null || p === '') return '–'
    const n = Number(p)
    return Number.isNaN(n) ? String(p) : `Rs. ${n.toFixed(2)}`
  }

  const firstRow = prices.length > 0 ? prices[0] : null
  const displayDate = firstRow?.priceDate ? formatDate(firstRow.priceDate) : null
  const marketEn = firstRow?.marketNameEn ?? firstRow?.market_name_en
  const marketNe = firstRow?.marketNameNe ?? firstRow?.market_name_ne
  const displayMarket = firstRow
    ? (locale === 'ne' ? (marketNe || marketEn) : (marketEn || marketNe))
    : null

  const totalPages = Math.max(1, Math.ceil(prices.length / PAGE_SIZE))
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const paginatedPrices = prices.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {(displayDate || displayMarket) && (
          <div className="flex flex-wrap items-center gap-3 mb-4 text-slate-300">
            {displayDate && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-600/50">
                <Calendar size={18} className="text-emerald-400/80" />
                {t.pricesAsOf || 'Prices as of'} {displayDate}
              </span>
            )}
            {displayMarket && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-600/50">
                <MapPin size={18} className="text-emerald-400/80" />
                {displayMarket}
              </span>
            )}
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t.allCrops || 'All crops'}</option>
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              {t.refresh || 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300">
            {error}
          </div>
        )}
        {!error && info && (
          <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-200 text-sm">
            {info}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-emerald-400" size={40} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-4 py-3 text-slate-300 font-semibold">{t.crop || 'Crop'}</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">{t.min || 'Min (Rs.)'}</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">{t.max || 'Max (Rs.)'}</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">{t.avg || 'Avg (Rs.)'}</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">{t.unit || 'Unit'}</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        {t.noData || 'No price data. Data is updated daily (around 10 AM).'}
                      </td>
                    </tr>
                  ) : (
                    paginatedPrices.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-700/50 hover:bg-slate-700/20"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-100">
                            {row.cropNameNe || row.cropNameEn || '–'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-200">{formatPrice(row.minPrice)}</td>
                        <td className="px-4 py-3 text-slate-200">{formatPrice(row.maxPrice)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">
                          {formatPrice(row.averagePrice)}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{row.unit || 'kg'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {prices.length > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-slate-400 text-sm">
                  {t.showing || 'Showing'} {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, prices.length)} {t.of || 'of'} {prices.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t.prevPage || 'Previous page'}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-3 py-1 text-slate-300 text-sm font-medium">
                    {t.page || 'Page'} {currentPage} {t.of || 'of'} {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t.nextPage || 'Next page'}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MarketPrices
