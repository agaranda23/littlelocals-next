'use client'
import { useState, useEffect } from 'react'
import ListingCard from './ListingCard'

const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat']

function isOnToday(listing) {
  if (listing.is_daily) return true
  const today = DAY_NAMES[new Date().getDay()]
  return (listing.days_of_week || []).includes(today)
}

function isOnWeekend(listing) {
  if (listing.is_daily) return true
  return (listing.days_of_week || []).some(d => ['sat','sun'].includes(d))
}

function isOnThisWeek(listing) {
  if (listing.is_daily) return true
  return (listing.days_of_week || []).length > 0
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
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5139&longitude=-0.3048&current_weather=true&hourly=precipitation_probability&timezone=Europe/London')
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
      return (l.name||'').toLowerCase().includes(q) || (l.type||'').toLowerCase().includes(q) || (l.location||'').toLowerCase().includes(q)
    }
    if (freeOnly && !l.free && !(l.price||'').toLowerCase().includes('free')) return false
    if (weatherMode === 'rainy' && !l.indoor) return false
    if (weatherMode === 'sunny' && l.indoor) return false
    if (ageFilter === 'baby' && (l.age_max || 99) > 1) return false
    if (ageFilter === 'toddler' && ((l.age_min || 0) > 3 || (l.age_max || 99) < 1)) return false
    if (ageFilter === 'preschool' && ((l.age_min || 0) > 5 || (l.age_max || 99) < 3)) return false
    if (ageFilter === 'kids' && (l.age_max || 99) < 5) return false
    if (dayFilter === 'today' && !isOnToday(l)) return false
    if (dayFilter === 'weekend' && !isOnWeekend(l)) return false
    if (dayFilter === 'week' && !isOnThisWeek(l)) return false
    return true
  })

  const todayCount = listings.filter(isOnToday).length
  const weekendCount = listings.filter(isOnWeekend).length
  const weekCount = listings.filter(isOnThisWeek).length

  const ageTabs = [
    { key: 'all', label: 'All ages' },
    { key: 'baby', label: '👶 Baby 0–12m' },
    { key: 'toddler', label: '🧒 Toddler 1–3' },
    { key: 'preschool', label: '🐣 Preschool 3–5' },
    { key: 'kids', label: '🎒 Kids 5+' },
  ]

  const dayTabs = [
    { key: 'today', label: 'Today', count: todayCount },
    { key: 'tomorrow', label: 'Tomorrow', count: null },
    { key: 'weekend', label: 'Weekend', count: weekendCount },
    { key: 'week', label: 'Week', count: weekCount },
  ]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 100px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Greeting */}
      <div style={{ padding: '16px 20px 4px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 3 }}>{getGreeting(weather)}</div>
        {weather && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{weather.temp}°C {weather.desc}</div>}
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '10px 14px', gap: 8 }}>
          <span style={{ color: '#9CA3AF' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activities..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 15, color: '#111827', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Age chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 8px', scrollbarWidth: 'none' }}>
        {ageTabs.map(({ key, label }) => (
          <span key={key} onClick={() => setAgeFilter(key)} style={{ flexShrink: 0, fontSize: 13, fontWeight: ageFilter === key ? 700 : 500, padding: '6px 14px', borderRadius: 20, background: ageFilter === key ? '#5B2D6E' : 'white', color: ageFilter === key ? 'white' : '#6B7280', border: ageFilter === key ? 'none' : '1px solid #E5E7EB', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        ))}
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 10px', scrollbarWidth: 'none' }}>
        {dayTabs.map(({ key, label, count }) => (
          <span key={key} onClick={() => setDayFilter(key)} style={{ flexShrink: 0, fontSize: 13, fontWeight: dayFilter === key ? 700 : 500, padding: '6px 14px', borderRadius: 20, background: dayFilter === key ? '#111827' : 'white', color: dayFilter === key ? 'white' : '#6B7280', border: dayFilter === key ? 'none' : '1px solid #E5E7EB', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {label}{count !== null ? ` ${count}` : ''}
          </span>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        {[
          { label: 'Outdoor', active: weatherMode === 'sunny', action: () => setWeatherMode(weatherMode === 'sunny' ? 'all' : 'sunny') },
          { label: 'Indoor', active: weatherMode === 'rainy', action: () => setWeatherMode(weatherMode === 'rainy' ? 'all' : 'rainy') },
          { label: 'Free', active: freeOnly, action: () => setFreeOnly(!freeOnly) },
        ].map(({ label, active, action }) => (
          <span key={label} onClick={action} style={{ flexShrink: 0, fontSize: 13, fontWeight: active ? 700 : 500, padding: '6px 14px', borderRadius: 20, background: active ? '#D4732A' : 'white', color: active ? 'white' : '#6B7280', border: active ? 'none' : '1px solid #E5E7EB', cursor: 'pointer' }}>
            {label}
          </span>
        ))}
      </div>

      {/* Count */}
      <div style={{ padding: '0 20px 12px', fontSize: 13, color: '#6B7280' }}>
        {filtered.length} activities in Ealing
      </div>

      {/* Listings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px' }}>
        {filtered.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #F3F4F6', display: 'flex', padding: '8px 0 20px', zIndex: 100 }}>
        {[['🏠', 'Home'], ['📅', 'Today'], ['🔍', 'Explore'], ['📋', 'My Plans']].map(([icon, label]) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: label === 'Home' ? '#5B2D6E' : '#9CA3AF', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
