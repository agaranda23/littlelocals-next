'use client'
import { useState, useEffect } from 'react'
import ListingCard from './ListingCard'

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
  const [dayFilter, setDayFilter] = useState('week')
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [freeOnly, setFreeOnly] = useState(false)
  const [weatherMode, setWeatherMode] = useState('all')
  const [worthJourney, setWorthJourney] = useState(false)
  const [nurseryFilter, setNurseryFilter] = useState(false)

  useEffect(() => { setCurrentPage(1) }, [dayFilter, search, ageFilter, freeOnly, weatherMode, worthJourney, nurseryFilter])
  const [userLocation, setUserLocation] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [weather, setWeather] = useState(null)
  const [exploringCount, setExploringCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 6
  useEffect(() => { setExploringCount(Math.floor(Math.random() * 18) + 8) }, [])

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
      const q = search.toLowerCase()
      return (l.name||'').toLowerCase().includes(q) || (l.type||'').toLowerCase().includes(q)
    }
    if (freeOnly && !l.free && !(l.price||'').toLowerCase().includes('free')) return false
    if (weatherMode === 'rainy' && !l.indoor) return false
    if (weatherMode === 'sunny' && l.indoor) return false
    if (worthJourney && !l.worth_journey) return false
    if (nurseryFilter && (l.category||'').toLowerCase() !== 'nursery') return false
    if (ageFilter === 'baby' && (l.age_max || 99) > 1) return false
    if (ageFilter === 'toddler' && ((l.age_min||0) > 3 || (l.age_max||99) < 1)) return false
    if (ageFilter === 'preschool' && ((l.age_min||0) > 5 || (l.age_max||99) < 3)) return false
    if (ageFilter === 'kids' && (l.age_max||99) < 5) return false
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

  return (
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
        {[['baby','👶 Baby 0–12m'],['toddler','🧒 Toddler 1–3'],['preschool','🐣 Preschool 3–5'],['kids','🎒 Kids 5+']].map(([key, label]) => (
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
          ['Outdoor', weatherMode === 'sunny', () => setWeatherMode(weatherMode === 'sunny' ? 'all' : 'sunny')],
          ['Indoor', weatherMode === 'rainy', () => setWeatherMode(weatherMode === 'rainy' ? 'all' : 'rainy')],
          ['Free', freeOnly, () => setFreeOnly(!freeOnly)],
          ['Adventure', worthJourney, () => setWorthJourney(!worthJourney)],
          ['Nurseries', nurseryFilter, () => setNurseryFilter(!nurseryFilter)],
        ].map(([label, active, action]) => (
          <span key={label} onClick={action} style={chipStyle(active)}>{label}</span>
        ))}
      </div>

      {/* Count + clear */}
      <div style={{ padding: '4px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{filtered.length} activities in Ealing</span>
        {hasActiveFilters && <span onClick={clearAll} style={{ fontSize: 13, color: '#D4732A', fontWeight: 700, cursor: 'pointer' }}>Clear filters</span>}
      </div>

      {/* Greeting */}
      <div style={{ padding: '0 20px 4px', borderBottom: '1px solid #F3F4F6', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{getGreeting(weather)}</div>
        {weather && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{weather.temp}°C {weather.desc}</div>}
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>👀 {exploringCount} parents exploring today</div>
      </div>


      {/* Your week with the kids */}
      {!hasActiveFilters && currentPage === 1 && (() => {
        const todayKey = DAY_NAMES[new Date().getDay()]
        const weekDays = ['mon','tue','wed','thu','fri','sat','sun']
        const todayIdx = weekDays.indexOf(todayKey)
        const orderedDays = [...weekDays.slice(todayIdx), ...weekDays.slice(0, todayIdx)]
        return (
          <div style={{ padding: '16px 0 4px' }}>
            <div style={{ padding: '0 20px 4px', fontSize: 15, fontWeight: 800, color: '#111827' }}>📅 Your week with the kids</div>
            <div style={{ padding: '0 20px 10px', fontSize: 12, color: '#9CA3AF' }}>Ideas nearby based on what's happening this week</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
              {orderedDays.map(dayKey => {
                const dayMap = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }
                const isToday = dayKey === todayKey
                const usedSlugs = orderedDays.slice(0, orderedDays.indexOf(dayKey)).map(dk => {
                  const p = listings.filter(l =>
                    l.image && (l.days_of_week || []).includes(dk)
                  )[0]
                  return p?.slug
                }).filter(Boolean)
                const pick = listings.filter(l =>
                  l.image &&
                  !usedSlugs.includes(l.slug) &&
                  ((l.days_of_week || []).includes(dayKey) || l.is_daily)
                )[0] || listings.filter(l =>
                  l.image && !usedSlugs.includes(l.slug)
                )[0]
                if (!pick) return null
                const isFree = pick.free || (pick.price || '').toLowerCase().includes('free')
                return (
                  <a key={dayKey} href={'/listing/' + pick.slug} style={{ flexShrink: 0, width: 155, borderRadius: 14, overflow: 'hidden', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: isToday ? '2px solid #5B2D6E' : '1px solid #F3F4F6', textDecoration: 'none', display: 'block' }}>
                    <div style={{ position: 'relative', height: 95, overflow: 'hidden' }}>
                      <img src={pick.image} alt={pick.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 6, left: 6, background: isToday ? '#5B2D6E' : 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                        {isToday ? 'Today' : dayMap[dayKey]}
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pick.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>📍 Nearby</span>
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
            <div style={{ fontSize: 15, fontWeight: 800, color: '#D4732A', marginBottom: 4 }}>⭐ Local favourite this week</div>
            {fav.local_favourite_subtitle && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>{fav.local_favourite_subtitle}</div>
            )}
            <a href={'/listing/' + fav.slug} style={{ textDecoration: 'none', display: 'block', background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>
              <div style={{ position: 'relative' }}>
                {fav.image && <img src={fav.image} alt={fav.name} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />}
                <div style={{ position: 'absolute', top: 10, left: 10, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#92400E' }}>⭐ Local favourite</div>
                {fav.logo && (
                  <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={fav.logo} alt="" style={{ height: 20, width: 'auto', borderRadius: 4 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{fav.name}</span>
                    {fav.verified && <img src="/verified-badge.svg" width={14} height={14} alt="" />}
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#D4732A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {fav.name}
                  {fav.verified && <img src="/verified-badge.svg" width={16} height={16} alt="" />}
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
        const todayPicks = listings.filter(l => l.image && isOnToday(l)).slice(0, 6)
        if (todayPicks.length === 0) return null
        return (
          <div style={{ padding: '20px 0 8px' }}>
            <div style={{ padding: '0 20px 10px', fontSize: 15, fontWeight: 800, color: '#D4732A' }}>✨ Easy picks for right now</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
              {todayPicks.map(l => (
                <a key={l.id} href={'/listing/' + l.slug} style={{ flexShrink: 0, width: 130, textDecoration: 'none', display: 'block' }}>
                  <div style={{ position: 'relative', height: 90, borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}>
                    <img src={l.image} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {l.logo && <img src={l.logo} alt="" style={{ position: 'absolute', bottom: 4, left: 4, height: 18, width: 'auto', borderRadius: 3, background: 'white', padding: 2 }} />}
                    <div style={{ position: 'absolute', top: 4, right: 4, background: '#22C55E', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>Today</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                </a>
              ))}
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
        {filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE).map(listing => (
          <ListingCard key={listing.id} listing={listing} userLocation={userLocation} recentViews={listing.recentViews || 0} />
        ))}
      </div>

      {/* Mid-feed suggest CTA - shown after listings on page 1 */}
      {!hasActiveFilters && currentPage === 1 && filtered.length > 3 && (
        <div style={{ margin: '4px 16px 4px', background: '#FFF7ED', border: '2px dashed #D4732A', borderRadius: 18, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>✨ Suggest an activity for Ealing parents</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>Help improve what families nearby can find</div>
          </div>
          <a href='mailto:hello@littlelocals.uk?subject=Suggest an activity' style={{ background: '#D4732A', color: 'white', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none' }}>Add activity</a>
        </div>
      )}

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
              <button key={i} onClick={() => p.page && setCurrentPage(p.page)} disabled={!p.page} style={{
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
            {recentListings.map(l => (
              <a key={l.id} href={`/listing/${l.slug}`} style={{ flexShrink: 0, background: 'white', borderRadius: 14, border: '1.5px dashed #E5E7EB', padding: '10px 14px', minWidth: 140, maxWidth: 160, textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#D4732A', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{l.type}</div>
              </a>
            ))}
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
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #F3F4F6', display: 'flex', padding: '8px 0 20px', zIndex: 100 }}>
        {[['🏠','Home','/'],['📅','Today','/?day=today'],['🔍','Explore','/'],['📋','My Plans','/']].map(([icon, label, href]) => (
          <a key={label} href={href} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', textDecoration: 'none' }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: label === 'Home' ? '#5B2D6E' : '#9CA3AF', marginTop: 2 }}>{label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
