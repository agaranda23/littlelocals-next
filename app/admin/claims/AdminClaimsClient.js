'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_COLOURS = {
  pending: { bg: '#FEF3C7', color: '#92400E' },
  approved: { bg: '#D1FAE5', color: '#065F46' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function AdminClaimsClient({ claims: initial, pwd }) {
  const [claims, setClaims] = useState(initial)
  const [loading, setLoading] = useState(null)

  async function updateStatus(id, status) {
    setLoading(id + status)
    await supabase.from('claim_requests').update({ status }).eq('id', id)
    if (status === 'approved') {
      const claim = claims.find(c => c.id === id)
      if (claim) {
        await fetch('/.netlify/functions/send-magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: claim.email,
            name: claim.name,
            listingName: claim.listings?.name || 'your listing'
          })
        })
      }
    }
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    setLoading(null)
  }

  const pending = claims.filter(c => c.status === 'pending')
  const done = claims.filter(c => c.status !== 'pending')

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#5B2D6E' }}>🏡 Claim Requests</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{pending.length} pending · {done.length} resolved</div>
          </div>
          <a href="/" style={{ fontSize: 13, color: '#5B2D6E', fontWeight: 600, textDecoration: 'none' }}>← Back to site</a>
        </div>

        {pending.length === 0 && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
            No pending claims 🎉
          </div>
        )}

        {pending.map(claim => (
          <ClaimCard key={claim.id} claim={claim} onUpdate={updateStatus} loading={loading} />
        ))}

        {done.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', margin: '24px 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Resolved</div>
            {done.map(claim => (
              <ClaimCard key={claim.id} claim={claim} onUpdate={updateStatus} loading={loading} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function ClaimCard({ claim, onUpdate, loading }) {
  const { bg, color } = STATUS_COLOURS[claim.status] || STATUS_COLOURS.pending
  const listingName = claim.listings?.name || `Listing #${claim.listing_id}`
  const listingSlug = claim.listings?.slug

  return (
    <div style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{claim.name}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{claim.email}{claim.phone ? ` · ${claim.phone}` : ''}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color }}>{claim.status}</span>
      </div>

      <div style={{ fontSize: 13, color: '#374151', background: '#F3F4F6', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>Listing: </span>
        {listingSlug ? (
          <a href={`/listing/${listingSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#5B2D6E', fontWeight: 600 }}>{listingName} ↗</a>
        ) : listingName}
      </div>

      {claim.message && (
        <div style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginBottom: 12 }}>"{claim.message}"</div>
      )}

      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
        {new Date(claim.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>

      {claim.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onUpdate(claim.id, 'approved')}
            disabled={loading === claim.id + 'approved'}
            style={{ flex: 1, padding: '8px 0', background: '#065F46', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {loading === claim.id + 'approved' ? '…' : '✅ Approve'}
          </button>
          <button onClick={() => onUpdate(claim.id, 'rejected')}
            disabled={loading === claim.id + 'rejected'}
            style={{ flex: 1, padding: '8px 0', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {loading === claim.id + 'rejected' ? '…' : '❌ Reject'}
          </button>
          <a href={`mailto:${claim.email}?subject=Your LittleLocals listing claim&body=Hi ${claim.name},%0D%0A%0D%0AThanks for claiming your listing on LittleLocals!%0D%0A%0D%0AWe've approved your request and will be in touch shortly with next steps.%0D%0A%0D%0ABest,%0D%0ALittleLocals team`}
            style={{ padding: '8px 14px', background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            📧 Email
          </a>
        </div>
      )}
    </div>
  )
}
