'use client'
import { useState } from 'react'
import Link from 'next/link'

const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat']

export default function ListingDetailClient({ listing, images, relatedListings }) {
  const [saved, setSaved] = useState(false)
  const [visited, setVisited] = useState(false)
  const [plannedDates, setPlannedDates] = useState([])

  useEffect(() => {
    const v = localStorage.getItem('visited_' + listing.id)
    if (v) setVisited(true)
    const p = localStorage.getItem('plans_' + listing.id)
    if (p) setPlannedDates(JSON.parse(p))
  }, [listing.id])

  const toggleVisited = () => {
    if (visited) {
      localStorage.removeItem('visited_' + listing.id)
      setVisited(false)
    } else {
      localStorage.setItem('visited_' + listing.id, '1')
      setVisited(true)
    }
  }

  const togglePlan = (dateStr) => {
    const next = plannedDates.includes(dateStr)
      ? plannedDates.filter(d => d !== dateStr)
      : [...plannedDates, dateStr]
    setPlannedDates(next)
    localStorage.setItem('plans_' + listing.id, JSON.stringify(next))
  }

  const [imgIdx, setImgIdx] = useState(0)

  const getPlanDays = () => {
    const days = []
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const shortNames = ['Today','Tmrw']
    for (let i = 0; i < 10; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const label = i < 2 ? shortNames[i] : dayNames[d.getDay()]
      const dateStr = d.toISOString().split('T')[0]
      days.push({ label, num: d.getDate(), dateStr })
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

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100, fontFamily: 'system-ui, sans-serif' }}>

      {/* Back + actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', position: 'sticky', top: 56, background: 'rgba(249,250,251,0.95)', backdropFilter: 'blur(8px)', zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#111827', textDecoration: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20, padding: '6px 14px' }}>
          ← Back
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSaved(s => !s)} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
            {saved ? '❤️' : '🤍'}
          </button>
          {listing.whatsapp && (
            <a href={`https://wa.me/${listing.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none' }}>💬</a>
          )}
        </div>
      </div>

      {/* Image carousel */}
      {images.length > 0 && (
        <div style={{ position: 'relative', height: 280, overflow: 'hidden', background: '#F3F4F6' }}>
          <img src={images[imgIdx]?.url} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => Math.max(0, i-1))} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>‹</button>
              <button onClick={() => setImgIdx(i => Math.min(images.length-1, i+1))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>›</button>
              <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                {images.map((_, i) => (
                  <div key={i} onClick={() => setImgIdx(i)} style={{ width: i === imgIdx ? 16 : 6, height: 6, borderRadius: 3, background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'width 0.2s' }} />
                ))}
              </div>
              <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 11, padding: '2px 7px', borderRadius: 10 }}>{imgIdx+1}/{images.length}</div>
            </>
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

        {/* Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          {listing.logo && <img src={listing.logo} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', background: 'white', border: '1px solid #F3F4F6', flexShrink: 0 }} />}
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.2 }}>
            {listing.name}
          </h1>
        </div>

        {listing.location && <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>{listing.location}</div>}

        {/* Verified + today badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {listing.verified && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '4px 12px', borderRadius: 20 }}>
              <img src="/verified-badge.svg" width={14} height={14} alt="" /> Verified
            </span>
          )}
          {onToday && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#D4732A', background: '#FFF7ED', border: '1px solid #FED7AA', padding: '4px 12px', borderRadius: 20 }}>📅 On today</span>}
        </div>

        {/* Verified banner */}
        {listing.verified && (
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

        {/* Photos gallery */}
        {images.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 10 }}>📸 Photos</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {images.map((img, i) => (
                <img key={i} src={img.url} alt="" onClick={() => setImgIdx(i)} style={{ flexShrink: 0, width: 120, height: 90, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: i === imgIdx ? '2px solid #5B2D6E' : 'none' }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{images.length} photos</div>
          </div>
        )}

        {/* Video */}
        {listing.video_url && (
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
          <div style={{ background: '#FFF0F9', border: '1px solid #FCE7F3', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#9D174D', marginBottom: 10 }}>🌸 Also by {listing.suggested_by || 'this organiser'}:</div>
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
          <div style={{ fontSize: 24 }}>{visited ? '✅' : '✅'}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: visited ? '#15803D' : '#111827' }}>
              {visited ? 'Been here!' : 'Been here? Tap to mark visited'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Track activities your family has tried</div>
          </div>
        </div>

        {/* CTA buttons */}
        {listing.cta_url && (
          <a href={listing.cta_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#5B2D6E', color: 'white', textAlign: 'center', padding: '16px 20px', borderRadius: 16, fontSize: 16, fontWeight: 800, marginBottom: 10, textDecoration: 'none' }}>
            {listing.cta_label || '🎟 Book now'}
          </a>
        )}

        {listing.website && (
          <a href={listing.website} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: 'white', color: '#5B2D6E', textAlign: 'center', padding: '14px 20px', borderRadius: 16, fontSize: 15, fontWeight: 700, border: '2px solid #5B2D6E', marginBottom: 10, textDecoration: 'none' }}>
            🌐 Visit Website
          </a>
        )}

        {/* Send to a parent */}
        <button onClick={() => navigator.share?.({ title: listing.name, url: window.location.href })}
          style={{ display: 'block', width: '100%', background: 'white', color: '#111827', textAlign: 'center', padding: '12px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, border: '1px solid #E5E7EB', marginBottom: 10, cursor: 'pointer' }}>
          📤 Send to a parent
        </button>

        {/* WhatsApp */}
        {listing.whatsapp && (
          <a href={`https://chat.whatsapp.com/${listing.whatsapp}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#F0FDF4', color: '#15803D', textAlign: 'center', padding: '12px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, border: '1px solid #BBF7D0', marginBottom: 10, textDecoration: 'none' }}>
            💬 Join WhatsApp Group
          </a>
        )}

        {/* Instagram */}
        {listing.instagram && (
          <a href={`https://instagram.com/${listing.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
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
    </div>
  )
}
