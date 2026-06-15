import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Unsubscribe — LITTLElocals',
  description: 'Manage your LITTLElocals weekly digest subscription.',
  robots: { index: false, follow: false },
}

const PURPLE = '#5B2D6E'
const ORANGE = '#D4732A'

// /unsubscribe?token=<uuid>
// Anonymous public page. Looks up by token, flips status to 'unsubscribed'.
// Idempotent — clicking again is fine. No login required (token IS the auth).
export default async function UnsubscribePage({ searchParams }) {
  const sp = await searchParams
  const token = sp?.token

  let outcome = 'no_token'
  let email = null

  if (token) {
    // Use service-role key if available so we can update without RLS exposure;
    // fall back to anon key if RLS allows the update via token match.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, email, status')
      .eq('unsubscribe_token', token)
      .maybeSingle()
    if (!existing) {
      outcome = 'not_found'
    } else {
      email = existing.email
      if (existing.status === 'unsubscribed') {
        outcome = 'already'
      } else {
        const { error: updErr } = await supabase
          .from('subscribers')
          .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
          .eq('id', existing.id)
        outcome = updErr ? 'error' : 'success'
      }
    }
  }

  const headline = {
    no_token:  'No unsubscribe link supplied.',
    not_found: 'We couldn’t find that subscription.',
    already:   'You’re already unsubscribed.',
    success:   'You’re unsubscribed.',
    error:     'Something went wrong.',
  }[outcome]

  const body = {
    no_token:  'Use the unsubscribe link from the bottom of any LITTLElocals email.',
    not_found: 'The link may have expired or been used already. Email hello@littlelocals.uk if you’d like us to remove you manually.',
    already:   email ? `${email} is no longer on the weekly digest list.` : 'You’re no longer on the weekly digest list.',
    success:   email ? `${email} has been removed from the weekly digest list. We’re sorry to see you go — let us know if anything we could have done better at hello@littlelocals.uk.` : 'You’ve been removed from the weekly digest list.',
    error:     'Please email hello@littlelocals.uk and we’ll remove you manually.',
  }[outcome]

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '48px 24px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 32 }}>
        <img src="/bear-logo.png" alt="LITTLElocals" style={{ width: 32, height: 32, borderRadius: 7 }} />
        <span style={{ fontSize: 17, fontWeight: 900, color: '#111827', letterSpacing: -0.4 }}>
          LITTLE<span style={{ color: ORANGE }}>locals</span>
        </span>
      </a>

      <div style={{ background: 'white', borderRadius: 18, padding: '28px 24px', border: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>
          {outcome === 'success' || outcome === 'already' ? '👋' : '⚠️'}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 12px', lineHeight: 1.3 }}>{headline}</h1>
        <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>{body}</p>

        <a href="/" style={{ display: 'inline-block', marginTop: 24, background: PURPLE, color: 'white', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 20, textDecoration: 'none' }}>
          Back to LITTLElocals →
        </a>
      </div>
    </div>
  )
}
