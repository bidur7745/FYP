import React from 'react'
import { Leaf, CloudSun, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/images/assets'
import { useLanguage } from '../context/LanguageContext'

const heroIconMap = {
    Leaf,
    CloudSun,
    ShieldCheck
}

const Home = () => {
    const { content } = useLanguage()
    const navigate = useNavigate()
    const homeContent = content?.home || {}
    const heroCopy = homeContent.hero || {}
    const heroHighlights = homeContent.heroHighlights || []
    const heroStats = homeContent.heroStats || []

    const handleGetStarted = () => {
        navigate('/login')
    }

    return (
        <>
            <section
                id="home"
                className="relative min-h-screen w-full overflow-hidden bg-black font-['Inter']"
            >
                <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={assets.backgroundVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                />
                <div className="absolute inset-0 bg-linear-to-br from-black/80 via-emerald-900/60 to-green-900/50" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:flex lg:items-center lg:min-h-screen">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
                        <div className="space-y-8 text-white">
                            <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{heroCopy?.badgeLabel}</span>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
                                    {heroCopy?.title}
                                </h1>
                                <p className="text-base sm:text-lg text-gray-100 max-w-2xl">
                                    {heroCopy?.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to={heroCopy?.ctas?.primary?.href || '/our-story'}
                                    className="px-8 py-3 rounded-full border border-white/40 text-white font-semibold hover:bg-white/10 transition"
                                >
                                    {heroCopy?.ctas?.primary?.label || 'Learn More'}
                                </Link>
                                <button
                                    onClick={handleGetStarted}
                                    className="px-8 py-3 rounded-full bg-linear-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition"
                                >
                                    {heroCopy?.ctas?.secondary?.label || 'Get Started'}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-6">
                                {heroStats.map((stat) => (
                                    <div key={stat.label} className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                                        <p className="text-3xl font-bold text-emerald-300">{stat.value}</p>
                                        <p className="text-sm text-gray-200">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 space-y-6 text-white shadow-2xl shadow-emerald-900/50">
                            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">{heroCopy?.sidebar?.eyebrow}</p>
                            <h2 className="text-2xl font-semibold">{heroCopy?.sidebar?.title}</h2>
                            <p className="text-gray-100 text-sm leading-relaxed">
                                {heroCopy?.sidebar?.description}
                            </p>

                            <div className="space-y-4">
                                {heroHighlights.map(({ title, description, icon }) => {
                                    const IconComponent = heroIconMap[icon] || Leaf
                                    return (
                                    <div
                                        key={title}
                                        className="flex items-start space-x-4 bg-white/5 border border-white/10 rounded-2xl p-4"
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/90 to-green-400/80 shadow-lg shadow-emerald-500/30">
                                            <IconComponent className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">{title}</p>
                                            <p className="text-sm text-gray-200">{description}</p>
                                        </div>
                                    </div>
                                )})}
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs text-gray-200">
                                    {heroCopy?.sidebar?.footerNote}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
       
            <RoadmapSection />
            <StrongCTASection />
        </>
    )
}

export default Home
