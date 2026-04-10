export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function AdminHome({ searchParams }) {
  const params = await searchParams
  const pwd = params?.pwd || ''
  const authed = pwd === process.env.ADMIN_PASSWORD

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#5B2D6E', marginBottom: 8 }}>🏡 LittleLocals</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Admin access only</div>
          <form method="GET">
            <input name="pwd" type="password" placeholder="Enter password" autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box', marginBottom: 12, outline: 'none' }} />
            <button type="submit"
              style={{ width: '100%', padding: '10px 0', background: '#5B2D6E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Fetch stats in parallel
  const [
    { count: totalListings },
    { count: pendingClaims },
    { count: pendingSuggestions },
    { count: totalReviews },
    { count: totalProviders },
    { data: recentClaims },
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('listing_suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('approved', true),
    supabase.from('claim_requests').select('name, email, listings(name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(3),
    supabase.from('providers').select('id, name, email, created_at').eq('approved', true).order('created_at', { ascending: false }),
  ])

  const statCards = [
    { label: 'Total listings', value: totalListings, emoji: '📋', color: '#5B2D6E' },
    { label: 'Pending claims', value: pendingClaims, emoji: '🙋', color: pendingClaims > 0 ? '#D97706' : '#065F46', urgent: pendingClaims > 0 },
    { label: 'Pending suggestions', value: pendingSuggestions, emoji: '✨', color: pendingSuggestions > 0 ? '#D97706' : '#065F46', urgent: pendingSuggestions > 0 },
    { label: 'Total reviews', value: totalReviews, emoji: '⭐', color: '#5B2D6E' },
    { label: 'Active providers', value: totalProviders, emoji: '🏪', color: '#5B2D6E' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#5B2D6E' }}>🏡 LittleLocals Admin</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Welcome back</div>
          </div>
          <a href="/" style={{ fontSize: 13, color: '#5B2D6E', fontWeight: 600, textDecoration: 'none' }}>← View site</a>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 12px', textAlign: 'center', border: s.urgent ? '2px solid #F59E0B' : '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 22 }}>{s.emoji}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.value || 0}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <Link href={'/admin/claims?pwd=' + pwd}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 14, padding: '16px 20px', border: pendingClaims > 0 ? '2px solid #F59E0B' : '1px solid #E5E7EB', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>🙋</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Claim Requests</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Providers wanting to claim their listing</div>
              </div>
            </div>
            {pendingClaims > 0 && <span style={{ background: '#F59E0B', color: 'white', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{pendingClaims} pending</span>}
          </Link>

          <Link href={'/admin/suggestions?pwd=' + pwd}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 14, padding: '16px 20px', border: pendingSuggestions > 0 ? '2px solid #F59E0B' : '1px solid #E5E7EB', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>✨</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Listing Suggestions</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Activities suggested by parents</div>
              </div>
            </div>
            {pendingSuggestions > 0 && <span style={{ background: '#F59E0B', color: 'white', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{pendingSuggestions} pending</span>}
          </Link>

          <Link href={'/provider/dashboard'}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #E5E7EB', textDecoration: 'none' }}>
            <span style={{ fontSize: 22 }}>🏪</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Provider Portal</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>View provider dashboard</div>
            </div>
          </Link>
        </div>

        {/* Recent claims */}
        {recentClaims && recentClaims.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Recent claims</div>
            {recentClaims.map((c, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: '12px 16px', marginBottom: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>{c.name}</span>
                <span style={{ color: '#6B7280' }}> wants to claim </span>
                <span style={{ fontWeight: 700, color: '#5B2D6E' }}>{c.listings?.name || 'unknown listing'}</span>
              </div>
            ))}
            <Link href={'/admin/claims?pwd=' + pwd} style={{ fontSize: 13, color: '#5B2D6E', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
          </div>
        )}
        {/* Active providers */}
        {activeProviders && activeProviders.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Active providers</div>
            {activeProviders.map(p => (
              <div key={p.id} style={{ background: 'white', borderRadius: 10, padding: '12px 16px', marginBottom: 8, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{p.email}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
