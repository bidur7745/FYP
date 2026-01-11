import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Sprout, 
  GraduationCap, 
  BarChart3,
  DollarSign,
  LogOut,
  UserCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardOverview from '../../components/admin/DashboardOverview'
import UserManagement from '../../components/admin/UserManagement'
import CropManagement from '../../components/admin/CropManagement'
import ExpertVerification from '../../components/admin/ExpertVerification'
import Analytics from '../../components/admin/Analytics'
import Subsidy from '../../components/admin/Subsidy'

const Admindashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const navigate = useNavigate()

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'crops', label: 'Crops', icon: Sprout },
    { id: 'experts', label: 'Experts', icon: GraduationCap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'subsidy', label: 'Government Subsidy', icon: DollarSign },
  ]

  const handleLogout = async () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    // Clear all cached data
    const { clearAllCaches } = await import('../../utils/cache')
    clearAllCaches()
    navigate('/login')
  }

  const handleAdminInfo = () => {
    // TODO: Implement admin info update functionality
    console.log('Admin info clicked')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />
      case 'users':
        return <UserManagement />
      case 'crops':
        return <CropManagement />
      case 'experts':
        return <ExpertVerification />
      case 'analytics':
        return <Analytics />
      case 'subsidy':
        return <Subsidy />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 flex">
      {/* Sidebar Navigation - Fixed to left */}
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={tab.label}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className={`whitespace-nowrap transition-opacity duration-300 ${
                    isSidebarHovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Bottom Section - Admin Info and Logout */}
          <div className="border-t border-slate-700 pt-4 px-3 space-y-2">
            <button
              onClick={handleAdminInfo}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-300 hover:bg-slate-800 hover:text-white"
              title="Admin Info"
            >
              <UserCircle size={20} className="flex-shrink-0" />
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
              <LogOut size={20} className="flex-shrink-0" />
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
    </div>
  )
}

export default Admindashboard
