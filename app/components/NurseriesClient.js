'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

const PURPLE = '#5B2D6E'
const ORANGE = '#D4732A'

const OFSTED_CONFIG = {
  outstanding:          { label: 'Outstanding',           bg: '#16A34A', emoji: '🏆', rank: 5 },
  good:                 { label: 'Good',                  bg: '#2563EB', emoji: '✅', rank: 4 },
  requires_improvement: { label: 'Requires improvement',  bg: '#D97706', emoji: '⚠️', rank: 3 },
  inadequate:           { label: 'Inadequate',            bg: '#DC2626', emoji: '🚨', rank: 2 },
  not_yet_inspected:    { label: 'Not yet inspected',     bg: '#6B7280', emoji: '🕓', rank: 1 },
}

const FUNDED_LABELS = {
  '15h_universal': '15h universal',
  '30h_working':   '30h working',
  '15h_2yo':       '15h 2-yr-olds',
  'tax_free':      'Tax-Free Childcare',
}

const FUNDED_FILTERS = [
  ['15h_universal', '15h universal'],
  ['30h_working',   '30h working'],
  ['15h_2yo',       '15h for 2-yr-olds'],
  ['tax_free',      'Tax-Free Childcare'],
]

const AGE_BUCKETS = [
  ['0-2', '0–2 (babies)',    0, 2],
  ['2-3', '2–3 (toddlers)',  2, 3],
  ['3-4', '3–4 (pre-school)', 3, 4],
]

export default function NurseriesClient({ nurseries }) {
  const [search, setSearch] = useState('')
  const [ofstedFilter, setOfstedFilter] = useState('all')  // 'all' | 'good_or_better' | 'outstanding_only'
  const [fundedFilter, setFundedFilter] = useState([])
  const [ageFilter, setAgeFilter] = useState(null)         // null | '0-2' | '2-3' | '3-4'
  const [sort, setSort] = useState('recommended')          // 'recommended' | 'ofsted' | 'newest'

  const toggleFunded = (key) => {
    setFundedFilter(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const filtered = useMemo(() => {
    let list = nurseries.slice()

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(n =>
        (n.name || '').toLowerCase().includes(q) ||
        (n.location || '').toLowerCase().includes(q) ||
        (n.venue || '').toLowerCase().includes(q)
      )
    }

    if (ofstedFilter === 'good_or_better') {
      list = list.filter(n => n.ofsted_rating === 'outstanding' || n.ofsted_rating === 'good')
    } else if (ofstedFilter === 'outstanding_only') {
      list = list.filter(n => n.ofsted_rating === 'outstanding')
    }

    if (fundedFilter.length > 0) {
      list = list.filter(n => {
        const accepts = Array.isArray(n.funded_hours) ? n.funded_hours : []
        return fundedFilter.every(f => accepts.includes(f))
      })
    }

    if (ageFilter) {
      const bucket = AGE_BUCKETS.find(b => b[0] === ageFilter)
      if (bucket) {
        const [, , bMin, bMax] = bucket
        list = list.filter(n => {
          const min = n.age_min ?? 0
          const max = n.age_max ?? 99
          return min <= bMax && max >= bMin
        })
      }
    }

    if (sort === 'ofsted') {
      list.sort((a, b) => {
        const ra = OFSTED_CONFIG[a.ofsted_rating]?.rank ?? 0
        const rb = OFSTED_CONFIG[b.ofsted_rating]?.rank ?? 0
        return rb - ra
      })
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }

    return list
  }, [nurseries, search, ofstedFilter, fundedFilter, ageFilter, sort])

  const totalCount = nurseries.length
  const filteredCount = filtered.length
  const hasFilters = search.trim() || ofstedFilter !== 'all' || fundedFilter.length > 0 || ageFilter

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 60, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F9FAFB', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ padding: '24px 20px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
          🧸 Nurseries
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: -0.5, lineHeight: 1.15 }}>
          Ofsted-rated nurseries in Ealing and West London
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 12px', lineHeight: 1.5 }}>
          Filter by Ofsted rating, funded hours your child is entitled to, and age group.
          {totalCount > 0 && <> <strong style={{ color: '#374151' }}>{totalCount} settings listed.</strong></>}
        </p>
        <a href="https://www.childcarechoices.gov.uk/" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', fontSize: 12, color: PURPLE, textDecoration: 'underline', fontWeight: 700 }}>
          Not sure what funded hours you're entitled to? →
        </a>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 16px 8px' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name or area..."
          style={{ width: '100%', fontSize: 14, padding: '12px 14px', borderRadius: 24, border: '1px solid #E5E7EB', boxSizing: 'border-box', outline: 'none', background: 'white' }}
        />
      </div>

      {/* Filters */}
      <div style={{ padding: '4px 16px 16px' }}>
        {/* Ofsted */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Ofsted</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              ['all', 'All ratings'],
              ['good_or_better', 'Good or better'],
              ['outstanding_only', 'Outstanding only'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setOfstedFilter(key)}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '7px 13px', borderRadius: 18,
                  border: `1px solid ${ofstedFilter === key ? PURPLE : '#E5E7EB'}`,
                  background: ofstedFilter === key ? PURPLE : 'white',
                  color: ofstedFilter === key ? 'white' : '#374151',
                  cursor: 'pointer',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Funded hours */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Funded hours accepted</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FUNDED_FILTERS.map(([key, label]) => (
              <button key={key} onClick={() => toggleFunded(key)}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '7px 13px', borderRadius: 18,
                  border: `1px solid ${fundedFilter.includes(key) ? PURPLE : '#E5E7EB'}`,
                  background: fundedFilter.includes(key) ? '#F3E8FF' : 'white',
                  color: fundedFilter.includes(key) ? PURPLE : '#374151',
                  cursor: 'pointer',
                }}>
                {fundedFilter.includes(key) && '✓ '}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Age</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setAgeFilter(null)}
              style={{
                fontSize: 12, fontWeight: 700, padding: '7px 13px', borderRadius: 18,
                border: `1px solid ${ageFilter === null ? PURPLE : '#E5E7EB'}`,
                background: ageFilter === null ? PURPLE : 'white',
                color: ageFilter === null ? 'white' : '#374151',
                cursor: 'pointer',
              }}>
              Any age
            </button>
            {AGE_BUCKETS.map(([key, label]) => (
              <button key={key} onClick={() => setAgeFilter(ageFilter === key ? null : key)}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '7px 13px', borderRadius: 18,
                  border: `1px solid ${ageFilter === key ? PURPLE : '#E5E7EB'}`,
                  background: ageFilter === key ? PURPLE : 'white',
                  color: ageFilter === key ? 'white' : '#374151',
                  cursor: 'pointer',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort + result count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {hasFilters
              ? <><strong style={{ color: '#111827' }}>{filteredCount}</strong> of {totalCount} matching</>
              : <><strong style={{ color: '#111827' }}>{totalCount}</strong> nurseries</>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>Sort:</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ fontSize: 12, padding: '5px 8px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', outline: 'none' }}>
              <option value="recommended">⭐ Recommended</option>
              <option value="ofsted">🏆 Ofsted rating</option>
              <option value="newest">🆕 Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 14, padding: '32px 20px', textAlign: 'center', border: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🤷</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>No nurseries match your filters</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>Try widening Ofsted rating or removing some funded-hours filters.</div>
          </div>
        ) : (
          filtered.map(n => <NurseryCard key={n.id} n={n} />)
        )}
      </div>

      {/* Empty-supply CTA */}
      <div style={{ margin: '24px 16px 0', padding: '18px 16px', background: '#FAF8FF', borderRadius: 16, border: '1px solid #E9D5FF', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Run a nursery?</div>
        <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 12, lineHeight: 1.5 }}>
          List your nursery on LITTLElocals free of charge — Ofsted-aware listing, parent enquiries direct to you.
        </div>
        <a href="/for-providers" style={{ display: 'inline-block', background: PURPLE, color: 'white', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 20, textDecoration: 'none' }}>
          List my nursery →
        </a>
      </div>

      {/* Footer */}
      <div style={{ padding: '32px 20px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['Home','/'],['For providers','/for-providers'],['Privacy','/privacy'],['Terms','/terms']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'underline' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#D1D5DB' }}>© 2026 LITTLElocals</div>
      </div>
    </div>
  )
}

function NurseryCard({ n }) {
  const ofsted = OFSTED_CONFIG[n.ofsted_rating]
  const inspectionDate = n.ofsted_inspection_date
    ? new Date(n.ofsted_inspection_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null
  const hours = n.opens_at && n.closes_at ? `${n.opens_at} – ${n.closes_at}` : null
  const fundedList = Array.isArray(n.funded_hours) ? n.funded_hours : []
  const img = n.primary_image || n.logo

  return (
    <Link href={`/listing/${n.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F3F4F6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {img && (
          <div style={{ width: '100%', aspectRatio: '16/8', background: '#F3F4F6', overflow: 'hidden' }}>
            <img src={img} alt={n.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ padding: '14px 16px 16px' }}>
          {/* Name + verified */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{n.name}</div>
            {n.verified && <span title="Verified provider" style={{ fontSize: 14, flexShrink: 0 }}>✓</span>}
          </div>

          {/* Ofsted + location row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {ofsted && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: ofsted.bg, color: 'white', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 14 }}>
                {ofsted.emoji} {ofsted.label}{inspectionDate ? ` · ${inspectionDate}` : ''}
              </span>
            )}
            {(n.location || n.venue) && (
              <span style={{ fontSize: 12, color: '#6B7280' }}>📍 {n.location || n.venue}</span>
            )}
          </div>

          {/* Hours + fee */}
          {(hours || n.nursery_fee) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              {hours && <span style={{ fontSize: 13, color: '#374151' }}>🕐 {hours}{n.term_time_only ? ' · term time only' : ''}</span>}
              {n.nursery_fee && <span style={{ fontSize: 13, color: '#374151' }}>💷 {n.nursery_fee}</span>}
            </div>
          )}

          {/* Funded pills */}
          {fundedList.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              {fundedList.map(key => FUNDED_LABELS[key] && (
                <span key={key} style={{ display: 'inline-block', background: '#F3E8FF', color: PURPLE, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12 }}>
                  ✓ {FUNDED_LABELS[key]}
                </span>
              ))}
            </div>
          )}

          {/* Waitlist */}
          {n.waitlist_status && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#92400E', marginTop: 2 }}>
              🪑 {n.waitlist_status}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
