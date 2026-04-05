'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat']

function isOnToday(l) {
  if (l.is_daily) return true
  if (!l.days_of_week || l.days_of_week.length === 0) return true
  const today = DAY_NAMES[new Date().getDay()]
  return (l.days_of_week || []).includes(today)
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function formatDistance(km, mode) {
  const mins = Math.round(km / (mode === 'walk' ? 0.08 : 0.5))
  return mins <= 1 ? 'Nearby' : `${mins} min ${mode}`
}

function isOnWeekend(l) {
  const days = l.days_of_week || []
  return days.includes('sat') || days.includes('sun') || l.is_daily
}

function isNewlyAdded(l) {
  if (!l.created_at) return false
  const daysSince = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince < 14
}

function isMorningSessions(l) {
  const t = (l.time || '').toLowerCase()
  return t.includes('am') || t.includes('morning') || t.includes('9:') || t.includes('10:') || t.includes('11:')
}

function getDecisionBadge(listing, isFree, onToday, recentViews) {
  const DAY = DAY_NAMES[new Date().getDay()]
  const isWeekend = isOnWeekend(listing)
  const isNew = isNewlyAdded(listing)
  const ages = (listing.ages || '').toLowerCase()
  const isBaby = ages.includes('0') || ages.includes('baby') || ages.includes('bab')
  const isToddler = ages.includes('toddler') || ages.includes('1') || ages.includes('2')
  const isIndoor = listing.indoor
  const isOutdoor = !listing.indoor && listing.indoor !== null
  const worthJourney = listing.worth_journey

  // Priority order
  if (onToday && isFree) return { label: 'Happening today', icon: '📅', bg: '#FFF7ED', color: '#9A3412' }
  if (onToday) return { label: 'Happening today', icon: '📅', bg: '#FFF7ED', color: '#9A3412' }
  if (isFree) return { label: 'Free', icon: '💰', bg: '#D1FAE5', color: '#065F46' }
  if (isWeekend) return { label: 'This weekend', icon: '🎟', bg: '#EDE9FE', color: '#5B21B6' }
  if (isIndoor) return { label: 'Indoor idea', icon: '🌧️', bg: '#EFF6FF', color: '#1E40AF' }
  if (isOutdoor) return { label: 'Outdoor pick', icon: '🌳', bg: '#F0FDF4', color: '#15803D' }
  if (isBaby) return { label: 'Baby-friendly', icon: '🚼', bg: '#FDF4FF', color: '#7E22CE' }
  if (isToddler) return { label: 'Great for toddlers', icon: '🧒', bg: '#FFF7ED', color: '#C2410C' }
  if (isNew) return { label: 'Just added', icon: '🆕', bg: '#F0FDF4', color: '#15803D' }
  if (worthJourney) return { label: 'Worth the short trip', icon: '📍', bg: '#FFF7ED', color: '#9A3412' }
  // Social proof fallback - rotate based on listing id to avoid repetition
  const fallbacks = [
    { label: 'Popular with parents', icon: '⭐', bg: '#FEF3C7', color: '#92400E' },
    { label: 'Loved locally', icon: '✨', bg: '#FEF9C3', color: '#713F12' },
    { label: 'Parents are saving this', icon: '📌', bg: '#FFF7ED', color: '#9A3412' },
    { label: 'Parents viewed this today', icon: '👀', bg: '#F0F9FF', color: '#0369A1' },
  ]
  return fallbacks[(listing.id || 0) % fallbacks.length]
}

function getTrustBadge(listing) {
  if (listing.is_local_favourite) return { label: 'Local favourite', icon: '💜' }
  if (listing.is_featured) return { label: 'Featured this week', icon: '⭐' }
  if (listing.verified) return { label: 'Verified provider', icon: '✔' }
  return null
}

export default function ListingCard({ listing, userLocation, recentViews = 0 }) {
  const [saved, setSaved] = useState(false)
  const isFree = listing.free || (listing.price || '').toLowerCase().includes('free')
  const onToday = isOnToday(listing)

  const dayLabel = (() => {
    if (listing.is_daily) return 'Daily'
    if (!listing.days_of_week || listing.days_of_week.length === 0) return listing.day || null
    const map = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }
    return listing.days_of_week.map(d => map[d] || d).join(' & ')
  })()

  const distance = (() => {
    if (!userLocation || !listing.lat || !listing.lng) return null
    const km = getDistanceKm(userLocation.lat, userLocation.lng, listing.lat, listing.lng)
    const mode = km < 1.5 ? 'walk' : 'drive'
    return formatDistance(km, mode)
  })()

  const card = (
    <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6', cursor: listing.slug ? 'pointer' : 'default' }}>
      {listing.image && (
        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <img src={listing.image} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {onToday && (
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#111827', boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }}>
              <span>📅</span><span>Today</span>
            </div>
          )}
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); setSaved(s => !s); navigator.vibrate && navigator.vibrate(50) }}
            style={{ position: 'absolute', top: 10, right: 10, background: saved ? '#5B2D6E' : 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.12)', transition: 'background 0.2s' }}>
            <span style={{ color: saved ? 'white' : 'inherit' }}>{saved ? '♥' : '🤍'}</span>
          </button>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            <div style={{ width: 16, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.9)' }} />
            <div style={{ width: 6, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.5)' }} />
            <div style={{ width: 6, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.5)' }} />
          </div>
          {listing.logo && (
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '4px 8px' }}>
              <img src={listing.logo} alt="" style={{ height: 22, width: 'auto', borderRadius: 4 }} />
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            {listing.name}
            {listing.verified && <img src="/verified-badge.svg" width={16} height={16} style={{ verticalAlign: 'middle', flexShrink: 0 }} alt="Verified" />}
          </div>
          {(listing.price || isFree) && (
            <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 8, background: isFree ? '#D1FAE5' : '#FFF7ED', color: isFree ? '#065F46' : '#9A3412', whiteSpace: 'nowrap' }}>
              {isFree ? 'Free' : listing.price}
            </div>
          )}
        </div>
        {dayLabel && <div style={{ fontSize: 13, fontWeight: 600, color: '#D4732A', marginBottom: 3 }}>📅 {dayLabel}</div>}
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: listing.description ? 5 : 6 }}>
          {listing.type}{listing.ages ? ' · ' + listing.ages : ''}
        </div>
        {listing.description && (
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {listing.description}
          </div>
        )}
        {(() => {
          const trustBadge = getTrustBadge(listing)
          const decisionBadge = getDecisionBadge(listing, isFree, onToday, recentViews)
          const showThree = (listing.is_local_favourite || listing.is_featured) && onToday && isFree
          return (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {trustBadge && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#5B2D6E', background: '#F3E8FF', border: '1px solid #D8B4FE', borderRadius: 20, padding: '3px 10px' }}>
                  {trustBadge.icon} {trustBadge.label}
                </span>
              )}
              {decisionBadge && (
                <span style={{ fontSize: 12, fontWeight: 600, color: decisionBadge.color, background: decisionBadge.bg, borderRadius: 20, padding: '3px 10px' }}>
                  {decisionBadge.icon} {decisionBadge.label}
                </span>
              )}
              {showThree && !isFree && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46', background: '#D1FAE5', borderRadius: 20, padding: '3px 10px' }}>
                  💰 Free
                </span>
              )}
              {listing.free_trial && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46', background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 20, padding: '3px 10px' }}>
                  🎁 Free trial
                </span>
              )}
            </div>
          )
        })()}
        {distance && (
          <div style={{ fontSize: 12, color: '#6B7280' }}>📍 {distance}</div>
        )}
      </div>
    </div>
  )

  if (!listing.slug) return card
  return <Link href={`/listing/${listing.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{card}</Link>
}
