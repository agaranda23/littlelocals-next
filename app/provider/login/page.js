'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ProviderLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: 'https://littlelocals.uk/provider/auth?next=/provider/dashboard' }
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'sans-serif', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#5B2D6E', marginBottom: 4 }}>🏡 LittleLocals</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Provider Portal</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 28 }}>Manage your listing — free forever.</div>
        {sent ? (
          <div style={{ background: '#D1FAE5', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>Check your email</div>
            <div style={{ fontSize: 13, color: '#065F46' }}>We sent a magic link to <strong>{email}</strong>. Click it to log in.</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your email address</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="e.g. sarah@myclass.co.uk"
                style={{ width: '100%', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            {error && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 10 }}>{error}</div>}
            <button onClick={handleLogin} disabled={loading || !email.trim()}
              style={{ width: '100%', padding: '12px 0', background: loading ? '#9CA3AF' : '#5B2D6E', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Sending…' : 'Send magic link ✨'}
            </button>
            <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>No password needed — we'll email you a login link.</div>
          </>
        )}
      </div>
    </div>
  )
}
