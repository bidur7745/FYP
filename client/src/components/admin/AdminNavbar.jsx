import React, { useState } from 'react'
import { User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../../assets/images/assets'

const AdminNavbar = () => {
    const navigate = useNavigate()
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const handleLogout = async () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userRole')
        // Clear all cached data
        const { clearAllCaches } = await import('../../utils/cache')
        clearAllCaches()
        setIsProfileOpen(false)
        navigate('/login')
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-slate-900/95 backdrop-blur-sm text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="shrink-0 group flex items-center space-x-3">
                        <div className="relative h-14 w-14 rounded-full bg-white shadow-lg shadow-emerald-900/20 flex items-center justify-center border border-emerald-100">
                            <img
                                src={assets.logo}
                                alt="KrishiMitra Logo"
                                className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-linear-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-30 rounded-full blur-2xl transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Admin Panel Title */}
                    <div className="flex-1 flex items-center justify-center">
                        <h1 className="text-xl md:text-2xl font-semibold text-white">
                            KrishiMitra Admin Panel
                        </h1>
                    </div>

                    {/* Profile Menu */}
                    <div className="flex items-center">
                        <div
                            className="relative"
                            onMouseEnter={() => setIsProfileOpen(true)}
                            onMouseLeave={() => setIsProfileOpen(false)}
                        >
                            <button className="relative p-2 rounded-full text-white hover:bg-red-500 transition-colors duration-300">
                                <User className="w-6 h-6" />
                            </button>

                            <div
                                className={`absolute right-0 mt-2 w-40 rounded-xl border border-emerald-500/20 bg-slate-900/90 backdrop-blur-xl shadow-xl transition-all duration-200 ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                                    }`}
                            >
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-100 hover:bg-red-500 rounded-full transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default AdminNavbar
