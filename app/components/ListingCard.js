'use client'
import Link from 'next/link'
import { useState } from 'react'

const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat']

function isOnToday(l) {
  if (l.is_daily) return true
  if (!l.days_of_week || l.days_of_week.length === 0) return true
  const today = DAY_NAMES[new Date().getDay()]
  return (l.days_of_week || []).includes(today)
}

export default function ListingCard({ listing }) {
  const [saved, setSaved] = useState(false)
  const isFree = listing.free || (listing.price || '').toLowerCase().includes('free')
  const onToday = isOnToday(listing)

  const dayLabel = (() => {
    if (listing.is_daily) return 'Daily'
    if (!listing.days_of_week || listing.days_of_week.length === 0) return listing.day || null
    const map = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }
    return listing.days_of_week.map(d => map[d] || d).join(' & ')
  })()

  const card = (
    <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6', cursor: listing.slug ? 'pointer' : 'default' }}>

      {/* Image with overlays */}
      {listing.image && (
        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <img src={listing.image} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

          {/* Today badge */}
          {onToday && (
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#111827', boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }}>
              <span>📅</span><span>Today</span>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setSaved(s => !s) }}
            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }}>
            {saved ? '❤️' : '🤍'}
          </button>

          {/* Logo overlay */}
          {listing.logo && (
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={listing.logo} alt="" style={{ height: 22, width: 'auto', borderRadius: 4 }} />
            </div>
          )}
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: '12px 14px 14px' }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            {listing.name}
            {listing.verified && (
              <img src="/verified-badge.svg" width={16} height={16} style={{ verticalAlign: 'middle', flexShrink: 0 }} alt="Verified" />
            )}
          </div>
          {(listing.price || isFree) && (
            <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 8, background: isFree ? '#D1FAE5' : '#FFF7ED', color: isFree ? '#065F46' : '#9A3412', whiteSpace: 'nowrap' }}>
              {isFree ? 'Free' : listing.price}
            </div>
          )}
        </div>

        {/* Day */}
        {dayLabel && (
          <div style={{ fontSize: 13, fontWeight: 600, color: '#D4732A', marginBottom: 3 }}>📅 {dayLabel}</div>
        )}

        {/* Type · Ages */}
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
          {listing.type}{listing.ages ? ' · ' + listing.ages : ''}
        </div>

        {/* Social proof pills */}
        {(listing.popular || listing.worth_journey) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {listing.popular && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 20, padding: '3px 10px' }}>
                ⭐ Popular with Ealing parents this week
              </span>
            )}
            {listing.worth_journey && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '3px 10px' }}>
                🚗 Worth the journey
              </span>
            )}
          </div>
        )}


      </div>
    </div>
  )

  if (!listing.slug) return card
  return <Link href={`/listing/${listing.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{card}</Link>
}
