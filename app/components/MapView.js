'use client'
import { useEffect, useRef } from 'react'

export default function MapView({ listings, onClose }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current) return
    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = window.L
      const map = L.map(mapRef.current).setView([51.513, -0.305], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      const icon = (color) => L.divIcon({
        className: '',
        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })

      listings.filter(l => l.lat && l.lng).forEach(l => {
        const isFree = l.free || (l.price||''). toLowerCase().includes('free')
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
      })
      mapInstanceRef.current = map
    }
    document.head.appendChild(script)
  }, [])

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 90, zIndex: 200, background: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderBottom: '1px solid #F3F4F6', zIndex: 201 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>🗺️ Activities near you</div>
        <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
      </div>
      <div style={{ padding: '8px 16px', display: 'flex', gap: 12, fontSize: 12, color: '#6B7280', background: 'white' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#5B2D6E', marginRight: 4 }}></span>Paid</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22C55E', marginRight: 4 }}></span>Free</span>
        <span style={{ marginLeft: 'auto' }}>{listings.filter(l => l.lat && l.lng).length} activities shown</span>
      </div>
      <div ref={mapRef} style={{ flex: 1 }} />
    </div>
  )
}
