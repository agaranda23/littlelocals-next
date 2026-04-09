'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ProviderDashboard() {
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notLinked, setNotLinked] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
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
        .select('id, name, slug, type, location, verified, logo')
        .in('id', listingIds)

      setListings(listingData || [])
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
          </div>
        ))}
      </div>
    </div>
  )
}
