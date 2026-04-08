'use client'
import { useState, useEffect } from 'react'
import ListingCard from './ListingCard'
import MapView from './MapView'

const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat']

function isOnToday(l) {
  if (!l.days_of_week || l.days_of_week.length === 0) return true
  if (l.is_daily) return true
  const today = DAY_NAMES[new Date().getDay()]
  return (l.days_of_week || []).includes(today)
}
function isOnTomorrow(l) {
  if (l.is_daily) return true
  const tomorrow = DAY_NAMES[(new Date().getDay() + 1) % 7]
  return (l.days_of_week || []).includes(tomorrow)
}
function isOnWeekend(l) {
  if (!l.days_of_week || l.days_of_week.length === 0) return true
  if (l.is_daily) return true
  return (l.days_of_week || []).some(d => ['sat','sun'].includes(d))
}
function isOnThisWeek(l) {
  if (!l.days_of_week || l.days_of_week.length === 0) return true
  if (l.is_daily) return true
  return (l.days_of_week || []).length > 0
}

function getHeadline() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'What shall we do this morning?'
  if (h >= 12 && h < 17) return 'What shall we do this afternoon?'
  if (h >= 17 && h < 21) return 'What shall we do this evening?'
  return 'Planning ahead with the kids?'
}

function getGreeting(weather) {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return weather?.isRainy ? '🌧️ Rainy morning — easy indoor ideas below' : '🌤️ Good morning, Ealing parents'
  if (h >= 12 && h < 18) return weather?.isRainy ? '🌧️ Rainy afternoon — indoor ideas below' : '👋 Afternoon, Ealing parents'
  return '🌙 Planning ahead with the kids?'
}

export default function HomeClient({ listings, recentListings = [], localFav = null, viewCounts = {} }) {
  const [savedIds, setSavedIds] = useState(new Set())
  const [activeNav, setActiveNav] = useState('home')
  const [showCalendar, setShowCalendar] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [passport, setPassport] = useState([])
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [calendarPlan, setCalendarPlan] = useState({})
  const [dayFilter, setDayFilter] = useState('week')
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [freeOnly, setFreeOnly] = useState(false)
  const [weatherMode, setWeatherMode] = useState('all')
  const [worthJourney, setWorthJourney] = useState(false)
  const [nurseryFilter, setNurseryFilter] = useState(false)
  const [sortBy, setSortBy] = useState('recommended')
  const [sessionSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff))
  const [showMap, setShowMap] = useState(false)

  useEffect(() => { setCurrentPage(1) }, [dayFilter, search, ageFilter, freeOnly, weatherMode, worthJourney, nurseryFilter])
  useEffect(() => {
    const saved = sessionStorage.getItem('ll_page')
    if (saved) { setCurrentPage(parseInt(saved)); sessionStorage.removeItem('ll_page') }
  }, [])
  const [userLocation, setUserLocation] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [weather, setWeather] = useState(null)
  const [exploringCount, setExploringCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 6
  useEffect(() => {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
    const jitter = (dayOfYear % 13) - 6
    const curve = Math.round(7 + 23 * Math.pow(hour / 23, 1.4))
    const count = Math.max(5, Math.min(36, curve + jitter))
    setExploringCount(count)
  }, [])

  const refreshSavedIds = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('ll_favs') || '[]')
      const cal = JSON.parse(localStorage.getItem('ll_calendar_v2') || '{}')
      setSavedIds(new Set([...favs, ...Object.values(cal).flat()]))
    } catch(e) {}
  }

  useEffect(() => {
    refreshSavedIds()
    window.addEventListener('focus', refreshSavedIds)
    return () => window.removeEventListener('focus', refreshSavedIds)
  }, [])

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('ll_favs') || '[]')
      const cal = JSON.parse(localStorage.getItem('ll_calendar_v2') || '[]')
      setSavedIds(new Set([...favs, ...Object.values(JSON.parse(localStorage.getItem('ll_calendar_v2') || '{}')).flat()]))
      const planData = localStorage.getItem('ll_calendar_v2')
      if (planData) {
        const parsed = JSON.parse(planData)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) setCalendarPlan(parsed)
      }
      const rv = localStorage.getItem('ll_recentlyViewed')
      if (rv) setRecentlyViewed(JSON.parse(rv))
      const pp = localStorage.getItem('ll_passport')
      if (pp) setPassport(JSON.parse(pp))
    } catch(e) {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('ll_calendar_v2', JSON.stringify(calendarPlan)) } catch(e) {}
  }, [calendarPlan])

  const calendarTotal = Object.values(calendarPlan).reduce((sum, arr) => sum + arr.length, 0)
  const openCalendar = () => { const now = new Date(); setCalMonth(now.getMonth()); setCalYear(now.getFullYear()); setSelectedDate(now.toISOString().split('T')[0]); setShowCalendar(true) }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('plans=1')) {
      openCalendar()
      window.history.replaceState({}, '', '/')
    }
  }, [])
  const closeCalendar = () => setShowCalendar(false)
  const removeFromCalendar = (id, date) => { setCalendarPlan(prev => { const arr = (prev[date] || []).filter(x => x !== id); const next = {...prev}; if (arr.length === 0) delete next[date]; else next[date] = arr; return next }) }

  useEffect(() => {
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsIOS(isIOSDevice)
    if (!isInStandalone) {
      if (isIOSDevice) {
        setShowInstall(true)
      } else {
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault()
          setDeferredPrompt(e)
          setShowInstall(true)
        })
      }
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') setShowInstall(false)
      setDeferredPrompt(null)
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5139&longitude=-0.3048&current_weather=true&timezone=Europe/London')
      .then(r => r.json())
      .then(d => {
        const temp = Math.round(d.current_weather?.temperature || 0)
        const code = d.current_weather?.weathercode || 0
        const isRainy = code >= 51
        setWeather({ temp, isRainy, desc: isRainy ? 'and rainy' : 'and sunny' })
      }).catch(() => {})
  }, [])

  const filtered = listings.filter(l => {
    if (search) {
      const q = search.toLowerCase().trim()
      const haystack = [l.name, l.type, l.category, l.description, l.area].filter(Boolean).join(' ').toLowerCase()
      // exact match first
      if (haystack.includes(q)) return true
      // fuzzy: all words in query must appear somewhere
      const words = q.split(/\s+/).filter(w => w.length > 2)
      if (words.length > 0 && words.every(w => haystack.includes(w))) return true
      // typo tolerance: check if any word in query is within 2 chars of a word in haystack
      const haystackWords = haystack.split(/\s+/)
      const fuzzyMatch = words.some(qw => haystackWords.some(hw => {
        if (Math.abs(qw.length - hw.length) > 2) return false
        let diff = 0
        for (let i = 0; i < Math.min(qw.length, hw.length); i++) if (qw[i] !== hw[i]) diff++
        return diff <= 2 && hw.startsWith(qw.slice(0, 3))
      }))
      return fuzzyMatch
    }
    if (freeOnly && !l.free && !(l.price||'').toLowerCase().includes('free')) return false
    if (weatherMode === 'rainy' && !l.indoor) return false
    if (weatherMode === 'sunny' && l.indoor) return false
    if (worthJourney && !l.worth_journey) return false
    if (nurseryFilter && (l.category||'').toLowerCase() !== 'nursery') return false
    if (ageFilter === 'baby' && (l.age_min||0) > 1) return false
    if (ageFilter === 'toddler' && ((l.age_min||0) > 3 || (l.age_max||99) < 1)) return false
    if (ageFilter === 'preschool' && ((l.age_min||0) > 5 || (l.age_max||99) < 3)) return false
    if (ageFilter === 'kids' && (l.age_min||0) < 5) return false
    if (dayFilter === 'today' && !isOnToday(l)) return false
    if (dayFilter === 'tomorrow' && !isOnTomorrow(l)) return false
    if (dayFilter === 'weekend' && !isOnWeekend(l)) return false
    if (dayFilter === 'week' && !isOnThisWeek(l)) return false
    return true
  })

  const todayCount = listings.filter(isOnToday).length
  const tomorrowCount = listings.filter(isOnTomorrow).length
  const weekendCount = listings.filter(isOnWeekend).length
  const weekCount = listings.filter(isOnThisWeek).length
  const nurseryCount = listings.filter(l => (l.category||'').toLowerCase() === 'nursery').length
  const outdoorCount = listings.filter(l => !l.indoor && l.indoor !== null).length
  const indoorCount = listings.filter(l => l.indoor).length
  const freeCount = listings.filter(l => l.free || (l.price||'').toLowerCase().includes('free')).length
  const adventureCount = listings.filter(l => l.worth_journey).length

  // Sort filtered results
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (sortBy === 'nearest') {
      if (!userLocation) return 0
      const distA = (a.lat && a.lng) ? Math.hypot(a.lat - userLocation.lat, a.lng - userLocation.lng) : 999
      const distB = (b.lat && b.lng) ? Math.hypot(b.lat - userLocation.lat, b.lng - userLocation.lng) : 999
      return distA - distB
    }
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    }
    if (sortBy === 'price') {
      const priceA = (a.free || (a.price||'').toLowerCase().includes('free')) ? 0 : parseFloat((a.price||'').replace(/[^0-9.]/g,'')) || 999
      const priceB = (b.free || (b.price||'').toLowerCase().includes('free')) ? 0 : parseFloat((b.price||'').replace(/[^0-9.]/g,'')) || 999
      return priceA - priceB
    }
    // recommended — verified with images first, per-session shuffle within tiers
    const seed = (n) => ((n * 1103515245 + sessionSeed * 12345) & 0x7fffffff)
    const tierA = (l) => l.verified && (l.images?.length || 0) >= 2
    const tierB = (l) => (l.verified || (l.images?.length || 0) >= 1)
    const ta = tierA(a) ? 0 : tierB(a) ? 1 : 2
    const tb = tierA(b) ? 0 : tierB(b) ? 1 : 2
    if (ta !== tb) return ta - tb
    return seed(a.id || 0) - seed(b.id || 0)
  })

  const hasActiveFilters = freeOnly || weatherMode !== 'all' || worthJourney || nurseryFilter || ageFilter !== 'all' || search

  const clearAll = () => {
    setCurrentPage(1)
    setFreeOnly(false); setWeatherMode('all'); setWorthJourney(false)
    setNurseryFilter(false); setAgeFilter('all'); setSearch(''); setDayFilter('week')
  }

  const chipStyle = (active, activeColor = '#D4732A') => ({
    flexShrink: 0, fontSize: 13, fontWeight: active ? 700 : 500,
    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
    background: active ? activeColor : 'white',
    color: active ? 'white' : '#6B7280',
    border: active ? 'none' : '1px solid #E5E7EB',
  })

  const dayChipStyle = (active) => ({
    flexShrink: 0, fontSize: 13, fontWeight: active ? 700 : 500,
    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
    background: active ? '#D4732A' : 'white',
    color: active ? 'white' : '#6B7280',
    border: active ? 'none' : '1px solid #E5E7EB',
  })

  if (showCalendar) {
    const today = new Date()
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const dayLabels = ["Mo","Tu","We","Th","Fr","Sa","Su"]
    const todayKey = today.toISOString().split('T')[0]
    const firstDay = new Date(calYear, calMonth, 1)
    const lastDay = new Date(calYear, calMonth + 1, 0)
    let startDow = firstDay.getDay()
    startDow = startDow === 0 ? 6 : startDow - 1
    const daysInMonth = lastDay.getDate()
    const cells = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }
    const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }
    const selectedActivities = (calendarPlan[selectedDate] || []).map(id => listings.find(l => l.id === id)).filter(Boolean)
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', background: '#F9FAFB', minHeight: '100vh', fontFamily: "Inter, -apple-system, sans-serif", color: '#1F2937', paddingBottom: 140 }}>
        <div style={{ padding: '12px 20px 10px', position: 'sticky', top: 0, zIndex: 100, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 1000, color: '#5B2D6E' }}>LITTLE<span style={{ color: '#D4732A' }}>locals</span></div>
          <div onClick={closeCalendar} style={{ padding: '6px 14px', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#1F2937' }}>← Back</div>
        </div>
        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ fontSize: 22, fontWeight: 1000, color: '#1F2937', marginBottom: 4 }}>📅 My Plans</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>Tap a date to view or add activities</div>

          {(() => {
            const favIds = (() => { try { return JSON.parse(localStorage.getItem('ll_favs') || '[]') } catch(e) { return [] } })()
            const savedListings = favIds.map(id => listings.find(l => l.id === id)).filter(Boolean)
            if (savedListings.length === 0) return null
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#5B2D6E', marginBottom: 8 }}>💜 Saved activities <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF' }}>({savedListings.length})</span></div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                  {savedListings.map(l => (
                    <a key={l.id} href={'/listing/' + l.slug} style={{ flexShrink: 0, width: 110, textDecoration: 'none' }}>
                      <div style={{ height: 80, borderRadius: 12, overflow: 'hidden', marginBottom: 5, background: '#F3F4F6', border: '2px solid #5B2D6E' }}>
                        {l.image ? <img src={l.image} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{l.emoji || '🎯'}</div>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{l.type}</div>
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div onClick={prevMonth} style={{ padding: '6px 14px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>‹</div>
            <div style={{ fontSize: 17, fontWeight: 1000, color: '#1F2937' }}>{monthNames[calMonth]} {calYear}</div>
            <div onClick={nextMonth} style={{ padding: '6px 14px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>›</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {dayLabels.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#6B7280', padding: 4 }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 12 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={'e'+i} />
              const dateKey = calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
              const hasPlans = (calendarPlan[dateKey] || []).length > 0
              const isToday = dateKey === todayKey
              const isSelected = dateKey === selectedDate
              const isPast = dateKey < todayKey
              return (
                <div key={dateKey} onClick={() => setSelectedDate(dateKey)} style={{ textAlign: 'center', padding: '8px 0', borderRadius: 10, cursor: 'pointer', position: 'relative', background: isSelected ? 'linear-gradient(135deg, #D4732A, #FB923C)' : isToday ? '#FFF0EB' : 'white', color: isSelected ? 'white' : isPast ? '#9CA3AF' : '#1F2937', border: isToday && !isSelected ? '2px solid #D4732A' : '1px solid #E5E7EB', fontWeight: isToday || isSelected ? 800 : 600, fontSize: 15 }}>
                  {d}
                  {hasPlans && <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'white' : '#D4732A' }} />}
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontSize: 16, fontWeight: 1000, color: '#1F2937', marginBottom: 8 }}>
            {selectedDate === todayKey ? 'Today' : new Date(selectedDate+'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            <span style={{ fontSize: 14, fontWeight: 700, color: '#6B7280', marginLeft: 8 }}>{selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'}</span>
          </div>
          {selectedActivities.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>📅</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>Nothing planned yet</div>
              <div onClick={closeCalendar} style={{ display: 'inline-block', marginTop: 8, padding: '6px 16px', background: 'linear-gradient(135deg, #D4732A, #FB923C)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Browse Activities</div>
            </div>
          ) : selectedActivities.map(item => (
            <div key={item.id} style={{ padding: '10px 14px', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#1F2937' }}>{item.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{item.location}</div>
              </div>
              <div onClick={() => removeFromCalendar(item.id, selectedDate)} style={{ width: 26, height: 26, borderRadius: '50%', background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>✕</div>
            </div>
          ))}
        </div>
        {recentlyViewed.length > 0 && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 18, fontWeight: 1000, color: '#1F2937', marginBottom: 10 }}>👁 Recently viewed</div>
            {recentlyViewed.slice(0, 5).map(r => {
              const item = listings.find(l => l.id === r.id)
              if (!item) return null
              return (
                <a key={r.id} href={'/listing/' + item.slug} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', marginBottom: 6, textDecoration: 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#F3F4F6', flexShrink: 0 }}>
                    {r.image ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.emoji || '🎯'}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1F2937' }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>{item.type} · {item.location}</div>
                  </div>
                  <span style={{ fontSize: 18, color: '#9CA3AF' }}>→</span>
                </a>
              )
            })}
          </div>
        )}

        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 1000, color: '#1F2937' }}>🏆 Activity Passport</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#166534' }}>{passport.length} visited</div>
          </div>
          {passport.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🏆</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#1F2937', marginBottom: 4 }}>Start collecting!</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>Tap "Been here?" on activities your family has tried</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {passport.map(id => {
                const item = listings.find(l => l.id === id)
                if (!item) return null
                return (
                  <a key={id} href={'/listing/' + item.slug} style={{ textAlign: 'center', padding: '8px 4px', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', textDecoration: 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 800 }}>✓ Visited</div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div onClick={closeCalendar} style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg, #D4732A, #FB923C)', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Browse Activities to Add More</div>
        </div>

        {/* Bottom nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #F3F4F6', display: 'flex', padding: '6px 0 16px', zIndex: 300 }}>
          {[
            { id: 'home', sel: '/home-nav-selected.png', unsel: '/home-nav-unselected.png', label: 'Home', action: () => { setActiveNav('home'); closeCalendar(); setDayFilter('week'); setSearch(''); setAgeFilter('all'); setFreeOnly(false); setWeatherMode('all'); setWorthJourney(false); setNurseryFilter(false) } },
            { id: 'today', sel: '/today-nav-selected.png', unsel: '/today-nav-unselected.png', label: 'Today', action: () => { setActiveNav('today'); closeCalendar(); setDayFilter('today') } },
            { id: 'explore', sel: '/explore-nav-selected.png', unsel: '/explore-nav-unselected.png', label: 'Explore', action: () => { setActiveNav('explore'); closeCalendar(); setDayFilter('week'); setSearch(''); setAgeFilter('all'); setFreeOnly(false); setWeatherMode('all'); setWorthJourney(false); setNurseryFilter(false) } },
            { id: 'plans', sel: '/myplans-nav-selected.png', unsel: '/myplans-nav-unselected.png', label: 'My Plans', action: () => {} },
          ].map(tab => {
            const isActive = tab.id === 'plans' || activeNav === tab.id
            return (
              <div key={tab.id} onClick={tab.action} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={isActive ? tab.sel : tab.unsel} alt={tab.label} style={{ width: isActive ? 72 : 62, height: isActive ? 72 : 62, objectFit: 'contain', transition: 'width 0.15s, height 0.15s' }} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
    {showMap && <MapView listings={listings} onClose={() => { setShowMap(false); setActiveNav('home') }} />}
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100, fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero headline */}
      <div style={{ padding: '16px 20px 12px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>{getHeadline()}</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Quick ideas around Ealing for babies, toddlers and kids</p>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '10px 14px', gap: 8, flex: 1 }}>
          <span style={{ color: '#9CA3AF' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 15, color: '#111827', background: 'transparent' }} />
        </div>
        <button onClick={() => setShowFilters(f => !f)} style={{ background: showFilters ? '#5B2D6E' : 'white', border: showFilters ? 'none' : '1px solid #E5E7EB', borderRadius: 14, padding: '10px 16px', fontSize: 14, fontWeight: 700, color: showFilters ? 'white' : '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          ≡ Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ margin: '0 16px 12px', background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 10 }}>AGE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[['baby','👶 Baby 0-12m'],['toddler','🧒 Toddler 1-3'],['preschool','🐣 Preschool 3-5'],['kids','🎒 Kids 5+']].map(([key, label]) => (
              <span key={key} onClick={() => setAgeFilter(ageFilter === key ? 'all' : key)} style={{ fontSize: 13, fontWeight: ageFilter === key ? 700 : 500, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', background: ageFilter === key ? '#5B2D6E' : '#F3F4F6', color: ageFilter === key ? 'white' : '#374151' }}>{label}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 10 }}>SETTING</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[['sunny','Outdoor'],['rainy','Indoor']].map(([key, label]) => (
              <span key={key} onClick={() => setWeatherMode(weatherMode === key ? 'all' : key)} style={{ fontSize: 13, fontWeight: weatherMode === key ? 700 : 500, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', background: weatherMode === key ? '#D4732A' : '#F3F4F6', color: weatherMode === key ? 'white' : '#374151' }}>{label}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 10 }}>MORE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[['Free', freeOnly, () => setFreeOnly(!freeOnly)], ['Adventure', worthJourney, () => setWorthJourney(!worthJourney)], ['Nurseries', nurseryFilter, () => setNurseryFilter(!nurseryFilter)]].map(([label, active, action]) => (
              <span key={label} onClick={action} style={{ fontSize: 13, fontWeight: active ? 700 : 500, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', background: active ? '#D4732A' : '#F3F4F6', color: active ? 'white' : '#374151' }}>{label}</span>
            ))}
          </div>
          <button onClick={() => { clearAll(); setShowFilters(false) }} style={{ width: '100%', background: '#F3F4F6', border: 'none', borderRadius: 12, padding: '10px', fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Clear all filters</button>
        </div>
      )}

      {/* Age chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 8px', scrollbarWidth: 'none' }}>
        {[['baby','👶 Baby 0–12m'],['toddler','🧒 Toddler 1–3'],['preschool','👦 Preschool 3–5'],['kids','🎒 Kids 5+']].map(([key, label]) => (
          <span key={key} onClick={() => setAgeFilter(ageFilter === key ? 'all' : key)} style={chipStyle(ageFilter === key, '#5B2D6E')}>{label}</span>
        ))}
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 8px', scrollbarWidth: 'none' }}>
        {[['today','Today',todayCount],['tomorrow','Tomorrow',tomorrowCount],['weekend','Weekend',weekendCount],['week','Week',weekCount]].map(([key, label, count]) => (
          <span key={key} onClick={() => setDayFilter(key)} style={dayChipStyle(dayFilter === key)}>{label} {count}</span>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 8px', scrollbarWidth: 'none' }}>
        {[
          ['Outdoor', weatherMode === 'sunny', () => setWeatherMode(weatherMode === 'sunny' ? 'all' : 'sunny'), outdoorCount],
          ['Indoor', weatherMode === 'rainy', () => setWeatherMode(weatherMode === 'rainy' ? 'all' : 'rainy'), indoorCount],
          ['Free', freeOnly, () => setFreeOnly(!freeOnly), freeCount],
          ['Adventure', worthJourney, () => setWorthJourney(!worthJourney), adventureCount],
          ['Nurseries', nurseryFilter, () => setNurseryFilter(!nurseryFilter), nurseryCount],
        ].map(([label, active, action, count]) => (
          <span key={label} onClick={action} style={chipStyle(active)}>{label} {count}</span>
        ))}
      </div>

      {/* Count + clear + sort */}
      <div style={{ padding: '4px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{filtered.length} activities for families in Ealing this week</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasActiveFilters && <span onClick={clearAll} style={{ fontSize: 13, color: '#D4732A', fontWeight: 700, cursor: 'pointer' }}>Clear</span>}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: 12, fontWeight: 600, border: '1px solid #E5E7EB', borderRadius: 10, padding: '4px 8px', background: 'white', color: '#111827', cursor: 'pointer' }}>
            <option value="recommended">⭐ Recommended</option>
            <option value="nearest">📍 Nearest</option>
            <option value="newest">🆕 Newest</option>
            <option value="price">💰 Price</option>
          </select>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: '0 20px 4px', borderBottom: '1px solid #F3F4F6', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{getGreeting(weather)}</div>
        {weather && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{weather.temp}°C {weather.desc}</div>}
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>👀 {exploringCount} parents exploring LittleLocals today</div>
      </div>


      {/* Your week with the kids */}
      {!hasActiveFilters && currentPage === 1 && (() => {
        const todayKey = DAY_NAMES[new Date().getDay()]
        const weekDays = ['mon','tue','wed','thu','fri','sat','sun']
        const todayIdx = weekDays.indexOf(todayKey)
        const orderedDays = [...weekDays.slice(todayIdx), ...weekDays.slice(0, todayIdx)].slice(0, 5)
        const weekPicks = orderedDays.map(dayKey => {
          const usedSlugs = orderedDays.slice(0, orderedDays.indexOf(dayKey)).map(dk => {
            const p = listings.filter(l => l.image && (l.days_of_week || []).includes(dk))[0]
            return p?.slug
          }).filter(Boolean)
          return listings.filter(l =>
            l.image && !usedSlugs.includes(l.slug) && ((l.days_of_week || []).includes(dayKey) || l.is_daily)
          )[0] || listings.filter(l => l.image && !usedSlugs.includes(l.slug))[0] || null
        }).filter(Boolean)
        const savedThisWeek = weekPicks.filter(p => savedIds.has(p.id))
        const savedCount = savedThisWeek.length
        const sortedPicks = savedCount > 0
          ? [...savedThisWeek, ...weekPicks.filter(p => !savedIds.has(p.id))]
          : weekPicks
        const getWeekDayKey = (pick) => orderedDays[weekPicks.indexOf(pick)] || orderedDays[0]
        return (
          <div style={{ padding: '16px 0 4px' }}>
            <div style={{ padding: '0 20px 2px', fontSize: 15, fontWeight: 800, color: '#111827' }}>📅 My week with the kids</div>
            <div style={{ padding: '0 20px 6px', fontSize: 12, color: '#9CA3AF' }}>{savedCount > 0 ? `${savedCount} saved ${savedCount === 1 ? 'activity' : 'activities'} · tap ♥ to add more` : 'Tap ♥ on activities to build your week'}</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
              {sortedPicks.map(pick => {
                const dayKey = getWeekDayKey(pick)
                const dayMap = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }
                const isToday = dayKey === todayKey
                const isFree = pick.free || (pick.price || '').toLowerCase().includes('free')
                const isPickSaved = savedIds.has(pick.id)
                const dist = (() => {
                  if (!userLocation || !pick.lat || !pick.lng) return null
                  const R = 6371
                  const dLat = (pick.lat - userLocation.lat) * Math.PI / 180
                  const dLng = (pick.lng - userLocation.lng) * Math.PI / 180
                  const a = Math.sin(dLat/2)**2 + Math.cos(userLocation.lat*Math.PI/180) * Math.cos(pick.lat*Math.PI/180) * Math.sin(dLng/2)**2
                  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                  const mode = km < 1.5 ? 'walk' : 'drive'
                  const mins = Math.round(km / (mode === 'walk' ? 0.08 : 0.5))
                  return mins <= 1 ? 'Nearby' : mins + ' min'
                })()
                return (
                  <a key={pick.id} href={'/listing/' + pick.slug} style={{ flexShrink: 0, width: 155, borderRadius: 14, overflow: 'hidden', background: 'white', boxShadow: isPickSaved ? '0 2px 10px rgba(91,45,110,0.2)' : '0 2px 10px rgba(0,0,0,0.08)', border: isPickSaved ? '2px solid #5B2D6E' : '1px solid #F3F4F6', textDecoration: 'none', display: 'block', position: 'relative' }}>
                    <div style={{ position: 'relative', height: 95, overflow: 'hidden' }}>
                      <img src={pick.image} alt={pick.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 6, left: 6, background: isToday ? '#5B2D6E' : 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                        {isToday ? 'Today' : dayMap[dayKey]}
                      </div>
                      <div style={{ position: 'absolute', top: 6, right: 6, background: isPickSaved ? '#5B2D6E' : 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer' }}
                        onClick={e => { e.preventDefault(); e.stopPropagation(); navigator.vibrate && navigator.vibrate(50); try { const favs = JSON.parse(localStorage.getItem('ll_favs') || '[]'); const next = isPickSaved ? favs.filter(id => id !== pick.id) : [...new Set([...favs, pick.id])]; localStorage.setItem('ll_favs', JSON.stringify(next)); const cal = JSON.parse(localStorage.getItem('ll_calendar_v2') || '{}'); const calIds = Object.values(cal).flat(); setSavedIds(new Set([...next, ...calIds])) } catch(e) {} }}>
                        <span style={{ color: isPickSaved ? 'white' : '#9CA3AF' }}>{isPickSaved ? '♥' : '🤍'}</span>
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pick.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>📍 {dist || 'Nearby'}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isFree ? '#065F46' : '#D4732A' }}>{isFree ? 'Free' : pick.price}</span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })()}

      
      {/* Local favourite */}
      {!hasActiveFilters && currentPage === 1 && (() => {
        const fav = localFav
        if (!fav) return null
        const isFree = fav.free || (fav.price || '').toLowerCase().includes('free')
        return (
          <div style={{ padding: '20px 16px 4px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#D4732A', marginBottom: 4 }}>💜 LittleLocals pick this week</div>
            {fav.local_favourite_subtitle && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>{fav.local_favourite_subtitle}</div>
            )}
            <a href={'/listing/' + fav.slug} style={{ textDecoration: 'none', display: 'block', background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(212,163,42,0.25)', border: '2px solid #D4A32A' }}>
              <div style={{ position: 'relative' }}>
                {fav.image && <img src={fav.image} alt={fav.name} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />}
                <div style={{ position: 'absolute', top: 10, left: 10, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#92400E' }}>⭐ Local favourite</div>
                {fav.logo && (
                  <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={fav.logo} alt="" style={{ height: 20, width: 'auto', borderRadius: 4 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{fav.name}</span>
                    {fav.verified && <img src="/verified-badge-gold.svg" width={14} height={14} alt="" />}
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#D4732A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {fav.name}
                  {fav.verified && <img src="/verified-badge-gold.svg" width={16} height={16} alt="" />}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>{fav.type}</div>
                {fav.littlelocals_offer_text && (
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{fav.littlelocals_offer_text}</div>
                )}
              </div>
            </a>
          </div>
        )
      })()}

      {/* Easy picks for right now */}
      {!hasActiveFilters && currentPage === 1 && (() => {
        const todayAll = listings.filter(l => l.image && isOnToday(l))
        const todayPicks = [
          ...todayAll.filter(l => savedIds.has(l.id)),
          ...todayAll.filter(l => !savedIds.has(l.id))
        ].slice(0, 4)
        if (todayPicks.length === 0) return null
        return (
          <div style={{ padding: '20px 0 8px' }}>
            <div style={{ padding: '0 20px 10px', fontSize: 15, fontWeight: 800, color: '#D4732A' }}>✨ Popular with Ealing parents right now</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
              {todayPicks.map(l => {
                const isEasySaved = savedIds.has(l.id)
                return (
                  <a key={l.id} href={'/listing/' + l.slug} style={{ flexShrink: 0, width: 130, textDecoration: 'none', display: 'block', borderRadius: 14, border: isEasySaved ? '2px solid #5B2D6E' : '2px solid transparent', boxShadow: isEasySaved ? '0 2px 10px rgba(91,45,110,0.2)' : 'none', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 90, borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}>
                      <img src={l.image} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {l.logo && <img src={l.logo} alt="" style={{ position: 'absolute', bottom: 4, left: 4, height: 18, width: 'auto', borderRadius: 3, background: 'white', padding: 2 }} />}
                      <div style={{ position: 'absolute', top: 4, right: 4, background: '#22C55E', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>Today</div>
                      {isEasySaved && <div style={{ position: 'absolute', bottom: 4, right: 4, background: '#5B2D6E', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>💜 Saved</div>}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px 4px' }}>{l.name}</div>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Trusted by Ealing parents divider */}
      {!hasActiveFilters && currentPage === 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 16px' }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>Trusted by Ealing parents</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>
      )}

      {/* Listings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px' }}>
        {sortedFiltered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE).map(listing => (
          <div key={listing.id} onClick={() => sessionStorage.setItem('ll_page', String(currentPage))}>
            <ListingCard listing={listing} userLocation={userLocation} recentViews={listing.recentViews || 0} isSaved={savedIds.has(listing.id)} />
          </div>
        ))}
      </div>



      {/* Install banner */}
      {!hasActiveFilters && currentPage === 1 && showInstall && (
        <>
          <div onClick={handleInstallClick} style={{ margin: '0 16px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <img src="/bear-logo.png" alt="LITTLElocals" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Add to home screen</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>for quick access</div>
            </div>
            <span style={{ fontSize: 18 }}>+</span>
          </div>
          {showIOSInstructions && (
            <div style={{ margin: '-8px 16px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#0369A1', lineHeight: 1.5 }}>
              Tap the <strong>Share</strong> button in Safari, then tap <strong>Add to Home Screen</strong>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (() => {
        const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
        const pages = []
        if (currentPage > 1) pages.push({ label: '← Prev', page: currentPage - 1, prev: true })
        pages.push({ label: '1', page: 1 })
        if (totalPages > 1) pages.push({ label: '2', page: 2 })
        if (currentPage > 3) pages.push({ label: '...', page: null })
        if (currentPage > 2 && currentPage < totalPages - 1) pages.push({ label: String(currentPage), page: currentPage })
        if (totalPages > 3 && currentPage < totalPages - 1) pages.push({ label: '...', page: null })
        pages.push({ label: String(totalPages), page: totalPages })
        if (currentPage < totalPages) pages.push({ label: 'Next →', page: currentPage + 1, next: true })
        const seen = new Set()
        const deduped = pages.filter(p => {
          if (p.label === '...') return true
          if (seen.has(p.label)) return false
          seen.add(p.label); return true
        })
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '20px 16px', flexWrap: 'wrap' }}>
            {deduped.map((p, i) => (
              <button key={i} onClick={() => { if (p.page) { setCurrentPage(p.page); window.scrollTo({ top: 0, behavior: 'smooth' }) } }} disabled={!p.page} style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, fontWeight: p.page === currentPage ? 700 : 500,
                background: p.page === currentPage ? '#D4732A' : 'white',
                color: p.page === currentPage ? 'white' : p.prev || p.next ? '#111827' : '#6B7280',
                cursor: p.page ? 'pointer' : 'default', minWidth: 38
              }}>{p.label}</button>
            ))}
          </div>
        )
      })()}


      {/* Just added near you */}
      {!hasActiveFilters && recentListings.length > 0 && (
        <div style={{ padding: '24px 0 8px' }}>
          <div style={{ padding: '0 20px 10px', fontSize: 15, fontWeight: 800, color: '#D4732A' }}>✨ Just added near you</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {recentListings.map(l => {
              const fullListing = listings.find(fl => fl.id === l.id)
              const img = fullListing?.image || null
              return (
                <a key={l.id} href={`/listing/${l.slug}`} style={{ flexShrink: 0, width: 140, textDecoration: 'none', display: 'block' }}>
                  <div style={{ height: 90, borderRadius: 12, overflow: 'hidden', marginBottom: 6, background: '#F3F4F6', position: 'relative' }}>
                    {img ? <img src={img} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{l.emoji || '🎯'}</div>}
                    <div style={{ position: 'absolute', top: 6, left: 6, background: '#D4732A', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5 }}>NEW</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{l.type}</div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Suggest an activity CTA */}
      <div style={{ margin: '24px 16px 0', background: '#FFF7ED', border: '2px dashed #D4732A', borderRadius: 18, padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>✨ Suggest an activity for Ealing parents</div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Help improve what families nearby can find</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>✨</span>
          <a href='mailto:hello@littlelocals.uk?subject=Suggest an activity' style={{ background: '#D4732A', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none' }}>Add activity</a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, padding: '0 20px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#D1D5DB', marginBottom: 16 }}>community-powered kids activity discovery</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <img src="/bear-logo.png" alt="LITTLElocals" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: '#111827', letterSpacing: -0.5 }}>LITTLE<span style={{ color: '#D4732A' }}>locals</span></span>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>Built by parents, for parents.</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['Privacy Policy','/privacy'],['Cookie Policy','/cookies'],['Terms of Service','/terms'],['Contact','mailto:hello@littlelocals.uk']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'underline' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#D1D5DB' }}>© 2026 LITTLElocals. All rights reserved.</div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #F3F4F6', display: 'flex', padding: '6px 0 16px', zIndex: 300 }}>
        {[
          { id: 'home', sel: '/home-nav-selected.png', unsel: '/home-nav-unselected.png', label: 'Home', action: () => { setActiveNav('home'); setShowMap(false); setDayFilter('week'); setSearch(''); setAgeFilter('all'); setFreeOnly(false); setWeatherMode('all'); setWorthJourney(false); setNurseryFilter(false); window.scrollTo({ top: 0, behavior: 'smooth' }) } },
          { id: 'today', sel: '/today-nav-selected.png', unsel: '/today-nav-unselected.png', label: 'Today', action: () => { setActiveNav('today'); setShowMap(false); setDayFilter('today'); window.scrollTo({ top: 0, behavior: 'smooth' }) } },
          { id: 'explore', sel: '/explore-nav-selected.png', unsel: '/explore-nav-unselected.png', label: 'Explore', action: () => { setActiveNav('explore'); setShowMap(true) } },
          { id: 'plans', sel: '/myplans-nav-selected.png', unsel: '/myplans-nav-unselected.png', label: 'My Plans', action: () => { setActiveNav('plans'); setShowMap(false); openCalendar() }, badge: calendarTotal },
        ].map(tab => {
          const isActive = activeNav === tab.id
          return (
          <div key={tab.id} onClick={tab.action} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={isActive ? tab.sel : tab.unsel} alt={tab.label} style={{ width: isActive ? 72 : 62, height: isActive ? 72 : 62, objectFit: 'contain', transition: 'width 0.15s, height 0.15s' }} />
            {tab.badge > 0 && <div style={{ position: 'absolute', top: 0, right: 'calc(50% - 22px)', background: '#D4732A', color: 'white', fontSize: 9, fontWeight: 800, borderRadius: 10, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{tab.badge}</div>}
          </div>
          )
        })}
      </div>
    </div>
  </>
  )
}

