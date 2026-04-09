export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import AdminClaimsClient from './AdminClaimsClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function AdminClaimsPage({ searchParams }) {
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

  const { data: claims } = await supabase
    .from('claim_requests')
    .select('*, listings(name, slug)')
    .order('created_at', { ascending: false })

  return <AdminClaimsClient claims={claims || []} pwd={pwd} />
}
