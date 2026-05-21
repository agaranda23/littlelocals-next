'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const PURPLE = '#5B2D6E'
const ORANGE = '#D4732A'

export default function ForProvidersClient({ activityCount }) {
  const [activityName, setActivityName] = useState('')
  const [yourName, setYourName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [extra, setExtra] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const canSubmit =
    activityName.trim() && yourName.trim() && email.trim() && location.trim()

  const submit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    const notes = [
      `Provider sign-up via /for-providers`,
      `Contact: ${yourName.trim()} <${email.trim()}>${phone.trim() ? ` / ${phone.trim()}` : ''}`,
      extra.trim() ? `Notes: ${extra.trim()}` : '',
    ].filter(Boolean).join('\n')
    await supabase.from('listing_suggestions').insert([{
      name: activityName.trim(),
      location: location.trim() || null,
      website: website.trim() || null,
      notes,
      image_url: imageUrl.trim() || null,
    }])
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F9FAFB', minHeight: '100vh', paddingBottom: 60 }}>

      {/* Top bar */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/bear-logo.png" alt="LITTLElocals" style={{ width: 32, height: 32, borderRadius: 7 }} />
          <span style={{ fontSize: 17, fontWeight: 900, color: '#111827', letterSpacing: -0.4 }}>
            LITTLE<span style={{ color: ORANGE }}>locals</span>
          </span>
        </a>
        <a href="/provider/login" style={{ fontSize: 12, fontWeight: 700, color: PURPLE, textDecoration: 'none', background: '#F5F3FF', padding: '7px 12px', borderRadius: 16, border: '1px solid #DDD6FE' }}>
          Provider login →
        </a>
      </div>

      {/* Hero */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'inline-block', background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 14, marginBottom: 14 }}>
          ✨ Free to list. No commission. No fees.
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#111827', lineHeight: 1.15, margin: '0 0 12px', letterSpacing: -0.6 }}>
          Get your activity in front of local families.
        </h1>
        <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.55, margin: '0 0 22px' }}>
          LITTLElocals is how Ealing parents discover what to do with their kids — classes, clubs, nurseries, soft play, days out. List your activity and reach families searching for exactly what you offer.
        </p>
        <a href="#list" style={{ display: 'inline-block', background: PURPLE, color: 'white', fontSize: 15, fontWeight: 800, padding: '14px 24px', borderRadius: 24, textDecoration: 'none', boxShadow: '0 2px 8px rgba(91,45,110,0.25)' }}>
          List my activity →
        </a>
      </div>

      {/* Why list */}
      <div style={{ padding: '24px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, padding: '0 4px' }}>
          Why list with us
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🔍', title: 'Local parents are already searching', body: 'Listings appear in Today, Tomorrow, Weekend and weekly round-ups, plus search and age-range filters. We help parents pick — they find you.' },
            { icon: '💜', title: 'Free, forever', body: 'No listing fee, no booking commission. Set-up takes about two minutes and we publish within 48 hours.' },
            { icon: '⭐', title: 'Verified provider badge', body: 'Once we’ve checked your details, your listing gets a gold "verified" badge that lifts trust and click-through.' },
          ].map(c => (
            <div key={c.title} style={{ background: 'white', borderRadius: 16, padding: '16px 16px', border: '1px solid #F3F4F6', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{c.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      {activityCount > 20 && (
        <div style={{ margin: '24px 16px 0', padding: '14px 16px', background: 'white', borderRadius: 16, border: '1px solid #F3F4F6', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Joined by</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '2px 0' }}>{activityCount}+ activities</div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>in Ealing and West London</div>
        </div>
      )}

      {/* How it works */}
      <div style={{ padding: '28px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, padding: '0 4px' }}>
          How it works
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: 1, title: 'Tell us about your activity', body: 'Name, location, what you offer, a photo or website link. Two minutes.' },
            { n: 2, title: 'We review and publish', body: 'Usually within 48 hours. You’ll get an email when your listing is live.' },
            { n: 3, title: 'Claim and manage', body: 'Log in any time to update photos, timetable, prices and contact info.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #F3F4F6', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: 15, background: PURPLE, color: 'white', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission form */}
      <div id="list" style={{ margin: '28px 16px 0', padding: '20px 16px', background: '#F5F3FF', borderRadius: 18, border: '1px solid #DDD6FE' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Thanks — we’ve got it.</div>
            <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>We’ll review your details and email you within 48 hours when your listing is live.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 4 }}>List your activity</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Free to list. Takes about two minutes.</div>

            <Field label="Activity name *" value={activityName} onChange={setActivityName} placeholder="e.g. Hartbeeps West London" />
            <Field label="Your name *" value={yourName} onChange={setYourName} placeholder="e.g. Sarah Jones" />
            <Field label="Email *" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <Field label="Phone (optional)" value={phone} onChange={setPhone} placeholder="07700 900000" type="tel" />
            <Field label="Location *" value={location} onChange={setLocation} placeholder="e.g. Ealing, Hanwell, Acton" />
            <Field label="Website or Instagram (optional)" value={website} onChange={setWebsite} placeholder="https://..." />
            <Field label="Photo URL (optional)" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
            <TextField label="Anything else? (optional)" value={extra} onChange={setExtra} placeholder="Ages you cater for, schedule, what makes you different..." />

            <button
              onClick={submit}
              disabled={!canSubmit || submitting}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '14px 0',
                background: submitting ? '#9CA3AF' : (canSubmit ? PURPLE : '#C4B5D8'),
                color: 'white',
                border: 'none',
                borderRadius: 24,
                fontSize: 15,
                fontWeight: 800,
                cursor: (canSubmit && !submitting) ? 'pointer' : 'default',
              }}
            >
              {submitting ? 'Sending…' : 'Submit my activity'}
            </button>
            <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
              By submitting you agree to our <a href="/terms" style={{ color: '#9CA3AF' }}>terms</a>. We’ll only use your contact details to publish and manage your listing.
            </div>
          </>
        )}
      </div>

      {/* Already listed? */}
      <div style={{ margin: '20px 16px 0', padding: '16px', background: 'white', borderRadius: 14, border: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Already on LITTLElocals?</div>
        <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, marginBottom: 8 }}>
          Find your listing and tap "Claim your listing" to take over editing photos, schedule and details.
        </div>
        <a href="/" style={{ fontSize: 13, fontWeight: 700, color: PURPLE, textDecoration: 'none' }}>
          Browse listings →
        </a>
      </div>

      {/* FAQ */}
      <div style={{ padding: '28px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, padding: '0 4px' }}>
          Common questions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { q: 'Is it really free?', a: 'Yes. No listing fee, no booking commission. Listing on LITTLElocals is free.' },
            { q: 'How quickly will my listing go live?', a: 'Usually within 48 hours. We do a light check on details before publishing, then email you the link.' },
            { q: 'How do parents find my listing?', a: 'Through search and category filters, our Today, Tomorrow and Weekend views, age-range browsing, and curated home sections.' },
            { q: 'What if my details change?', a: 'Once your listing is live, you can claim it and edit photos, schedule, prices and contact info from the provider dashboard.' },
            { q: 'Where do you operate?', a: 'Today, Ealing and West London. We’re expanding to neighbouring boroughs through 2026.' },
          ].map(item => (
            <details key={item.q} style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', padding: '12px 14px' }}>
              <summary style={{ fontSize: 14, fontWeight: 700, color: '#111827', cursor: 'pointer', listStyle: 'none' }}>
                {item.q}
              </summary>
              <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.55, marginTop: 8 }}>{item.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ margin: '32px 16px 24px', padding: '24px 16px', background: PURPLE, borderRadius: 18, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 6 }}>Ready to be discovered?</div>
        <div style={{ fontSize: 13, color: '#E9D5FF', marginBottom: 14 }}>Local families are searching now.</div>
        <a href="#list" style={{ display: 'inline-block', background: 'white', color: PURPLE, fontSize: 14, fontWeight: 800, padding: '12px 22px', borderRadius: 22, textDecoration: 'none' }}>
          List my activity →
        </a>
      </div>

      {/* Footer */}
      <div style={{ padding: '0 20px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
          Questions? Email <a href="mailto:hello@littlelocals.uk" style={{ color: ORANGE, textDecoration: 'none', fontWeight: 700 }}>hello@littlelocals.uk</a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
          {[['Home','/'],['Privacy','/privacy'],['Terms','/terms']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'underline' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 10 }}>© 2026 LITTLElocals</div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        style={{ width: '100%', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', background: 'white' }}
      />
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{ width: '100%', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', resize: 'none', background: 'white' }}
      />
    </div>
  )
}
