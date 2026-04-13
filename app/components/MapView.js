'use client'
import { useEffect, useRef, useState } from 'react'

const CATEGORIES = [
  { label: '🏊 Swimming', keywords: ['swim', 'aqua', 'water'] },
  { label: '⚽ Football', keywords: ['football', 'soccer', 'kickers'] },
  { label: '🎵 Music', keywords: ['music', 'sing', 'song', 'tunes', 'hartbeep'] },
  { label: '💃 Dance', keywords: ['dance', 'ballet', 'movement'] },
  { label: '🌳 Parks', keywords: ['park', 'playground', 'nature', 'outdoor', 'woodland'] },
  { label: '🧸 Nursery', keywords: ['nursery', 'playgroup', 'toddler group', 'stay and play'] },
  { label: '🎨 Arts', keywords: ['art', 'craft', 'paint', 'creative'] },
  { label: '💰 Free', keywords: [] },
]

function matchesCategory(listing, cat) {
  if (cat.label === '💰 Free') return listing.free || (listing.price || '').toLowerCase().includes('free')
  const haystack = [listing.name, listing.type, listing.category, listing.description].filter(Boolean).join(' ').toLowerCase()
  return cat.keywords.some(k => haystack.includes(k))
}

export default function MapView({ listings, onClose }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)

  const filtered = listings.filter(l => {
    if (!l.lat || !l.lng) return false
    if (activeCategory) {
      const cat = CATEGORIES.find(c => c.label === activeCategory)
      if (cat && !matchesCategory(l, cat)) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const haystack = [l.name, l.type, l.category, l.location].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  useEffect(() => {
    if (mapInstanceRef.current) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = window.L
      const map = L.map(mapRef.current).setView([51.513, -0.305], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)
      mapInstanceRef.current = map
      updateMarkers(L, map, listings)
    }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    updateMarkers(window.L, mapInstanceRef.current, filtered)
  }, [filtered.length, activeCategory, search])

  function updateMarkers(L, map, listingsToShow) {
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
    const icon = (color) => L.divIcon({
      className: '',
      html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    })
    listingsToShow.forEach(l => {
      const isFree = l.free || (l.price || '').toLowerCase().includes('free')
      const marker = L.marker([l.lat, l.lng], { icon: icon(isFree ? '#22C55E' : '#5B2D6E') })
      marker.bindPopup(`
        <div style="min-width:160px;font-family:system-ui">
          ${l.image ? `<img src="${l.image}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px">` : ''}
          <div style="font-weight:800;font-size:13px;color:#111827;margin-bottom:2px">${l.name}</div>
          <div style="font-size:11px;color:#6B7280;margin-bottom:6px">${l.type || ''} ${isFree ? '· Free' : l.price ? '· '+l.price : ''}</div>
          <a href="/listing/${l.slug}" style="display:block;background:#5B2D6E;color:white;text-align:center;padding:6px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">View activity →</a>
        </div>
      `, { maxWidth: 200 })
      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 90, zIndex: 200, background: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderBottom: '1px solid #F3F4F6', zIndex: 201 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>🗺️ Explore Ealing</div>
        <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
      </div>

      {/* Search bar */}
      <div style={{ padding: '8px 16px 4px', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: 12, padding: '8px 12px', gap: 8 }}>
          <span style={{ color: '#9CA3AF' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activities on map..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#111827', background: 'transparent' }}
          />
          {search && <span onClick={() => setSearch('')} style={{ color: '#9CA3AF', cursor: 'pointer', fontSize: 16 }}>✕</span>}
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '6px 16px 8px', scrollbarWidth: 'none', background: 'white' }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.label
          return (
            <span
              key={cat.label}
              onClick={() => setActiveCategory(isActive ? null : cat.label)}
              style={{
                flexShrink: 0, fontSize: 12, fontWeight: isActive ? 700 : 500,
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
                background: isActive ? '#5B2D6E' : 'white',
                color: isActive ? 'white' : '#6B7280',
                border: isActive ? 'none' : '1px solid #E5E7EB',
              }}
            >
              {cat.label}
            </span>
          )
        })}
      </div>

      {/* Count bar */}
      <div style={{ padding: '0 16px 6px', display: 'flex', gap: 12, fontSize: 12, color: '#6B7280', background: 'white' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#5B2D6E', marginRight: 4 }}></span>Paid</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22C55E', marginRight: 4 }}></span>Free</span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#D4732A' }}>{filtered.length} activities shown</span>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1 }} />
    </div>
  )
}
