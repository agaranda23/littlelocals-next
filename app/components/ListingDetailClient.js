'use client'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat']

export default function ListingDetailClient({ listing, images, relatedListings }) {
  const [saved, setSaved] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [claimName, setClaimName] = useState('')
  const [claimEmail, setClaimEmail] = useState('')
  const [claimPhone, setClaimPhone] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimSubmitted, setClaimSubmitted] = useState(false)

  const [visited, setVisited] = useState(false)
  const [plannedDates, setPlannedDates] = useState([])
  const [detailSignal, setDetailSignal] = useState(null)

  // Track recently viewed
  useEffect(() => {
    try {
      const rv = JSON.parse(localStorage.getItem('ll_recentlyViewed') || '[]')
      const filtered = rv.filter(r => r.id !== listing.id)
      const updated = [{ id: listing.id, name: listing.name, image: images?.[0]?.url || null }, ...filtered].slice(0, 20)
      localStorage.setItem('ll_recentlyViewed', JSON.stringify(updated))
    } catch(e) {}
  }, [listing.id])

  // Contextual social proof signal (verified only)
  useEffect(() => {
    if (!listing.verified) return
    try {
      const saved = JSON.parse(localStorage.getItem('ll_favs') || '[]')
      if (saved.includes(listing.id)) {
        setDetailSignal('💜 You saved this activity')
        return
      }
      if (listing.is_local_favourite) {
        setDetailSignal('⭐ Popular with local parents this week')
        return
      }
      const today = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()]
      const isOnToday = listing.is_daily || !listing.days_of_week || listing.days_of_week.length === 0 || (listing.days_of_week || []).includes(today)
      if (isOnToday) {
        setDetailSignal('⏰ Families are heading to this today')
        return
      }
      const isOnWeekend = listing.is_daily || (listing.days_of_week || []).some(d => ['sat','sun'].includes(d))
      if (isOnWeekend) {
        setDetailSignal('📅 Parents are planning this weekend')
        return
      }
      setDetailSignal('💜 Saved by Ealing parents')
    } catch(e) {
      setDetailSignal('💜 Saved by Ealing parents')
    }
  }, [listing])

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

  useEffect(() => {
    if (!listing?.id) return
    supabase
      .from('reviews')
      .select('id, reviewer_name, rating, review_text, created_at')
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data) })
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
        { img: '/home-nav-unselected.png', label: 'Home', href: '/' },
        { img: '/today-nav-unselected.png', label: 'Today', href: '/?day=today' },
        { img: '/explore-nav-unselected.png', label: 'Explore', href: '/' },
        { img: '/myplans-nav-unselected.png', label: 'My Plans', href: '/?plans=1' },
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
          {reviews.length > 0 && (() => {
            const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
            return (
              <a href="#reviews" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>⭐ {avg}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </a>
            )
          })()}
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
        {(() => {
          if (!listing.created_at) return null
          const days = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24)
          if (days <= 7) return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '6px 14px', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#15803D' }}>🆕 New this week in Ealing</div>
          if (days <= 30) return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '6px 14px', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>✨ Added this month</div>
          return null
        })()}

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

        {/* Social proof signal - verified only */}
        {detailSignal && (
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, marginBottom: 12 }}>
            {detailSignal}
          </div>
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
              const allNames = relatedListings.map(r => (r.name || '').toLowerCase()).join(' ')
              const allTypes = relatedListings.map(r => (r.type || '').toLowerCase()).join(' ')
              const combined = allNames + ' ' + allTypes + ' ' + (listing.name || '').toLowerCase() + ' ' + (listing.type || '').toLowerCase()
              const emoji = combined.includes('little kicker') || combined.includes('football') || combined.includes('soccer') ? '⚽'
                : combined.includes('swim') || combined.includes('aqua') || combined.includes('water bab') ? '🏊'
                : combined.includes('rosie') || combined.includes('movemama') ? '🌸'
                : combined.includes('hartbeep') ? '🎪'
                : combined.includes('dance') || combined.includes('ballet') ? '💃'
                : combined.includes('music') || combined.includes('sing') ? '🎵'
                : combined.includes('art') || combined.includes('craft') || combined.includes('paint') ? '🎨'
                : combined.includes('cook') || combined.includes('bak') ? '🍳'
                : combined.includes('yoga') || combined.includes('pilates') || combined.includes('fitness') ? '💪'
                : combined.includes('park') || combined.includes('nature') || combined.includes('outdoor') || combined.includes('woodland') || combined.includes('walk') ? '🌳'
                : combined.includes('playground') ? '🛝'
                : combined.includes('playgroup') || combined.includes('nursery') ? '🧸'
                : combined.includes('baby') || combined.includes('sensory') ? '👶'
                : '📍'
              const color = '#9D174D'
              const isVenueBased = combined.includes('park') || combined.includes('manor') || combined.includes('centre') || combined.includes('woodland') || combined.includes('garden') || combined.includes('playground') || (listing.type || '').toLowerCase().includes('nature') || (listing.type || '').toLowerCase().includes('outdoor') || (listing.type || '').toLowerCase().includes('playground')
              const label = isVenueBased ? 'Also at this venue:' : `Also by ${listing.suggested_by || 'this organiser'}:`
              return <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 10 }}>{emoji} {label}</div>
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
        <button onClick={() => {
            if (navigator.share) {
              navigator.share({ title: listing.name, text: 'Check out ' + listing.name + ' on LittleLocals!', url: window.location.href })
            } else {
              window.open('https://wa.me/?text=' + encodeURIComponent('Check out ' + listing.name + ' on LittleLocals! ' + window.location.href), '_blank')
            }
          }}
          style={{ display: 'block', width: '100%', background: '#25D366', color: 'white', textAlign: 'center', padding: '12px 20px', borderRadius: 16, fontSize: 14, fontWeight: 700, border: 'none', marginBottom: 10, cursor: 'pointer' }}>
          💬 Share with a parent
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
          {claimSubmitted ? (
            <div style={{ marginTop: 16, padding: '14px', background: '#D1FAE5', borderRadius: 12, border: '1px solid #6EE7B7', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>✅ Request received!</div>
              <div style={{ fontSize: 13, color: '#065F46', marginTop: 4 }}>We'll be in touch within 24 hours.</div>
            </div>
          ) : !showClaimForm ? (
            <div onClick={() => setShowClaimForm(true)}
              style={{ display: 'block', marginTop: 16, padding: '14px', background: '#F5F3FF', borderRadius: 12, border: '1px solid #DDD6FE', cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#5B2D6E', fontSize: 14 }}>🙋 Run this activity?</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>Claim this listing to update your photos, timetable and info — free forever.</div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#5B2D6E' }}>Claim your listing →</div>
            </div>
          ) : (
            <div style={{ marginTop: 16, padding: '14px', background: '#F5F3FF', borderRadius: 12, border: '1px solid #DDD6FE' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: '#5B2D6E', fontSize: 14 }}>🙋 Claim {listing.name}</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Your name *</div>
                <input value={claimName} onChange={e => setClaimName(e.target.value)} placeholder="e.g. Sarah Jones"
                  style={{ width: '100%', fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Email address *</div>
                <input value={claimEmail} onChange={e => setClaimEmail(e.target.value)} placeholder="e.g. sarah@myclass.co.uk" type="email"
                  style={{ width: '100%', fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Phone <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></div>
                <input value={claimPhone} onChange={e => setClaimPhone(e.target.value)} placeholder="e.g. 07700 900000" type="tel"
                  style={{ width: '100%', fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Anything to add? <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></div>
                <textarea value={claimMessage} onChange={e => setClaimMessage(e.target.value)} placeholder="Tell us a bit about your business..." rows={3}
                  style={{ width: '100%', fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box', resize: 'none', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    if (!claimName.trim() || !claimEmail.trim()) return
                    setClaimSubmitting(true)
                    await supabase.from('claim_requests').insert([{
                      listing_id: listing.id,
                      name: claimName.trim(),
                      email: claimEmail.trim(),
                      phone: claimPhone.trim() || null,
                      message: claimMessage.trim() || null
                    }])
                    setClaimSubmitted(true)
                    setClaimSubmitting(false)
                  }}
                  disabled={claimSubmitting || !claimName.trim() || !claimEmail.trim()}
                  style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'white', background: claimSubmitting ? '#9CA3AF' : '#5B2D6E', border: 'none', borderRadius: 20, padding: '10px 0', cursor: claimSubmitting ? 'default' : 'pointer' }}>
                  {claimSubmitting ? 'Sending…' : 'Submit claim'}
                </button>
                <button onClick={() => setShowClaimForm(false)}
                  style={{ fontSize: 13, color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: 20, padding: '10px 14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Reviews */}
      <div id="reviews" style={{ margin: '0 16px 24px', fontFamily: 'sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {reviews.length > 0 ? (() => {
              const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
              return <>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>⭐ {avg}</span>
                <span style={{ fontSize: 14, color: '#6B7280' }}>· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </>
            })() : <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Reviews</span>}
          </div>
          {!showForm && !reviewSubmitted && (
            <button onClick={() => setShowForm(true)} style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', background: '#F3E8FF', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer' }}>
              ✍️ Write a review
            </button>
          )}
        </div>

        {/* Thank you message */}
        {reviewSubmitted && (
          <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#065F46' }}>
            ✅ Thanks! Your review has been submitted.
          </div>
        )}

        {/* Review form */}
        {showForm && !reviewSubmitted && (
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px', border: '1px solid #E5E7EB', marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Your name</div>
              <input
                value={reviewName}
                onChange={e => setReviewName(e.target.value)}
                placeholder="e.g. Sarah"
                style={{ width: '100%', fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rating</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', opacity: n <= reviewRating ? 1 : 0.3, padding: 0 }}>⭐</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Your review</div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="What did you think?"
                rows={3}
                style={{ width: '100%', fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box', resize: 'none', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={async () => {
                  if (!reviewName.trim() || !reviewText.trim()) return
                  setReviewSubmitting(true)
                  const newReview = { listing_id: listing.id, reviewer_name: reviewName.trim(), rating: reviewRating, review_text: reviewText.trim() }
                  const { data } = await supabase.from('reviews').insert([newReview]).select().single()
                  if (data) setReviews(prev => [data, ...prev])
                  else setReviews(prev => [{ id: Date.now(), ...newReview }, ...prev])
                  setReviewSubmitted(true)
                  setShowForm(false)
                  setReviewSubmitting(false)
                }}
                disabled={reviewSubmitting || !reviewName.trim() || !reviewText.trim()}
                style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'white', background: reviewSubmitting ? '#9CA3AF' : '#5B2D6E', border: 'none', borderRadius: 20, padding: '9px 0', cursor: reviewSubmitting ? 'default' : 'pointer' }}
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit review'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: 20, padding: '9px 14px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Review cards */}
        {reviews.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{'⭐'.repeat(r.rating)}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{r.reviewer_name}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{r.review_text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {reviews.length === 0 && !showForm && (
          <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>No reviews yet — be the first!</div>
        )}
      </div>
      {/* Lightbox */}
      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: 20, cursor: 'pointer', zIndex: 1001 }}>✕</button>
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
