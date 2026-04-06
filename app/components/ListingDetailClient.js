'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat']

export default function ListingDetailClient({ listing, images, relatedListings }) {
  const [saved, setSaved] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const [visited, setVisited] = useState(false)
  const [plannedDates, setPlannedDates] = useState([])

  // Track recently viewed
  useEffect(() => {
    try {
      const rv = JSON.parse(localStorage.getItem('ll_recentlyViewed') || '[]')
      const filtered = rv.filter(r => r.id !== listing.id)
      const updated = [{ id: listing.id, name: listing.name, image: images?.[0]?.url || null }, ...filtered].slice(0, 20)
      localStorage.setItem('ll_recentlyViewed', JSON.stringify(updated))
    } catch(e) {}
  }, [listing.id])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const passport = JSON.parse(localStorage.getItem('ll_passport') || '[]')
      if (passport.includes(listing.id)) setVisited(true)
      const calData = localStorage.getItem('ll_calendar_v2')
      if (calData) {
        const cal = JSON.parse(calData)
        const dates = Object.keys(cal).filter(d => (cal[d] || []).includes(listing.id))
        setPlannedDates(dates)
      }
    } catch(e) {}
  }, [listing.id])

  const toggleVisited = () => {
    try {
      const passport = JSON.parse(localStorage.getItem('ll_passport') || '[]')
      if (visited) {
        localStorage.setItem('ll_passport', JSON.stringify(passport.filter(id => id !== listing.id)))
        setVisited(false)
      } else {
        localStorage.setItem('ll_passport', JSON.stringify([...new Set([...passport, listing.id])]))
        setVisited(true)
      }
    } catch(e) {}
  }

  const addToPlans = () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const cal = JSON.parse(localStorage.getItem('ll_calendar_v2') || '{}')
      const arr = cal[today] || []
      if (!arr.includes(listing.id)) {
        cal[today] = [...arr, listing.id]
        localStorage.setItem('ll_calendar_v2', JSON.stringify(cal))
        setPlannedDates(prev => [...new Set([...prev, today])])
      }
    } catch(e) {}
  }

  const togglePlan = (dateStr) => {
    try {
      const cal = JSON.parse(localStorage.getItem('ll_calendar_v2') || '{}')
      const arr = cal[dateStr] || []
      if (arr.includes(listing.id)) {
        cal[dateStr] = arr.filter(id => id !== listing.id)
        if (cal[dateStr].length === 0) delete cal[dateStr]
        setPlannedDates(prev => prev.filter(d => d !== dateStr))
      } else {
        cal[dateStr] = [...arr, listing.id]
        setPlannedDates(prev => [...new Set([...prev, dateStr])])
      }
      localStorage.setItem('ll_calendar_v2', JSON.stringify(cal))
    } catch(e) {}
  }

  const getPlanDays = () => {
    const days = []
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    for (let i = 0; i < 10; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const label = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayNames[d.getDay()]
      days.push({ label, num: d.getDate(), dateStr: d.toISOString().split('T')[0] })
    }
    return days
  }

  const isFree = listing.free || (listing.price || '').toLowerCase().includes('free')
  const isOnToday = () => {
    if (listing.is_daily) return true
    if (!listing.days_of_week || listing.days_of_week.length === 0) return true
    const today = DAY_NAMES[new Date().getDay()]
    return (listing.days_of_week || []).includes(today)
  }
  const onToday = isOnToday()

  const BottomNav = () => (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #F3F4F6', display: 'flex', padding: '6px 0 16px', zIndex: 100 }}>
      {[
        { img: '/nav-home.png', label: 'Home', href: '/' },
        { img: '/nav-today.png', label: 'Today', href: '/?day=today' },
        { img: '/nav-explore.png', label: 'Explore', href: '/' },
        { img: '/nav-plans.png', label: 'My Plans', href: '/?plans=1' },
      ].map(tab => (
        <a key={tab.label} href={tab.href} style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={tab.img} alt={tab.label} style={{ width: 66, height: 66, objectFit: 'contain' }} />
        </a>
      ))}
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100, fontFamily: 'system-ui, sans-serif' }}>

      {/* Back + actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', position: 'sticky', top: 56, background: 'rgba(249,250,251,0.95)', backdropFilter: 'blur(8px)', zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#111827', textDecoration: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20, padding: '6px 14px' }}>
          ← Back
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setSaved(s => !s); navigator.vibrate && navigator.vibrate(50) }} style={{ background: saved ? '#5B2D6E' : 'white', border: saved ? 'none' : '1px solid #E5E7EB', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, transition: 'background 0.2s' }}>
            <span style={{ color: 'white', fontSize: saved ? 18 : 16 }}>{saved ? '♥' : '🤍'}</span>
          </button>

        </div>
      </div>

      {/* Cover photo only */}
      {images.length > 0 && (
        <div style={{ position: 'relative', height: 280, overflow: 'hidden', background: '#F3F4F6', cursor: 'pointer' }}
          onClick={() => setLightbox(0)}>
          {images[0]?.url?.endsWith('.mp4') ? <video src={images[0].url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={images[0]?.url} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          {listing.logo && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '4px 10px' }}>
              <img src={listing.logo} alt="" style={{ height: 24, width: 'auto', borderRadius: 4 }} />
            </div>
          )}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>
              1/{images.length} 📷
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>

        {/* Category + status pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {listing.type && <span style={{ fontSize: 12, fontWeight: 700, background: '#111827', color: 'white', padding: '4px 12px', borderRadius: 20 }}>{listing.type}</span>}
          {!listing.indoor && <span style={{ fontSize: 12, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: 20 }}>Outdoor ☀️</span>}
          {listing.indoor && <span style={{ fontSize: 12, fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', padding: '4px 12px', borderRadius: 20 }}>Indoor 🏠</span>}
          {onToday && <span style={{ fontSize: 12, fontWeight: 700, background: '#D4732A', color: 'white', padding: '4px 12px', borderRadius: 20 }}>On Today! 🗓</span>}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.2 }}>
            {listing.name}
          </h1>
        </div>

        {listing.location && <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>{listing.location}</div>}

        {/* Verified + today badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {listing.verified && images.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '4px 12px', borderRadius: 20 }}>
              <img src="/verified-badge.svg" width={14} height={14} alt="" /> Verified
            </span>
          )}
          {onToday && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#D4732A', background: '#FFF7ED', border: '1px solid #FED7AA', padding: '4px 12px', borderRadius: 20 }}>📅 On today</span>}
        </div>

        {/* Verified banner */}
        {listing.verified && images.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <img src="/verified-badge.svg" width={16} height={16} alt="" />
            <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>Verified · listing details checked by LITTLElocals</span>
          </div>
        )}

        {/* Local favourite badge */}
        {listing.is_local_favourite && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 20, padding: '6px 14px', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#92400E' }}>
            ⭐ Local favourite this week
          </div>
        )}

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            listing.day && { label: 'When', icon: '📅', value: listing.day },
            listing.time && { label: 'Time', icon: '🕐', value: listing.time },
            listing.ages && { label: 'Ages', icon: '👶', value: listing.ages },
            (listing.price || isFree) && { label: 'Price', icon: '💰', value: isFree ? 'Free' : listing.price },
            listing.parking && { label: 'Parking', icon: '🅿️', value: listing.parking },
            listing.indoor !== null && listing.indoor !== undefined && { label: 'Setting', icon: listing.indoor ? '🏠' : '🌳', value: listing.indoor ? 'Indoor' : 'Outdoor' },
          ].filter(Boolean).map(({ label, icon, value }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #F3F4F6', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{icon} {value}</div>
            </div>
          ))}
        </div>

        {/* Venue + map */}
        {listing.venue && (
          <a href={`https://maps.google.com/?q=${encodeURIComponent(listing.venue)}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #F3F4F6', borderRadius: 14, padding: '14px 16px', marginBottom: 14, textDecoration: 'none' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{listing.venue}</div>
              <div style={{ fontSize: 12, color: '#D4732A', fontWeight: 600 }}>📍 Open in Maps</div>
            </div>
            <span style={{ color: '#D4732A', fontSize: 18 }}>↗</span>
          </a>
        )}

        {/* Social proof */}
        {listing.popular && (
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>✨ Frequently chosen by Ealing parents recently</div>
        )}

        {/* Description */}
        {listing.description && (
          <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>
            {listing.description}
          </div>
        )}

        {/* Timetable image */}
        {listing.timetable_image && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 10 }}>📅 Timetable</div>
            <img src={listing.timetable_image} alt="Timetable" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12, cursor: 'pointer' }} onClick={() => setLightbox('timetable')} />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Tap to enlarge</div>
          </div>
        )}

        {/* Photos gallery */}
        {images.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 10 }}>📸 Photos</div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {images.map((img, i) => (
                  img.url?.endsWith('.mp4') ? <video key={i} src={img.url} muted loop playsInline onClick={() => setLightbox(i)} style={{ flexShrink: 0, width: 140, height: 105, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' }} /> : <img key={i} src={img.url} alt="" onClick={() => setLightbox(i)} style={{ flexShrink: 0, width: 140, height: 105, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{images.length} photos · tap to enlarge</div>
          </div>
        )}

        {/* Videos from listing_images */}
        {images.filter(img => img.url?.endsWith('.mp4')).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 10 }}>🎥 Videos</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {images.filter(img => img.url?.endsWith('.mp4')).map((img, i) => (
                <div key={i} onClick={() => setLightbox(images.indexOf(img))} style={{ flexShrink: 0, width: 140, height: 105, borderRadius: 10, overflow: 'hidden', background: '#000', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video src={img.url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: 16, marginLeft: 3 }}>▶</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Tap to play</div>
          </div>
        )}

        {/* Video */}
        {listing.video_url && listing.video_url.trim() !== '' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 10 }}>🎥 Videos</div>
            <video src={listing.video_url} controls style={{ width: '100%', borderRadius: 12 }} />
          </div>
        )}

        {/* YouTube */}
        {listing.youtube_url && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 10 }}>🎥 Videos</div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
              <iframe src={listing.youtube_url.replace('watch?v=', 'embed/')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
            </div>
          </div>
        )}

        {/* Related listings (cross links) */}
        {relatedListings.length > 0 && (
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            {(() => {
              const t = (listing.type || '').toLowerCase()
              const isSwim = t.includes('swim') || t.includes('aqua') || t.includes('water')
              const isSport = t.includes('sport') || t.includes('football') || t.includes('fitness') || t.includes('gym')
              const isMusic = t.includes('music') || t.includes('sing')
              const isDance = t.includes('dance') || t.includes('ballet')
              const isArt = t.includes('art') || t.includes('craft')
              const emoji = isSwim ? '🏊' : isSport ? '⚽' : isMusic ? '🎵' : isDance ? '💉' : isArt ? '🎨' : '📍'
              const bg = isSwim ? '#EFF6FF' : isSport ? '#F0FDF4' : isMusic ? '#FDF4FF' : isDance ? '#FFF7ED' : isArt ? '#FFF7ED' : '#FDF4FF'
              const color = isSwim ? '#1E40AF' : isSport ? '#15803D' : isMusic ? '#7E22CE' : isDance ? '#9A3412' : isArt ? '#92400E' : '#9D174D'
              return <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 10 }}>{emoji} Also by {listing.suggested_by || 'this organiser'}:</div>
            })()}
            {relatedListings.map((r, i) => (
              <Link key={r.id} href={`/listing/${r.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderTop: i > 0 ? '1px solid #FCE7F3' : 'none', paddingTop: i > 0 ? 10 : 0, paddingBottom: i < relatedListings.length - 1 ? 10 : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{[r.day, r.venue].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span style={{ color: '#9D174D' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Add to My Plans */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 10 }}>📅 Add to My Plans</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {getPlanDays().map(({ label, num, dateStr }) => {
              const planned = plannedDates.includes(dateStr)
              return (
                <div key={dateStr} onClick={() => togglePlan(dateStr)}
                  style={{ flexShrink: 0, textAlign: 'center', background: planned ? '#5B2D6E' : 'white', border: planned ? 'none' : '1px solid #E5E7EB', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', minWidth: 52 }}>
                  <div style={{ fontSize: 11, color: planned ? 'rgba(255,255,255,0.8)' : '#6B7280', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: planned ? 'white' : '#111827' }}>{num}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Been here */}
        <div onClick={toggleVisited} style={{ display: 'flex', alignItems: 'center', gap: 12, background: visited ? '#F0FDF4' : 'white', border: visited ? '1px solid #BBF7D0' : '1.5px dashed #E5E7EB', borderRadius: 14, padding: '14px 16px', marginBottom: 14, cursor: 'pointer' }}>
          <div style={{ fontSize: 24 }}>✅</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: visited ? '#15803D' : '#111827' }}>
              {visited ? 'Been here!' : 'Been here? Tap to mark visited'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Track activities your family has tried</div>
          </div>
        </div>

                {/* CTA buttons */}
        {!listing.cta_url && listing.website && (
          <a href={listing.website} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#5B2D6E', color: 'white', textAlign: 'center', padding: '16px 20px', borderRadius: 16, fontSize: 16, fontWeight: 800, marginBottom: 10, textDecoration: 'none' }}>
            🌐 Visit Website
          </a>
        )}
        {listing.cta_url && (
          <a href={listing.cta_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#5B2D6E', color: 'white', textAlign: 'center', padding: '16px 20px', borderRadius: 16, fontSize: 16, fontWeight: 800, marginBottom: 10, textDecoration: 'none' }}>
            {listing.cta_label || '🎟 Book now'}
          </a>
        )}

        {listing.trial_link && (
          <a href={listing.trial_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#D1FAE5', color: '#065F46', textAlign: 'center', padding: '12px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, border: '1px solid #6EE7B7', marginBottom: 10, textDecoration: 'none' }}>
            🎁 Book a free trial
          </a>
        )}


        {/* Send to a parent */}
        <button onClick={() => navigator.share?.({ title: listing.name, url: window.location.href })}
          style={{ display: 'block', width: '100%', background: 'white', color: '#111827', textAlign: 'center', padding: '12px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, border: '1px solid #E5E7EB', marginBottom: 10, cursor: 'pointer' }}>
          🔗 Send to a parent
        </button>

        {/* WhatsApp */}
        {listing.whatsapp_group_url && (
          <a href={listing.whatsapp_group_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#F0FDF4', color: '#15803D', textAlign: 'center', padding: '12px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, border: '1px solid #BBF7D0', marginBottom: 10, textDecoration: 'none' }}>
            💬 Join WhatsApp Group
          </a>
        )}

        {/* Instagram */}
        {listing.instagram && (
          <a href={listing.instagram.startsWith('http') ? listing.instagram : `https://instagram.com/${listing.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#FDF4FF', color: '#7E22CE', textAlign: 'center', padding: '12px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, border: '1px solid #E9D5FF', marginBottom: 10, textDecoration: 'none' }}>
            📸 View on Instagram
          </a>
        )}

        {/* Share + claim */}
        <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>Share this page with parents</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>⚠️ <a href={`mailto:hello@littlelocals.uk?subject=Report: ${listing.name}`} style={{ color: '#D4732A' }}>Report an issue</a></div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 16, padding: '14px', background: '#F9FAFB', borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Run this activity?</div>
            <div>Claim this listing to update photos and info</div>
          </div>
        </div>

      </div>
      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: 20, cursor: 'pointer', zIndex: 1001 }}>✕</button>
          {lightbox === 'timetable' ? (
            <img src={listing.timetable_image} alt="Timetable" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url?.endsWith('.mp4') ? <video src={images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url} controls autoPlay style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 8 }} onClick={e => e.stopPropagation()} /> : <img src={images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />}
            </div>
          )}
          {typeof lightbox === 'number' && images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {images.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setLightbox(i) }} style={{ width: i === lightbox ? 16 : 8, height: 8, borderRadius: 4, background: i === lightbox ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
              ))}
            </div>
          )}
        </div>
      )}


      <BottomNav />
    </div>
  )
}
