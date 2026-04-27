'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)


function getCompleteness(listing, imageCount) {
  const checks = [
    { label: 'At least 1 photo', done: imageCount >= 1, points: 15 },
    { label: '3+ photos', done: imageCount >= 3, points: 20 },
    { label: 'Logo uploaded', done: !!listing.logo, points: 10 },
    { label: 'Description', done: !!listing.description, points: 15 },
    { label: 'Website link', done: !!listing.website, points: 10 },
    { label: 'Booking / trial info', done: !!listing.free_trial, points: 10 },
    { label: 'Instagram', done: !!listing.instagram, points: 5 },
    { label: 'WhatsApp group', done: !!listing.whatsapp_group_url, points: 5 },
  ]
  const score = checks.filter(c => c.done).reduce((s, c) => s + c.points, 0)
  const missing = checks.filter(c => !c.done)
  return { score, missing }
}

export default function ProviderDashboard() {
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notLinked, setNotLinked] = useState(false)
  const [imageCounts, setImageCounts] = useState({})
  const [reviewsMap, setReviewsMap] = useState({})
  const [viewCounts, setViewCounts] = useState({})

  useEffect(() => {
    async function getSessionWithRetry() {
      // Try up to 5 times over ~2.5s — handles the race where session
      // is still being hydrated from URL after a magic-link redirect.
      for (let i = 0; i < 5; i++) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) return session
        await new Promise(r => setTimeout(r, 500))
      }
      return null
    }

    async function load() {
      const session = await getSessionWithRetry()
      if (!session) { window.location.href = '/provider/login'; return }
      setUser(session.user)

      const { data: provider } = await supabase
        .from('providers')
        .select('id, name, approved')
        .eq('user_id', session.user.id)
        .single()

      if (!provider) { setNotLinked(true); setLoading(false); return }

      const { data: owners } = await supabase
        .from('listing_owners')
        .select('listing_id, approved')
        .eq('provider_id', provider.id)
        .eq('approved', true)

      if (!owners || owners.length === 0) { setNotLinked(true); setLoading(false); return }

      const listingIds = owners.map(o => o.listing_id)
      const { data: listingData } = await supabase
        .from('listings')
        .select('id, name, slug, type, location, verified, logo, description, website, instagram, whatsapp_group_url, free_trial')
        .in('id', listingIds)

      setListings(listingData || [])

      // Fetch image counts for completeness score
      if (listingData && listingData.length > 0) {
        const { data: imgs } = await supabase
          .from('listing_images')
          .select('listing_id')
          .in('listing_id', listingData.map(l => l.id))
        const counts = {}
        ;(imgs || []).forEach(img => { counts[img.listing_id] = (counts[img.listing_id] || 0) + 1 })
        setImageCounts(counts)
      }
      // Fetch reviews
      if (listingData && listingData.length > 0) {
        const { data: revs } = await supabase
          .from('reviews')
          .select('id, listing_id, reviewer_name, rating, review_text, created_at')
          .in('listing_id', listingData.map(l => l.id))
          .order('created_at', { ascending: false })
        const rmap = {}
        ;(revs || []).forEach(r => {
          if (!rmap[r.listing_id]) rmap[r.listing_id] = []
          rmap[r.listing_id].push(r)
        })
        setReviewsMap(rmap)
      }
      // Fetch view counts (last 30 days)
      if (listingData && listingData.length > 0) {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: views } = await supabase
          .from('listing_views')
          .select('listing_id')
          .in('listing_id', listingData.map(l => l.id))
          .gte('viewed_at', since)
        const vcounts = {}
        ;(views || []).forEach(v => { vcounts[v.listing_id] = (vcounts[v.listing_id] || 0) + 1 })
        setViewCounts(vcounts)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/provider/login'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 14, color: '#6B7280' }}>Loading your dashboard...</div>
    </div>
  )

  if (notLinked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'sans-serif', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 360, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Pending approval</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Your claim request is being reviewed. We'll email you at <strong>{user?.email}</strong> once approved.</div>
        <button onClick={handleSignOut} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: 10, padding: '8px 16px', cursor: 'pointer' }}>Sign out</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#5B2D6E' }}>🏡 Provider Portal</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={handleSignOut} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>Sign out</button>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Your listings</div>

        {listings.map(listing => (
          <div key={listing.id} style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {listing.logo && <img src={listing.logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{listing.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{listing.type}{listing.location ? ' · ' + listing.location : ''}</div>
              </div>
            </div>
            {(() => {
              const { score, missing } = getCompleteness(listing, imageCounts[listing.id] || 0)
              const barColor = score >= 71 ? '#065F46' : score >= 41 ? '#D97706' : '#DC2626'
              const bgColor = score >= 71 ? '#D1FAE5' : score >= 41 ? '#FEF3C7' : '#FEE2E2'
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: barColor }}>Listing completeness: {score}%</div>
                    {missing.length > 0 && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{missing.length} item{missing.length !== 1 ? 's' : ''} missing</div>}
                  </div>
                  <div style={{ background: '#E5E7EB', borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: missing.length > 0 ? 8 : 0 }}>
                    <div style={{ width: score + '%', height: '100%', background: barColor, borderRadius: 999, transition: 'width 0.4s' }} />
                  </div>
                  {missing.length > 0 && (
                    <div style={{ background: bgColor, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: barColor }}>
                      💡 Add: {missing.slice(0, 2).map(m => m.label).join(', ')}{missing.length > 2 ? ` +${missing.length - 2} more` : ''}
                    </div>
                  )}
                </div>
              )
            })()}
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={'/provider/listings/' + listing.id + '/edit'}
                style={{ flex: 1, display: 'block', textAlign: 'center', padding: '10px 0', background: '#5B2D6E', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ✏️ Edit listing
              </Link>
              <Link href={'/listing/' + listing.slug}
                style={{ padding: '10px 14px', background: '#F3F4F6', color: '#374151', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                👁 View
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#5B2D6E' }}>{viewCounts[listing.id] || 0}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>views (30 days)</div>
              </div>
              <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#5B2D6E' }}>{(reviewsMap[listing.id] || []).length}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>reviews</div>
              </div>
              <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#5B2D6E' }}>{imageCounts[listing.id] || 0}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>photos</div>
              </div>
            </div>

            {/* Reviews */}
            {(reviewsMap[listing.id] || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  ⭐ {(reviewsMap[listing.id].reduce((s,r) => s + r.rating, 0) / reviewsMap[listing.id].length).toFixed(1)} · {reviewsMap[listing.id].length} review{reviewsMap[listing.id].length !== 1 ? 's' : ''}
                </div>
                {reviewsMap[listing.id].slice(0, 3).map(r => (
                  <div key={r.id} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 12px', marginBottom: 6, border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11 }}>{'⭐'.repeat(r.rating)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{r.reviewer_name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{r.review_text}</div>
                  </div>
                ))}
                {reviewsMap[listing.id].length > 3 && (
                  <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>+{reviewsMap[listing.id].length - 3} more reviews</div>
                )}
              </div>
            )}
            {(reviewsMap[listing.id] || []).length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>No reviews yet</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
