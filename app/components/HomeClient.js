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

export default function HomeClient({ listings }) {
  const [dayFilter, setDayFilter] = useState('week')
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [freeOnly, setFreeOnly] = useState(false)
  const [weatherMode, setWeatherMode] = useState('all')
  const [worthJourney, setWorthJourney] = useState(false)
  const [nurseryFilter, setNurseryFilter] = useState(false)
  const [weather, setWeather] = useState(null)
  const [exploringCount, setExploringCount] = useState(0)
  useEffect(() => { setExploringCount(Math.floor(Math.random() * 18) + 8) }, [])

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
    background: active ? '#111827' : 'white',
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
      <div style={{ padding: '0 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '10px 14px', gap: 8 }}>
          <span style={{ color: '#9CA3AF' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 15, color: '#111827', background: 'transparent' }} />
        </div>
      </div>

      {/* Age chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 8px', scrollbarWidth: 'none' }}>
        {[['all','All ages'],['baby','👶 Baby 0–12m'],['toddler','🧒 Toddler 1–3'],['preschool','🐣 Preschool 3–5'],['kids','🎒 Kids 5+']].map(([key, label]) => (
          <span key={key} onClick={() => setAgeFilter(key)} style={chipStyle(ageFilter === key, '#5B2D6E')}>{label}</span>
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
          ['🚗 Adventure', worthJourney, () => setWorthJourney(!worthJourney)],
          ['🏫 Nurseries', nurseryFilter, () => setNurseryFilter(!nurseryFilter)],
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

      {/* Listings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px' }}>
        {filtered.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #F3F4F6', display: 'flex', padding: '8px 0 20px', zIndex: 100 }}>
        {[['🏠','Home'],['📅','Today'],['🔍','Explore'],['📋','My Plans']].map(([icon, label]) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: label === 'Home' ? '#5B2D6E' : '#9CA3AF', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
