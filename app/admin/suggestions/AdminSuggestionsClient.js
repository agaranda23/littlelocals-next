'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_COLOURS = {
  pending: { bg: '#FEF3C7', color: '#92400E' },
  added: { bg: '#D1FAE5', color: '#065F46' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function AdminSuggestionsClient({ suggestions: initial }) {
  const [suggestions, setSuggestions] = useState(initial)
  const [loading, setLoading] = useState(null)

  async function updateStatus(id, status) {
    setLoading(id + status)
    await supabase.from('listing_suggestions').update({ status }).eq('id', id)
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    setLoading(null)
  }

  const pending = suggestions.filter(s => s.status === 'pending')
  const done = suggestions.filter(s => s.status !== 'pending')

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#5B2D6E' }}>✨ Listing Suggestions</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{pending.length} pending · {done.length} resolved</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/admin/claims" style={{ fontSize: 13, color: '#5B2D6E', fontWeight: 600, textDecoration: 'none' }}>Claims</a>
            <a href="/" style={{ fontSize: 13, color: '#5B2D6E', fontWeight: 600, textDecoration: 'none' }}>← Site</a>
          </div>
        </div>

        {pending.length === 0 && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
            No pending suggestions 🎉
          </div>
        )}

        {pending.map(s => <SuggestionCard key={s.id} suggestion={s} onUpdate={updateStatus} loading={loading} />)}

        {done.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', margin: '24px 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Resolved</div>
            {done.map(s => <SuggestionCard key={s.id} suggestion={s} onUpdate={updateStatus} loading={loading} />)}
          </>
        )}
      </div>
    </div>
  )
}

function SuggestionCard({ suggestion: s, onUpdate, loading }) {
  const { bg, color } = STATUS_COLOURS[s.status] || STATUS_COLOURS.pending
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{s.name}</div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color }}>{s.status}</span>
      </div>
      {s.location && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>📍 {s.location}</div>}
      {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#5B2D6E', display: 'block', marginBottom: 4 }}>🔗 {s.website}</a>}
      {s.notes && <div style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginBottom: 10 }}>"{s.notes}"</div>}
      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
        {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
      {s.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onUpdate(s.id, 'added')}
            disabled={loading === s.id + 'added'}
            style={{ flex: 1, padding: '8px 0', background: '#065F46', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {loading === s.id + 'added' ? '…' : '✅ Added'}
          </button>
          <button onClick={() => onUpdate(s.id, 'rejected')}
            disabled={loading === s.id + 'rejected'}
            style={{ flex: 1, padding: '8px 0', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {loading === s.id + 'rejected' ? '…' : '❌ Reject'}
          </button>
        </div>
      )}
    </div>
  )
}
