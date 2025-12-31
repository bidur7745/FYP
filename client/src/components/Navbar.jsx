import React, { useState, useEffect } from 'react'
import { Menu, X, ChevronDown, User, Home, Leaf, ScanLine } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { assets } from '../assets/images/assets'
import { useLanguage } from '../context/LanguageContext'
import { tw } from '../assets/styles/styles'


const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isServicesOpen, setIsServicesOpen] = useState(false)
    const { locale, changeLanguage, content } = useLanguage()
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navItems = content?.nav?.items || []
    const bottomNav = content?.nav?.bottomNav || {}
    const languageOptions = [
        { code: 'en', label: 'English', flagSrc: assets.gbFlag },
        { code: 'ne', label: 'नेपाली', flagSrc: assets.nepalFlag }
    ]

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
    const dashboardPath = `/dashboard/${role || 'user'}`

    const joinLabel = content?.nav?.joinLabel || 'Join Us'
    const dashboardLabel = content?.nav?.dashboardLabel || 'Dashboard'
    const logoutLabel = content?.nav?.logoutLabel || 'Logout'

    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userRole')
        setIsProfileOpen(false)
        navigate('/login')
    }

    const isHashLink = (href = '') => href.startsWith('#')
    const currentHash = location.hash || '#home'
    const resolveTo = (href = '') => (isHashLink(href) ? `/${href}` : href)
    const isActive = (href = '') =>
        isHashLink(href)
            ? location.pathname === '/' && currentHash === href
            : location.pathname === href

    const getLinkClasses = (href) =>
        `relative ${tw.navLink} ${isActive(href) ? tw.navActive : tw.navInactive}`

    const closeMobileMenu = () => setIsMobileMenuOpen(false)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-transparent text-white">

            {/* ---------------- NAVBAR SECTION ---------------- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <Link to="/" className="shrink-0 group flex items-center space-x-3">
                        <div className="relative h-14 w-14 rounded-full bg-white shadow-lg shadow-emerald-900/20 flex items-center justify-center border border-emerald-100">
                            <img
                                src={assets.logo}
                                alt="KrishiMitra Logo"
                                className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-linear-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-30 rounded-full blur-2xl transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center">
                        <div className="flex items-center space-x-1 rounded-full bg-black/25 backdrop-blur-sm px-2 py-1">
                            {navItems.map((item) => {
                                if (item.dropdown) {
                                    const dropdownActive = item.dropdown.some((sub) => isActive(sub.href))
                                    return (
                                        <div
                                            key={item.name}
                                            className="relative"
                                            onMouseEnter={() => setIsServicesOpen(true)}
                                            onMouseLeave={() => setIsServicesOpen(false)}
                                        >
                                            <button
                                                className={`flex items-center space-x-1 ${tw.navLink} ${isServicesOpen || dropdownActive ? tw.navActive : tw.navInactive}`}
                                            >
                                                <span>{item.name}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div
                                                className={`${tw.dropdownWrapper} overflow-hidden transition-all duration-300 ${isServicesOpen
                                                    ? 'opacity-100 visible translate-y-0'
                                                    : 'opacity-0 invisible -translate-y-2'
                                                    }`}
                                            >
                                                {item.dropdown.map((sub) => (
                                                    <Link
                                                        key={sub.name}
                                                        to={resolveTo(sub.href)}
                                                        onClick={closeMobileMenu}
                                                        className={`block px-5 py-3.5 text-emerald-900 hover:bg-linear-to-r hover:from-emerald-50 hover:to-green-100 hover:text-emerald-700 transition-all duration-300 group/item ${isActive(sub.href) ? 'bg-emerald-50' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{sub.name}</span>
                                                            <div className="w-0 group-hover/item:w-2 h-2 bg-green-500 rounded-full transition-all duration-300"></div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }

                                return (
                                    <Link
                                        key={item.name}
                                        to={resolveTo(item.href)}
                                        className={getLinkClasses(item.href)}
                                        onClick={closeMobileMenu}
                                    >
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <div className={tw.languageContainer}>
                            {languageOptions.map((option) => (
                                <button
                                    key={option.code}
                                    onClick={() => changeLanguage(option.code)}
                                    className={`px-3 py-1.5 rounded-full text-lg transition-all duration-300 flex items-center justify-center ${locale === option.code
                                            ? 'bg-white text-green-600 shadow'
                                            : 'text-gray-600 hover:text-green-600'
                                        }`}
                                >
                                    <img src={option.flagSrc} alt={option.label} className="h-4 w-6 object-contain rounded-sm shadow-sm bg-white" loading="lazy" />
                                </button>
                            ))}
                        </div>

                        {token ? (
                            <div
                                className="relative"
                                onMouseEnter={() => setIsProfileOpen(true)}
                                onMouseLeave={() => setIsProfileOpen(false)}
                            >
                                <Link
                                    to={dashboardPath}
                                    className="relative p-2 rounded-full text-white hover:text-emerald-300 transition-colors duration-300"
                                >
                                    <User className="w-6 h-6" />
                                </Link>

                                <div
                                    className={`absolute right-0 mt-2 w-40 rounded-xl border border-emerald-500/20 bg-slate-900/90 backdrop-blur-xl shadow-xl transition-all duration-200 ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                                        }`}
                                >
                                    <button
                                        onClick={() => { setIsProfileOpen(false); navigate(dashboardPath) }}
                                        className="w-full text-left px-4 py-3 text-sm text-slate-100 hover:bg-emerald-500/10 transition"
                                    >
                                        {dashboardLabel}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-sm text-slate-100 hover:bg-emerald-500/10 transition"
                                    >
                                        {logoutLabel}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link to="/signup" className={`relative overflow-hidden group/btn ${tw.joinButton}`}>
                                <span className="relative z-10">{joinLabel}</span>
                                <div className="absolute inset-0 bg-linear-to-r from-emerald-600 to-green-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            </Link>
                        )}
                    </div>

                    {/* Mobile: Language flags + Hamburger */}
                    <div className="md:hidden flex items-center space-x-2">
                        <div className="flex items-center bg-slate-900/80 backdrop-blur-sm rounded-full p-1 space-x-1 border border-emerald-500/20">
                            {languageOptions.map((option) => (
                                <button
                                    key={option.code}
                                    onClick={() => changeLanguage(option.code)}
                                    className={`p-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${locale === option.code
                                            ? 'bg-slate-900/60  shadow-lg shadow-emerald-500/20'
                                            : 'hover:bg-slate-800/60'
                                        }`}
                                >
                                    <img src={option.flagSrc} alt={option.label} className="h-4 w-5 object-contain rounded-sm" loading="lazy" />
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="p-2 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white hover:bg-slate-800/90 hover:text-emerald-300 transition-colors duration-300 border border-emerald-500/20"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ---------------- MOBILE MENU ---------------- */}
            <div className={`md:hidden overflow-hidden transition-all duration-500 ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="mx-auto rounded-3xl max-w-sm px-4 pt-4 pb-6 space-y-2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl border-t  border-emerald-500/20 text-slate-100">
                    {navItems.map((item) => (
                        <div key={item.name}>
                            {item.dropdown ? (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setIsServicesOpen((prev) => !prev)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isServicesOpen 
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                            : 'text-slate-200 hover:bg-slate-800/60 hover:text-emerald-300'}`}
                                    >
                                        <span>{item.name}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`pl-4 space-y-1 overflow-hidden transition-all duration-300 ${isServicesOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                                        }`}>
                                        {item.dropdown.map((sub) => (
                                            <Link
                                                key={sub.name}
                                                to={resolveTo(sub.href)}
                                                onClick={closeMobileMenu}
                                                className={`block px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${isActive(sub.href) 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-emerald-300'}`}
                                            >
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to={resolveTo(item.href)}
                                    onClick={closeMobileMenu}
                                    className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive(item.href) 
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                        : 'text-slate-200 hover:bg-slate-800/60 hover:text-emerald-300'}`}
                                >
                                    {item.name}
                                </Link>
                            )}
                        </div>
                    ))}

                    <div className="pt-4 space-y-3 border-t border-slate-700/50 mt-4">
                        {token ? (
                            <div className="space-y-2">
                                <Link
                                    to={dashboardPath}
                                    onClick={() => { closeMobileMenu(); setIsProfileOpen(false) }}
                                    className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 text-white hover:text-emerald-300 transition-colors duration-300"
                                >
                                    <User className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => { closeMobileMenu(); handleLogout() }}
                                    className="w-full inline-flex justify-center px-6 py-3 bg-slate-800 text-white font-semibold rounded-full border border-emerald-500/30 hover:bg-slate-700 transition"
                                >
                                    {logoutLabel}
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/signup"
                                onClick={closeMobileMenu}
                                className="w-full inline-flex justify-center px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                {joinLabel}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ---------------- BOTTOM NAV FOR MOBILE ---------------- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-emerald-500/20">
                <div className="flex justify-around items-center py-2">
                    <Link
                        to="/"
                        className={`flex flex-col items-center text-xs ${location.pathname === '/' ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-300'}`}
                    >
                        <Home size={22} />
                        <span className="mt-1">{bottomNav.home || 'Home'}</span>
                    </Link>

                    <Link
                        to="/crop-advisory"
                        className={`flex flex-col items-center text-xs ${location.pathname === '/crop-advisory' ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-300'}`}
                    >
                        <Leaf size={22} />
                        <span className="mt-1">{bottomNav.advisory || 'Advisory'}</span>
                    </Link>

                    <Link
                        to="/disease-detection"
                        className={`flex flex-col items-center text-xs ${location.pathname === '/disease-detection' ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-300'}`}
                    >
                        <ScanLine size={22} />
                        <span className="mt-1">{bottomNav.scan || 'Scan'}</span>
                    </Link>

                    <Link
                        to={token ? dashboardPath : '/login'}
                        className={`flex flex-col items-center text-xs ${location.pathname.startsWith('/dashboard') ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-300'}`}
                    >
                        <User size={22} />
                        <span className="mt-1">{bottomNav.profile || 'Profile'}</span>
                    </Link>
                </div>
            </div>

        </nav>
    )
}

export default Navbar
