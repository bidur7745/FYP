import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, Menu, X, MessageCircle, LogOut, Wallet } from 'lucide-react'
import { assets } from '../../assets/images/assets'
import useTotalUnread from '../../hooks/useTotalUnread'

const ExpertNavbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { unreadChatCount } = useTotalUnread()

  const handleLogout = async () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    try {
      const { clearAllCaches } = await import('../../utils/cache')
      clearAllCaches()
    } catch (_) {}
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  const closeMobile = () => setIsMobileMenuOpen(false)

  const basePath = '/dashboard/expert'
  const defaultPath = `${basePath}/profile`
  const navItems = [
    { to: `${basePath}/chats`, label: 'Chats', icon: MessageCircle },
    { to: `${basePath}/profile`, label: 'Profile', icon: User },
    { to: `${basePath}/earnings`, label: 'My Earning', icon: Wallet },
  ]

  const isActive = (path) => {
    return location.pathname.startsWith(path)
  }

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
        : 'text-slate-200 hover:bg-slate-700/60 hover:text-white'
    }`

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Expert label */}
            <Link
              to={basePath}
              className="shrink-0 flex items-center gap-3 group"
              onClick={closeMobile}
            >
              <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center border border-emerald-200 shadow-md group-hover:scale-105 transition-transform">
                <img src={assets.logo} alt="KrishiMitra" className="h-9 w-9 object-contain" />
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-white">KrishiMitra</span>
                <span className="block text-xs text-emerald-400 font-medium">Expert Portal</span>
              </div>
            </Link>

            {/* Desktop nav + Logout */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={linkClass(to)}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                  {label === 'Chats' && unreadChatCount > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 bg-emerald-500 text-white text-[11px] rounded-full flex items-center justify-center font-bold">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-red-300 hover:bg-slate-700/60 hover:text-red-200 transition-all duration-200 border border-transparent hover:border-red-500/30"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Logout
              </button>
            </div>

            {/* Mobile: hamburger + Logout */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen((p) => !p)}
                className="p-2 rounded-lg text-slate-200 hover:bg-slate-700/60 hover:text-white"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-300 hover:bg-slate-700/60"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 pt-2 space-y-1 border-t border-slate-700/50 bg-slate-900/98">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMobile}
                className={linkClass(to)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
                {label === 'Chats' && unreadChatCount > 0 && (
                  <span className="ml-auto h-5 min-w-[20px] px-1.5 bg-emerald-500 text-white text-[11px] rounded-full flex items-center justify-center font-bold">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={() => { closeMobile(); handleLogout() }}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl font-medium text-red-300 hover:bg-slate-700/60"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav – Chats, Profile, My Earning */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 safe-area-pb">
        <div className="flex justify-around items-center py-2">
          <Link
            to={`${basePath}/chats`}
            onClick={closeMobile}
            className={`relative flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl min-w-[72px] ${
              location.pathname.startsWith(`${basePath}/chats`) ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Chats</span>
            {unreadChatCount > 0 && (
              <span className="absolute top-0 right-2 h-4 min-w-[16px] px-1 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </Link>
          <Link
            to={`${basePath}/profile`}
            onClick={closeMobile}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl min-w-[72px] ${
              location.pathname.startsWith(`${basePath}/profile`) ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
          <Link
            to={`${basePath}/earnings`}
            onClick={closeMobile}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl min-w-[72px] ${
              location.pathname.startsWith(`${basePath}/earnings`) ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-6 h-6" />
            <span className="text-xs font-medium">My Earning</span>
          </Link>
        </div>
      </div>
    </>
  )
}

export default ExpertNavbar
