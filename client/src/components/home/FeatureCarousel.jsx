import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { Leaf, CloudSun, ShieldCheck, TrendingUp, Landmark, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { assets } from '../../assets/images/assets'

const iconMap = { Leaf, CloudSun, ShieldCheck, TrendingUp, Landmark }

const ease = 'sine.inOut'
const scale = 0.6
const cardWidth = Math.round(200 * scale)
const cardHeight = Math.round(300 * scale)
const gap = Math.round(40 * scale)
const numberSize = Math.round(50 * scale)
const progressMax = Math.round(500 * scale)
const cardContentOffset = Math.round(100 * scale)

const FeatureCarousel = () => {
  const { content } = useLanguage()
  const navigate = useNavigate()
  const cardsData = content?.home?.features?.cards || []
  const ctaLabel = content?.home?.features?.ctaLabel || 'Explore'

  const sectionRef = useRef(null)
  const demoRef = useRef(null)
  const orderRef = useRef([])
  const detailsEvenRef = useRef(true)
  const loopTimeoutRef = useRef(null)
  const stepTimeoutRef = useRef(null)
  const loopRef = useRef(null)
  const stepRef = useRef(null)

  const [order, setOrder] = useState([])
  const [detailsEven, setDetailsEven] = useState(true)
  const [evenContentIndex, setEvenContentIndex] = useState(0)
  const [oddContentIndex, setOddContentIndex] = useState(0)
  const [ready, setReady] = useState(false)

  const n = cardsData.length
  const getCard = (i) => demoRef.current?.querySelector(`#feature-card-${i}`)
  const getCardContent = (i) => demoRef.current?.querySelector(`#feature-card-content-${i}`)
  const getSliderItem = (i) => document.getElementById(`feature-slide-item-${i}`)

  useEffect(() => {
    if (n === 0) return
    orderRef.current = Array.from({ length: n }, (_, j) => j)
    setOrder(orderRef.current)
    setEvenContentIndex(0)
    setOddContentIndex(0)
    detailsEvenRef.current = true
    setDetailsEven(true)
    setReady(true)
  }, [n])

  useEffect(() => {
    if (!ready || !sectionRef.current || !demoRef.current || n === 0) return

    const section = sectionRef.current
    const sectionWidth = section.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200)
    const sectionHeight = section.offsetHeight || (typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.6) : 480)
    const offsetTopLocal = sectionHeight - 215
    const stackWidth = 200 + (n - 1) * (cardWidth + gap)
    const offsetLeftLocal = sectionWidth - stackWidth - 80

    function runStepAnimation() {
      const [active, ...rest] = orderRef.current
      const detailsActive = detailsEvenRef.current ? '#feature-details-even' : '#feature-details-odd'
      const detailsInactive = detailsEvenRef.current ? '#feature-details-odd' : '#feature-details-even'
      const prv = rest[rest.length - 1]

      gsap.set(getCard(prv), { zIndex: 10 })
      gsap.set(getCard(active), { zIndex: 20 })
      gsap.to(getCard(prv), { scale: 1.5, ease })

      gsap.to(getCardContent(active), {
        y: offsetTopLocal + cardHeight - 10,
        opacity: 0,
        duration: 0.3,
        ease
      })
      gsap.to(getSliderItem(active), { x: 0, ease })
      gsap.to(getSliderItem(prv), { x: -numberSize, ease })
      gsap.to('.feature-progress-foreground', {
        width: progressMax * (1 / n) * (active + 1),
        ease
      })

      gsap.to(getCard(active), {
        x: 0,
        y: 0,
        ease,
        width: sectionWidth,
        height: sectionHeight,
        borderRadius: 0,
        onComplete: () => {
          const xNew = offsetLeftLocal + (rest.length - 1) * (cardWidth + gap)
          gsap.set(getCard(prv), {
            x: xNew,
            y: offsetTopLocal,
            width: cardWidth,
            height: cardHeight,
            zIndex: 30,
            borderRadius: 10,
            scale: 1
          })
          gsap.set(getCardContent(prv), {
            x: xNew,
            y: offsetTopLocal + cardHeight - cardContentOffset,
            opacity: 1,
            zIndex: 40
          })
          gsap.set(getSliderItem(prv), { x: rest.length * numberSize })

          gsap.set(detailsInactive, { opacity: 0 })
          gsap.set(`${detailsInactive} .feature-detail-text`, { y: 100 })
          gsap.set(`${detailsInactive} .feature-detail-title-1`, { y: 100 })
          gsap.set(`${detailsInactive} .feature-detail-title-2`, { y: 100 })
          gsap.set(`${detailsInactive} .feature-detail-desc`, { y: 50 })
          gsap.set(`${detailsInactive} .feature-detail-cta`, { y: 60 })
        }
      })

      rest.forEach((i, index) => {
        if (i !== prv) {
          const xNew = offsetLeftLocal + index * (cardWidth + gap)
          gsap.set(getCard(i), { zIndex: 30 })
          gsap.to(getCard(i), {
            x: xNew,
            y: offsetTopLocal,
            width: cardWidth,
            height: cardHeight,
            ease,
            delay: 0.1 * (index + 1)
          })
          gsap.to(getCardContent(i), {
            x: xNew,
            y: offsetTopLocal + cardHeight - cardContentOffset,
            opacity: 1,
            zIndex: 40,
            ease,
            delay: 0.1 * (index + 1)
          })
          gsap.to(getSliderItem(i), { x: (index + 1) * numberSize, ease })
        }
      })
    }

    function step() {
      const newOrder = [...orderRef.current]
      newOrder.push(newOrder.shift())
      const newActive = newOrder[0]
      const nowEven = !detailsEvenRef.current
      orderRef.current = newOrder
      detailsEvenRef.current = nowEven

      setOrder([...newOrder])
      setDetailsEven(nowEven)
      if (nowEven) setEvenContentIndex(newActive)
      else setOddContentIndex(newActive)

      const detailsActive = nowEven ? '#feature-details-even' : '#feature-details-odd'
      gsap.set(detailsActive, { zIndex: 22 })
      gsap.to(detailsActive, { opacity: 1, delay: 0.4, ease })
      gsap.to(`${detailsActive} .feature-detail-text`, { y: 0, delay: 0.1, duration: 0.7, ease })
      gsap.to(`${detailsActive} .feature-detail-title-1`, { y: 0, delay: 0.15, duration: 0.7, ease })
      gsap.to(`${detailsActive} .feature-detail-title-2`, { y: 0, delay: 0.15, duration: 0.7, ease })
      gsap.to(`${detailsActive} .feature-detail-desc`, { y: 0, delay: 0.3, duration: 0.4, ease })
      gsap.to(`${detailsActive} .feature-detail-cta`, { y: 0, delay: 0.35, duration: 0.4, ease })
      gsap.set(detailsEvenRef.current ? '#feature-details-odd' : '#feature-details-even', { zIndex: 12 })

      stepTimeoutRef.current = setTimeout(runStepAnimation, 0)
    }
    stepRef.current = step

    function loop() {
      gsap.to('.feature-indicator', {
        scaleX: 1,
        duration: 2,
        ease,
        transformOrigin: 'left'
      })
      gsap.to('.feature-indicator', {
        scaleX: 0,
        duration: 0.8,
        delay: 0.3,
        ease,
        transformOrigin: 'right',
        onComplete: () => {
          gsap.set('.feature-indicator', { scaleX: 1, transformOrigin: 'left' })
          if (stepRef.current) stepRef.current()
          loopTimeoutRef.current = setTimeout(loop, 3200)
        }
      })
    }
    loopRef.current = loop

    function init() {
      const [active, ...rest] = orderRef.current
      const detailsActive = detailsEvenRef.current ? '#feature-details-even' : '#feature-details-odd'
      const detailsInactive = detailsEvenRef.current ? '#feature-details-odd' : '#feature-details-even'

      gsap.set('#feature-pagination', {
        top: offsetTopLocal + 165,
        left: offsetLeftLocal,
        y: 100,
        opacity: 0,
        zIndex: 60
      })

      gsap.set(getCard(active), {
        x: 0,
        y: 0,
        width: sectionWidth,
        height: sectionHeight
      })
      gsap.set(getCardContent(active), { x: 0, y: 0, opacity: 0 })
      gsap.set(detailsActive, { opacity: 0, zIndex: 22, x: -200 })
      gsap.set(detailsInactive, { opacity: 0, zIndex: 12 })
      gsap.set(`${detailsInactive} .feature-detail-text`, { y: 100 })
      gsap.set(`${detailsInactive} .feature-detail-title-1`, { y: 100 })
      gsap.set(`${detailsInactive} .feature-detail-title-2`, { y: 100 })
      gsap.set(`${detailsInactive} .feature-detail-desc`, { y: 50 })
      gsap.set(`${detailsInactive} .feature-detail-cta`, { y: 60 })

      gsap.set('.feature-progress-foreground', {
        width: progressMax * (1 / n) * (active + 1)
      })
      gsap.set(getSliderItem(active), { x: 0 })

      rest.forEach((i, index) => {
        gsap.set(getCard(i), {
          x: offsetLeftLocal + 200 + index * (cardWidth + gap),
          y: offsetTopLocal,
          width: cardWidth,
          height: cardHeight,
          zIndex: 30,
          borderRadius: 10
        })
        gsap.set(getCardContent(i), {
          x: offsetLeftLocal + 200 + index * (cardWidth + gap),
          zIndex: 40,
          y: offsetTopLocal + cardHeight - cardContentOffset
        })
        gsap.set(getSliderItem(i), { x: (index + 1) * numberSize })
      })

      gsap.set('.feature-indicator', { scaleX: 0, transformOrigin: 'left' })

      const startDelay = 0.6
      gsap.to('.feature-cover', {
        x: sectionWidth + 400,
        delay: 0.5,
        ease,
        onComplete: () => {
          setTimeout(() => {
            gsap.to(getCard(active), { ease })
            rest.forEach((i, index) => {
              gsap.to(getCard(i), {
                x: offsetLeftLocal + index * (cardWidth + gap),
                zIndex: 30,
                delay: 0.05 * index + startDelay,
                ease
              })
              gsap.to(getCardContent(i), {
                x: offsetLeftLocal + index * (cardWidth + gap),
                zIndex: 40,
                y: offsetTopLocal + cardHeight - cardContentOffset,
                delay: 0.05 * index + startDelay,
                ease
              })
            })
            gsap.to('#feature-pagination', { y: 0, opacity: 1, ease, delay: startDelay })
            gsap.to(detailsActive, { opacity: 1, x: 0, ease, delay: startDelay })
            loopTimeoutRef.current = setTimeout(loop, 500)
          }, 500)
        }
      })
    }

    init()

    return () => {
      gsap.killTweensOf(['.feature-indicator', '.feature-cover', '#feature-pagination', '.feature-progress-foreground'])
      if (demoRef.current) {
        orderRef.current.forEach((i) => {
          gsap.killTweensOf([getCard(i), getCardContent(i)])
        })
        const items = demoRef.current.querySelectorAll('[id^="feature-card-"]')
        items.forEach((el) => gsap.killTweensOf(el))
      }
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
    }
  }, [ready, n])

  const handlePrev = () => {
    if (n === 0) return
    const newOrder = [...orderRef.current]
    newOrder.unshift(newOrder.pop())
    orderRef.current = newOrder
    const newActive = newOrder[0]
    const nowEven = !detailsEvenRef.current
    detailsEvenRef.current = nowEven
    setOrder([...newOrder])
    setDetailsEven(nowEven)
    if (nowEven) setEvenContentIndex(newActive)
    else setOddContentIndex(newActive)
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
    const detailsActive = nowEven ? '#feature-details-even' : '#feature-details-odd'
    gsap.set(detailsActive, { zIndex: 22 })
    gsap.to(detailsActive, { opacity: 1, duration: 0.4, ease })
    gsap.set(`${detailsActive} .feature-detail-text`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-title-1`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-title-2`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-desc`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-cta`, { y: 0 })
    const [active, ...rest] = newOrder
    const section = sectionRef.current
    const sectionWidth = section?.offsetWidth ?? window.innerWidth
    const sectionHeight = section?.offsetHeight ?? Math.round(window.innerHeight * 0.6)
    const offsetTopLocal = sectionHeight - 215
    const offsetLeftLocal = sectionWidth - (200 + (n - 1) * (cardWidth + gap)) - 80
    rest.forEach((i, index) => {
      gsap.to(getCard(i), {
        x: offsetLeftLocal + index * (cardWidth + gap),
        y: offsetTopLocal,
        width: cardWidth,
        height: cardHeight,
        zIndex: 30,
        borderRadius: 10,
        duration: 0.5,
        ease
      })
      gsap.to(getCardContent(i), {
        x: offsetLeftLocal + index * (cardWidth + gap),
        y: offsetTopLocal + cardHeight - cardContentOffset,
        opacity: 1,
        zIndex: 40,
        duration: 0.5,
        ease
      })
    })
    gsap.to(getCard(active), {
      x: 0,
      y: 0,
      width: sectionWidth,
      height: sectionHeight,
      borderRadius: 0,
      zIndex: 20,
      duration: 0.5,
      ease
    })
    gsap.to('.feature-progress-foreground', { width: progressMax * (1 / n) * (active + 1), ease })
    if (loopRef.current) loopTimeoutRef.current = setTimeout(loopRef.current, 3200)
  }

  const handleNext = () => {
    if (n === 0) return
    const newOrder = [...orderRef.current]
    newOrder.push(newOrder.shift())
    const newActive = newOrder[0]
    const nowEven = !detailsEvenRef.current
    orderRef.current = newOrder
    detailsEvenRef.current = nowEven
    setOrder([...newOrder])
    setDetailsEven(nowEven)
    if (nowEven) setEvenContentIndex(newActive)
    else setOddContentIndex(newActive)
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
    const detailsActive = nowEven ? '#feature-details-even' : '#feature-details-odd'
    gsap.set(detailsActive, { zIndex: 22 })
    gsap.to(detailsActive, { opacity: 1, duration: 0.4, ease })
    gsap.set(`${detailsActive} .feature-detail-text`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-title-1`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-title-2`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-desc`, { y: 0 })
    gsap.set(`${detailsActive} .feature-detail-cta`, { y: 0 })
    const [active, ...rest] = newOrder
    const prv = rest[rest.length - 1]
    const section = sectionRef.current
    const sectionWidth = section?.offsetWidth ?? window.innerWidth
    const sectionHeight = section?.offsetHeight ?? Math.round(window.innerHeight * 0.6)
    const offsetTopLocal = sectionHeight - 215
    const offsetLeftLocal = sectionWidth - (200 + (n - 1) * (cardWidth + gap)) - 80
    gsap.to(getCard(active), {
      x: 0,
      y: 0,
      width: sectionWidth,
      height: sectionHeight,
      borderRadius: 0,
      zIndex: 20,
      duration: 0.5,
      ease
    })
    gsap.set(getCard(prv), {
      x: offsetLeftLocal + (rest.length - 1) * (cardWidth + gap),
      y: offsetTopLocal,
      width: cardWidth,
      height: cardHeight,
      zIndex: 30,
      borderRadius: 10,
      scale: 1
    })
    rest.forEach((i, index) => {
      if (i !== prv) {
        gsap.to(getCard(i), {
          x: offsetLeftLocal + index * (cardWidth + gap),
          y: offsetTopLocal,
          width: cardWidth,
          height: cardHeight,
          zIndex: 30,
          borderRadius: 10,
          duration: 0.5,
          ease
        })
      }
      gsap.to(getCardContent(i), {
        x: offsetLeftLocal + index * (cardWidth + gap),
        y: offsetTopLocal + cardHeight - cardContentOffset,
        opacity: 1,
        zIndex: 40,
        duration: 0.5,
        ease
      })
    })
    gsap.to('.feature-progress-foreground', { width: progressMax * (1 / n) * (active + 1), ease })
    if (loopRef.current) loopTimeoutRef.current = setTimeout(loopRef.current, 3200)
  }

  const handleCta = (href) => {
    navigate(href)
  }

  if (cardsData.length === 0) return null

  const evenItem = cardsData[evenContentIndex] || cardsData[0]
  const oddItem = cardsData[oddContentIndex] || cardsData[0]

  return (
    <section
      ref={sectionRef}
      className="feature-carousel relative w-full overflow-hidden rounded-xl font-['Inter']"
      style={{
        minHeight: '60vh',
        height: '60vh',
        backgroundColor: 'rgb(15 23 42)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      }}
    >
      <div className="feature-indicator absolute left-0 right-0 top-0 z-[60] h-0.5 bg-emerald-500" style={{ transformOrigin: 'left', scaleX: 0 }} />

      <div ref={demoRef} id="feature-demo" className="absolute left-0 top-0 h-full w-full">
        {cardsData.map((item, index) => {
          const imgSrc = item.image && assets[item.image] ? assets[item.image] : null
          return (
            <div
              key={index}
              id={`feature-card-${index}`}
              className="feature-card absolute left-0 top-0 bg-cover bg-center shadow-lg"
              style={{
                backgroundImage: imgSrc ? `url(${imgSrc})` : undefined,
                background: imgSrc ? undefined : `linear-gradient(to bottom right, rgb(4 120 87), rgb(20 83 45))`
              }}
            >
              <div
                className={`absolute inset-0 ${imgSrc ? 'bg-black/40' : `bg-gradient-to-br ${item.gradient || 'from-emerald-800 to-green-900'}`}`}
                aria-hidden
              />
            </div>
          )
        })}
        {cardsData.map((item, index) => (
          <div
            key={`content-${index}`}
            id={`feature-card-content-${index}`}
            className="feature-card-content absolute left-0 top-0 z-40 px-2 text-white"
          >
            <div className="h-0.5 w-4 rounded-full bg-white/90" />
            <div className="mt-0.5 text-[10px] font-medium">{item.place}</div>
            <div className="font-semibold text-xs" style={{ fontFamily: 'Oswald, sans-serif' }}>{item.title}</div>
            <div className="font-semibold text-xs" style={{ fontFamily: 'Oswald, sans-serif' }}>{item.title2}</div>
          </div>
        ))}
      </div>

      <div
        id="feature-details-even"
        className="feature-details absolute left-2 top-12 z-[22] text-white sm:left-6 md:left-8"
      >
        <div className="place-box h-6 overflow-hidden">
          <div className="feature-detail-text pt-2 text-sm" style={{ transform: 'translateY(0)' }}>{evenItem.place}</div>
          <div className="mt-0.5 h-0.5 w-4 rounded-full bg-white" aria-hidden />
        </div>
        <div className="title-box-1 mt-0.5 h-12 overflow-hidden">
          <div className="feature-detail-title-1 text-2xl font-semibold sm:text-3xl md:text-4xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{evenItem.title}</div>
        </div>
        <div className="title-box-2 mt-0.5 h-12 overflow-hidden">
          <div className="feature-detail-title-2 text-2xl font-semibold sm:text-3xl md:text-4xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{evenItem.title2}</div>
        </div>
        <p className="feature-detail-desc mt-2 max-w-xs text-[10px] leading-tight text-white/90 md:max-w-sm">{evenItem.description}</p>
        <div className="feature-detail-cta mt-3 flex items-center gap-2">
          <button
            type="button"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400"
            aria-label="Bookmark"
          >
            <Bookmark className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => handleCta(evenItem.href)}
            className="rounded-full border border-white/80 bg-transparent px-3 py-1 text-[10px] font-medium uppercase text-white transition hover:bg-white/10"
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      <div
        id="feature-details-odd"
        className="feature-details absolute left-2 top-12 z-[12] text-white sm:left-6 md:left-8"
      >
        <div className="place-box h-6 overflow-hidden">
          <div className="feature-detail-text pt-2 text-sm" style={{ transform: 'translateY(0)' }}>{oddItem.place}</div>
          <div className="mt-0.5 h-0.5 w-4 rounded-full bg-white" aria-hidden />
        </div>
        <div className="title-box-1 mt-0.5 h-12 overflow-hidden">
          <div className="feature-detail-title-1 text-2xl font-semibold sm:text-3xl md:text-4xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{oddItem.title}</div>
        </div>
        <div className="title-box-2 mt-0.5 h-12 overflow-hidden">
          <div className="feature-detail-title-2 text-2xl font-semibold sm:text-3xl md:text-4xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{oddItem.title2}</div>
        </div>
        <p className="feature-detail-desc mt-2 max-w-xs text-[10px] leading-tight text-white/90 md:max-w-sm">{oddItem.description}</p>
        <div className="feature-detail-cta mt-3 flex items-center gap-2">
          <button
            type="button"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400"
            aria-label="Bookmark"
          >
            <Bookmark className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => handleCta(oddItem.href)}
            className="rounded-full border border-white/80 bg-transparent px-3 py-1 text-[10px] font-medium uppercase text-white transition hover:bg-white/10"
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      <div
        id="feature-pagination"
        className="feature-pagination absolute left-0 top-0 z-[60] flex items-center"
      >
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 text-white/80 transition hover:border-white/50 hover:text-white"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 text-white/80 transition hover:border-white/50 hover:text-white"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="feature-progress-sub ml-3 flex h-8 w-full max-w-[250px] items-center">
          <div className="feature-progress-background h-0.5 w-full max-w-[250px] bg-white/20">
            <div className="feature-progress-foreground h-0.5 bg-emerald-500" style={{ width: progressMax * (1 / n) * ((order[0] ?? 0) + 1) }} />
          </div>
        </div>
        <div className="slide-numbers ml-2 h-8 w-8 overflow-hidden" style={{ position: 'relative' }}>
          {cardsData.map((_, index) => (
            <div
              key={index}
              id={`feature-slide-item-${index}`}
              className="item absolute left-0 top-0 flex h-8 w-8 items-center justify-center text-sm font-bold text-white"
              style={{ transform: `translateX(${(index + 1) * numberSize}px)` }}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="feature-cover absolute left-0 top-0 z-[100] h-full w-full rounded-xl bg-slate-100" style={{ backgroundColor: 'rgb(241 245 249)' }} />
    </section>
  )
}

export default FeatureCarousel
