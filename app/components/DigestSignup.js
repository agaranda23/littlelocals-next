'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const PURPLE = '#5B2D6E'
const ORANGE = '#D4732A'

// Inline-expanding email capture for the weekly "This weekend in Ealing"
// digest. Single opt-in, GDPR-compliant: clear notice in copy, every email
// includes a tokenised unsubscribe link, status flips to 'unsubscribed'
// (not deleted) for audit. Source defaults to 'home' but can be overridden
// for use on other pages.
export default function DigestSignup({ source = 'home' }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [showFields, setShowFields] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email.trim() || submitting) return
    setSubmitting(true)
    setError('')
    const payload = {
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      source,
    }
    // On unique violation (already subscribed), don't error — silently re-confirm.
    const { error: insertErr } = await supabase
      .from('subscribers')
      .insert([payload])
    if (insertErr && !/duplicate key|unique constraint/i.test(insertErr.message || '')) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }
    // Fire-and-forget welcome email. Failure here doesn't undo the signup —
    // worst case the subscriber gets their first issue on Wednesday instead.
    fetch('/.netlify/functions/notify-subscriber-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
    // Track conversion via gtag if available.
    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'digest_signup', { source })
      }
    } catch (e) {}
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ margin: '24px 16px 0', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 18, padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#065F46', marginBottom: 4 }}>You're in.</div>
        <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.5 }}>
          Your first weekend digest lands in your inbox Wednesday 9am. Check your inbox shortly for a welcome note.
        </div>
      </div>
    )
  }

  return (
    <div style={{ margin: '24px 16px 0', background: '#FAF8FF', border: '1px solid #E9D5FF', borderRadius: 18, padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>📬</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
            This weekend in Ealing — in your inbox
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginBottom: showFields ? 14 : 12 }}>
            One short email every Wednesday. Five hand-picked things to do with the kids this weekend. Free, no spam, unsubscribe in one click.
          </div>

          {!showFields ? (
            <button
              onClick={() => setShowFields(true)}
              style={{ background: PURPLE, color: 'white', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>
              Sign me up →
            </button>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid #DDD6FE', boxSizing: 'border-box', outline: 'none', marginBottom: 8, background: 'white' }}
              />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="First name (optional)"
                style={{ width: '100%', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid #DDD6FE', boxSizing: 'border-box', outline: 'none', marginBottom: 10, background: 'white' }}
              />
              {error && (
                <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{error}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={submit}
                  disabled={!email.trim() || submitting}
                  style={{ flex: 1, background: submitting ? '#9CA3AF' : (email.trim() ? PURPLE : '#C4B5D8'), color: 'white', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 20, border: 'none', cursor: (email.trim() && !submitting) ? 'pointer' : 'default' }}>
                  {submitting ? 'Sending…' : 'Subscribe'}
                </button>
                <button onClick={() => setShowFields(false)}
                  style={{ fontSize: 13, color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: 20, padding: '10px 14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, lineHeight: 1.5 }}>
                By subscribing you agree to receive the weekly LITTLElocals digest. Unsubscribe link in every email. See <a href="/privacy" style={{ color: '#9CA3AF' }}>privacy policy</a>.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
