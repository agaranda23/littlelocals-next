'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ProviderAuth() {
  const [status, setStatus] = useState('verifying')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search)
      const token_hash = params.get('token') || params.get('token_hash')
      const code = params.get('code')
      const type = params.get('type') || 'magiclink'
      const next = params.get('next') || '/provider/dashboard'

      let error = null

      if (token_hash) {
        // Custom flow from send-magic-link.js (admin-generated link)
        const res = await supabase.auth.verifyOtp({ token_hash, type })
        error = res.error
      } else if (code) {
        // PKCE flow from self-serve signInWithOtp
        const res = await supabase.auth.exchangeCodeForSession(code)
        error = res.error
      } else {
        // Hash-based implicit flow fallback (#access_token=...)
        // Wait briefly for the supabase client to detect the hash.
        if (window.location.hash.includes('access_token=')) {
          for (let i = 0; i < 6; i++) {
            const { data } = await supabase.auth.getSession()
            if (data?.session) { error = null; break }
            await new Promise(r => setTimeout(r, 400))
            error = { message: 'Session not detected from URL' }
          }
        } else {
          setStatus('error')
          setErrMsg('Missing token. Please request a new magic link.')
          return
        }
      }

      if (error) {
        setStatus('error')
        // Common cases: token already used, expired, or invalid.
        const msg = error.message || ''
        if (/expired|invalid|used/i.test(msg)) {
          setErrMsg('This link has expired or already been used. Request a new one below.')
        } else {
          setErrMsg(msg || 'Could not log you in. Please request a new link.')
        }
        return
      }

      setStatus('success')
      // Hard redirect so the dashboard reads the freshly-stored session.
      window.location.href = next
    }
    run()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'sans-serif', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#5B2D6E', marginBottom: 4 }}>🏡 LittleLocals</div>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: 32, margin: '20px 0 8px' }}>✨</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Logging you in…</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>Just a moment.</div>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 32, margin: '20px 0 8px' }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#065F46' }}>Logged in! Redirecting…</div>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 32, margin: '20px 0 8px' }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Login link didn't work</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>{errMsg}</div>
            <a href="/provider/login" style={{ display: 'inline-block', padding: '10px 18px', background: '#5B2D6E', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Request a new link →
            </a>
          </>
        )}
      </div>
    </div>
  )
}
