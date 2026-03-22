import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Sprout, 
  DollarSign, 
  Clock, 
  TrendingUp,
  ArrowRight,
  User,
  GraduationCap,
  Crown,
  Banknote
} from 'lucide-react'
import { getAllUsers, getAllCrops, getAllGovernmentSchemes, getAdminSubscriptionStats } from '../../services/api'
import { getCache, setCache } from '../../utils/cache'
import UserGrowthChart from './analytics/UserGrowthChart'
import CropsByCategoryChart from './analytics/CropsByCategoryChart'
import SchemesByStatusChart from './analytics/SchemesByStatusChart'

const DASHBOARD_CACHE_KEY = 'admin_dashboard_stats'
const DASHBOARD_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Statistics state - simplified
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalExperts: 0,
    pendingExperts: 0,
    totalCrops: 0,
    totalSchemes: 0,
    activeSchemes: 0,
    premiumUserCount: 0,
    totalRevenueNpr: 0,
    totalRevenueUsd: 0,
  })

  // Raw data for charts
  const [usersData, setUsersData] = useState([])
  const [cropsData, setCropsData] = useState([])
  const [schemesData, setSchemesData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')

      // Check cache first
      if (!forceRefresh) {
        const cachedData = getCache(DASHBOARD_CACHE_KEY)
        if (cachedData) {
          setStats(cachedData.stats || cachedData)
          setUsersData(cachedData.usersData || [])
          setCropsData(cachedData.cropsData || [])
          setSchemesData(cachedData.schemesData || [])
          setLoading(false)
          return
        }
      }

      // Fetch all data in parallel (using cache from API)
      const [usersRes, cropsRes, schemesRes, subscriptionStatsRes] = await Promise.all([
        getAllUsers(false).catch(() => ({ success: false, data: [] })),
        getAllCrops(false).catch(() => ({ success: false, crops: [] })),
        getAllGovernmentSchemes({}, false).catch(() => ({ success: false, schemes: [] })),
        getAdminSubscriptionStats().catch(() => ({
          success: false,
          premiumUserCount: 0,
          totalRevenueNpr: 0,
          totalRevenueUsd: 0,
          premiumUserIds: [],
        }))
      ])

      // Process Users Data
      const users = usersRes.success && Array.isArray(usersRes.data) ? usersRes.data : []
      const farmers = users.filter(u => u.role === 'user')
      const experts = users.filter(u => u.role === 'expert')
      const pendingExperts = experts.filter(e => e.userDetails?.isVerifiedExpert === 'pending')

      // Process Crops Data
      const crops = cropsRes.success && Array.isArray(cropsRes.crops) ? cropsRes.crops : []

      // Process Schemes Data
      const schemes = schemesRes.success && Array.isArray(schemesRes.schemes) ? schemesRes.schemes : []
      const activeSchemes = schemes.filter(s => s.status === 'active')

      // Store raw data for charts
      setUsersData(users)
      setCropsData(crops)
      setSchemesData(schemes)

      const premiumUserCount = subscriptionStatsRes?.success ? (subscriptionStatsRes.premiumUserCount ?? 0) : 0
      const totalRevenueNpr =
        subscriptionStatsRes?.success
          ? (subscriptionStatsRes.totalRevenueNpr ?? subscriptionStatsRes.totalRevenue ?? 0)
          : 0
      const totalRevenueUsd = subscriptionStatsRes?.success ? (subscriptionStatsRes.totalRevenueUsd ?? 0) : 0

      const dashboardStats = {
        totalUsers: users.length,
        totalFarmers: farmers.length,
        totalExperts: experts.length,
        pendingExperts: pendingExperts.length,
        totalCrops: crops.length,
        totalSchemes: schemes.length,
        activeSchemes: activeSchemes.length,
        premiumUserCount,
        totalRevenueNpr,
        totalRevenueUsd,
      }

      // Cache the processed dashboard stats and raw data for charts
      const cacheData = {
        stats: dashboardStats,
        usersData: users,
        cropsData: crops,
        schemesData: schemes,
      }
      setCache(DASHBOARD_CACHE_KEY, cacheData, DASHBOARD_CACHE_TTL)
      setStats(dashboardStats)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'emerald', onClick }) => {
    const colorClasses = {
      emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      amber: 'bg-amber-100 text-amber-600 border-amber-200',
    }

    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-lg border-2 ${colorClasses[color]} p-3 shadow-sm hover:shadow-md transition-all ${
          onClick ? 'cursor-pointer hover:scale-105' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className={`p-1.5 rounded-md ${colorClasses[color]}`}>
            <Icon size={16} />
          </div>
          {onClick && <ArrowRight size={12} className="opacity-50" />}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-0.5">{value}</h3>
        <p className="text-xs font-semibold text-slate-600 mb-0.5">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 leading-tight">{subtitle}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center relative">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <button
          onClick={() => fetchDashboardData(true)}
          className="absolute right-0 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <TrendingUp size={18} />
          Refresh Data
        </button>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.totalFarmers} farmers, ${stats.totalExperts} experts`}
          color="blue"
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: 'users' })
            window.dispatchEvent(event)
          }}
        />
        <StatCard
          icon={Crown}
          title="Premium Users"
          value={stats.premiumUserCount}
          subtitle="Active subscription"
          color="amber"
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: 'subscriptions' })
            window.dispatchEvent(event)
          }}
        />
        <StatCard
          icon={Banknote}
          title="Subscription Revenue"
          value={
            <span className="flex flex-col gap-0.5 text-left leading-tight">
              <span>Rs {Number(stats.totalRevenueNpr || 0).toLocaleString('en-IN')} <span className="text-slate-500 font-normal text-sm">(Khalti)</span></span>
              <span>${Number(stats.totalRevenueUsd || 0).toFixed(2)} <span className="text-slate-500 font-normal text-sm">USD (card)</span></span>
            </span>
          }
          subtitle="Active subs only · NPR and USD shown separately"
          color="emerald"
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: 'subscriptions' })
            window.dispatchEvent(event)
          }}
        />
        <StatCard
          icon={Sprout}
          title="Total Crops"
          value={stats.totalCrops}
          subtitle="Crop varieties in system"
          color="emerald"
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: 'crops' })
            window.dispatchEvent(event)
          }}
        />
        <StatCard
          icon={DollarSign}
          title="Government Schemes"
          value={stats.totalSchemes}
          subtitle={`${stats.activeSchemes} active`}
          color="purple"
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: 'subsidy' })
            window.dispatchEvent(event)
          }}
        />
        <StatCard
          icon={Clock}
          title="Pending Verifications"
          value={stats.pendingExperts}
          subtitle="Experts awaiting approval"
          color="amber"
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: 'users' })
            window.dispatchEvent(event)
          }}
        />
      </div>

      {/* Analytics Charts */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <UserGrowthChart users={usersData} />
          <CropsByCategoryChart crops={cropsData} />
          <SchemesByStatusChart schemes={schemesData} />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => {
              const event = new CustomEvent('switchTab', { detail: 'users' })
              window.dispatchEvent(event)
            }}
            className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={18} />
              <span className="font-medium text-slate-700 text-sm">Manage Users</span>
            </div>
            <ArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" size={16} />
          </button>
          <button
            onClick={() => {
              const event = new CustomEvent('switchTab', { detail: 'crops' })
              window.dispatchEvent(event)
            }}
            className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg border-2 border-emerald-200 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Sprout className="text-emerald-600" size={18} />
              <span className="font-medium text-slate-700 text-sm">Manage Crops</span>
            </div>
            <ArrowRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" size={16} />
          </button>
          <button
            onClick={() => {
              const event = new CustomEvent('switchTab', { detail: 'subsidy' })
              window.dispatchEvent(event)
            }}
            className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 transition-all group"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="text-purple-600" size={18} />
              <span className="font-medium text-slate-700 text-sm">Manage Schemes</span>
            </div>
            <ArrowRight className="text-purple-600 group-hover:translate-x-1 transition-transform" size={16} />
          </button>
          <button
            onClick={() => {
              const event = new CustomEvent('switchTab', { detail: 'adminInfo' })
              window.dispatchEvent(event)
            }}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border-2 border-slate-200 transition-all group"
          >
            <div className="flex items-center gap-2">
              <User className="text-slate-600" size={18} />
              <span className="font-medium text-slate-700 text-sm">Admin Profile</span>
            </div>
            <ArrowRight className="text-slate-600 group-hover:translate-x-1 transition-transform" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview
