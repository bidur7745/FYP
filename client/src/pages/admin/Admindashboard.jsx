import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Sprout, 
  DollarSign,
  MessageSquare,
  MessageCircle,
  LogOut,
  UserCircle,
  Leaf,
  CreditCard,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import useTotalUnread from '../../hooks/useTotalUnread'
import DashboardOverview from '../../components/admin/DashboardOverview'
import UserManagement from '../../components/admin/UserManagement'
import CropManagement from '../../components/admin/CropManagement'
import Subsidy from '../../components/admin/Subsidy'
import SupportQueries from '../../components/admin/SupportQueries'
import AdminInfo from '../../components/admin/AdminInfo'
import DiseaseAndTreatmentManagement from '../../components/admin/DiseaseAndTreatmentManagement'
import SubscriptionManagement from '../../components/admin/SubscriptionManagement'

const Admindashboard = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const navigate = useNavigate()
  const { unreadChatCount } = useTotalUnread()

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard/admin' },
    { id: 'users', label: 'User Management', icon: Users, path: '/dashboard/admin/user-management' },
    { id: 'crops', label: 'Crops', icon: Sprout, path: '/dashboard/admin/crops' },
    { id: 'diseases', label: 'Diseases & Treatments', icon: Leaf, path: '/dashboard/admin/diseases' },
    { id: 'subsidy', label: 'Government Subsidy', icon: DollarSign, path: '/dashboard/admin/subsidy' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, path: '/dashboard/admin/subscriptions' },
    { id: 'queries', label: 'Queries', icon: MessageSquare, path: '/dashboard/admin/queries' },
  ]

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/dashboard/admin/user-management')) setActiveTab('users')
    else if (path.startsWith('/dashboard/admin/crops')) setActiveTab('crops')
    else if (path.startsWith('/dashboard/admin/diseases') || path.startsWith('/dashboard/admin/treatments')) setActiveTab('diseases')
    else if (path.startsWith('/dashboard/admin/subsidy')) setActiveTab('subsidy')
    else if (path.startsWith('/dashboard/admin/subscriptions')) setActiveTab('subscriptions')
    else if (path.startsWith('/dashboard/admin/queries')) setActiveTab('queries')
    else if (path === '/dashboard/admin' || path.startsWith('/dashboard/admin/admin-info')) {
      if (path.startsWith('/dashboard/admin/admin-info')) setActiveTab('adminInfo')
      else setActiveTab('overview')
    }
  }, [location.pathname])

  useEffect(() => {
    const handleTabSwitch = (event) => {
      const tabId = event.detail
      if (tabId) {
        setActiveTab(tabId)
        const targetTab = tabs.find((t) => t.id === tabId)
        if (targetTab?.path) {
          navigate(targetTab.path)
        }
      }
    }

    window.addEventListener('switchTab', handleTabSwitch)
    return () => {
      window.removeEventListener('switchTab', handleTabSwitch)
    }
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    const { clearAllCaches } = await import('../../utils/cache')
    clearAllCaches()
    navigate('/login')
  }

  const handleAdminInfo = () => {
    setActiveTab('adminInfo')
    navigate('/dashboard/admin/admin-info')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />
      case 'users':
        return <UserManagement />
      case 'crops':
        return <CropManagement />
      case 'diseases':
        return <DiseaseAndTreatmentManagement />
      case 'subsidy':
        return <Subsidy />
      case 'subscriptions':
        return <SubscriptionManagement />
      case 'queries':
        return <SupportQueries />
      case 'adminInfo':
        return <AdminInfo />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-slate-900/95 border-r border-emerald-500/30 shadow-2xl shadow-emerald-900/60 rounded-r-2xl transform ${
          isSidebarHovered ? 'w-64 translate-y-1' : 'w-20 translate-y-1'
        } transition-all duration-300 z-40`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <div className="flex flex-col h-full py-4">
          <nav className="flex-1 space-y-2 px-3">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.path) navigate(tab.path)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={tab.label}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className={`whitespace-nowrap transition-opacity duration-300 ${
                    isSidebarHovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="border-t border-slate-700 pt-4 px-3 space-y-2">
            <button
              onClick={handleAdminInfo}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'adminInfo'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Admin Info"
            >
              <UserCircle size={20} className="shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-300 ${
                isSidebarHovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              }`}>
                Admin Info
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-300 hover:bg-red-600 hover:text-white"
              title="Logout"
            >
              <LogOut size={20} className="shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-300 ${
                isSidebarHovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              }`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarHovered ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Floating Chat Bubble */}
      <button
        type="button"
        onClick={() => navigate('/dashboard/admin/chats')}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Open chats"
      >
        <MessageCircle size={24} />
        {unreadChatCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-red-500 text-white text-[11px] rounded-full border-2 border-white flex items-center justify-center font-bold">
            {unreadChatCount > 99 ? '99+' : unreadChatCount}
          </span>
        )}
      </button>
    </div>
  )
}

export default Admindashboard
