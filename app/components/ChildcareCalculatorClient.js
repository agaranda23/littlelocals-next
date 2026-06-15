'use client'
import { useState, useMemo } from 'react'

const PURPLE = '#5B2D6E'
const ORANGE = '#D4732A'

// 2026 UK entitlement bands. Working = each parent (or single parent) earns roughly
// over £9,518/yr and under £100k/yr.
//
// Universal 15h applies term-time only (38 weeks/yr), but most nurseries "stretch"
// the funded hours over more of the year at fewer hours per week. We model the
// stretched version with 51 weeks/yr × the per-week entitlement × 38/51 to keep
// totals honest.

const AGE_BANDS = [
  { key: 'under_9mo', label: 'Under 9 months',          freeWorking: 0,  freeUniversal: 0  },
  { key: '9_to_23mo', label: '9–23 months',             freeWorking: 30, freeUniversal: 0  },
  { key: '2yr',       label: '2 years',                 freeWorking: 30, freeUniversal: 0  },
  { key: '3_to_4yr',  label: '3–4 years',               freeWorking: 30, freeUniversal: 15 },
]

const WORKING_LABELS = {
  'both_working': 'Working parent(s) — both, or lone parent working',
  'one_working':  'Only one parent in a couple is working',
  'not_working':  'Not working',
}

const TERM_WEEKS = 38
const STRETCHED_WEEKS = 51
const TAX_FREE_ANNUAL_CAP = 2000  // £2k per child per year via Tax-Free Childcare

export default function ChildcareCalculatorClient() {
  const [ageKey, setAgeKey] = useState('2yr')
  const [working, setWorking] = useState('both_working')
  const [hoursPerWeek, setHoursPerWeek] = useState(40)
  const [hourlyRate, setHourlyRate] = useState(14)
  const [useTaxFree, setUseTaxFree] = useState(true)

  const result = useMemo(() => {
    const band = AGE_BANDS.find(b => b.key === ageKey)
    if (!band) return null

    // Per-week funded hours, applied 38 weeks/year but stretched over 51
    const fundedWeekly = working === 'both_working'
      ? band.freeWorking
      : band.freeUniversal
    const fundedAnnual = fundedWeekly * TERM_WEEKS
    const fundedWeeklyStretched = fundedAnnual / STRETCHED_WEEKS

    // Total childcare hours wanted per year (stretched same way)
    const wantedAnnual = hoursPerWeek * STRETCHED_WEEKS

    // Paid hours after funded
    const paidAnnual = Math.max(0, wantedAnnual - fundedAnnual)
    const grossAnnual = paidAnnual * hourlyRate

    // Tax-Free Childcare: government adds 20p for every 80p you pay → 25% top-up
    // on what you put in (max £2k/yr per child). So effective discount is 20% of
    // childcare cost, capped at £2k.
    const taxFreeSaving = useTaxFree
      ? Math.min(grossAnnual * 0.2, TAX_FREE_ANNUAL_CAP)
      : 0

    const netAnnual = grossAnnual - taxFreeSaving
    const netMonthly = netAnnual / 12
    const grossNoSupportAnnual = wantedAnnual * hourlyRate
    const annualSaving = grossNoSupportAnnual - netAnnual

    return {
      fundedWeeklyTermTime: fundedWeekly,
      fundedWeeklyStretched: Math.round(fundedWeeklyStretched * 10) / 10,
      paidWeeklyStretched: Math.max(0, Math.round((hoursPerWeek - fundedWeeklyStretched) * 10) / 10),
      grossAnnual: Math.round(grossAnnual),
      taxFreeSaving: Math.round(taxFreeSaving),
      netAnnual: Math.round(netAnnual),
      netMonthly: Math.round(netMonthly),
      grossNoSupportAnnual: Math.round(grossNoSupportAnnual),
      annualSaving: Math.round(annualSaving),
    }
  }, [ageKey, working, hoursPerWeek, hourlyRate, useTaxFree])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 60, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F9FAFB', minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/bear-logo.png" alt="LITTLElocals" style={{ width: 32, height: 32, borderRadius: 7 }} />
          <span style={{ fontSize: 17, fontWeight: 900, color: '#111827', letterSpacing: -0.4 }}>
            LITTLE<span style={{ color: ORANGE }}>locals</span>
          </span>
        </a>
        <a href="/nurseries" style={{ fontSize: 12, fontWeight: 700, color: PURPLE, textDecoration: 'none', background: '#F5F3FF', padding: '7px 12px', borderRadius: 16, border: '1px solid #DDD6FE' }}>
          Browse nurseries →
        </a>
      </div>

      {/* Hero */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
          💷 Childcare cost calculator
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: -0.5, lineHeight: 1.2 }}>
          What will nursery actually cost me?
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 4px', lineHeight: 1.5 }}>
          A rough estimate of monthly nursery cost in 2026 after UK free hours and Tax-Free Childcare. Built for parents trying to budget before they tour.
        </p>
      </div>

      {/* Inputs */}
      <div style={{ padding: '16px', background: 'white', margin: '16px', borderRadius: 18, border: '1px solid #F3F4F6' }}>

        {/* Age band */}
        <div style={{ marginBottom: 18 }}>
          <Label>Child's age</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {AGE_BANDS.map(b => (
              <Chip key={b.key} active={ageKey === b.key} onClick={() => setAgeKey(b.key)}>
                {b.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Working status */}
        <div style={{ marginBottom: 18 }}>
          <Label>
            Are you a working parent?
            <Hint>Both parents earning roughly £9.5k–£100k each (or lone parent in that range) = "working parent(s)" for the 30h scheme.</Hint>
          </Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(WORKING_LABELS).map(([key, label]) => (
              <Chip key={key} active={working === key} onClick={() => setWorking(key)} fullWidth>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Hours wanted */}
        <div style={{ marginBottom: 18 }}>
          <Label>Childcare hours wanted <span style={{ color: PURPLE }}>{hoursPerWeek}h/week</span></Label>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={hoursPerWeek}
            onChange={e => setHoursPerWeek(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: PURPLE }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
            <span>5h (one short day)</span>
            <span>50h (5 long days)</span>
          </div>
        </div>

        {/* Hourly rate */}
        <div style={{ marginBottom: 14 }}>
          <Label>Nursery hourly rate <span style={{ color: PURPLE }}>£{hourlyRate}/hour</span></Label>
          <input
            type="range"
            min={9}
            max={22}
            step={0.5}
            value={hourlyRate}
            onChange={e => setHourlyRate(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: PURPLE }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
            <span>£9 (rural / cheap)</span>
            <span>£14 typical London</span>
            <span>£22 premium</span>
          </div>
        </div>

        {/* Tax-Free Childcare */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
          <input
            type="checkbox"
            checked={useTaxFree}
            onChange={e => setUseTaxFree(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Use Tax-Free Childcare</div>
            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
              Government adds 20p for every 80p you pay, capped at £2,000/year per child. Most working parents qualify.
            </div>
          </div>
        </label>
      </div>

      {/* Result */}
      {result && (
        <div style={{ margin: '0 16px', padding: '20px 18px', background: PURPLE, borderRadius: 18, color: 'white' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#DDD6FE', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            Your estimated cost
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>£{result.netMonthly.toLocaleString()}</span>
            <span style={{ fontSize: 14, color: '#E9D5FF', fontWeight: 700 }}>/month</span>
          </div>
          <div style={{ fontSize: 13, color: '#E9D5FF', marginBottom: 14 }}>
            £{result.netAnnual.toLocaleString()}/year
          </div>

          {result.annualSaving > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#E9D5FF', marginBottom: 2 }}>You'd save</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>£{result.annualSaving.toLocaleString()}/year</div>
              <div style={{ fontSize: 11, color: '#DDD6FE', marginTop: 2 }}>vs. paying full price (£{result.grossNoSupportAnnual.toLocaleString()}/year)</div>
            </div>
          )}

          <div style={{ fontSize: 12, color: '#E9D5FF', lineHeight: 1.6 }}>
            <div>🎟️ Free hours: <strong style={{ color: 'white' }}>{result.fundedWeeklyTermTime}h/week term-time</strong>{result.fundedWeeklyTermTime > 0 && <> (≈{result.fundedWeeklyStretched}h/week if stretched all year)</>}</div>
            <div>💷 You'd pay for: <strong style={{ color: 'white' }}>{result.paidWeeklyStretched}h/week</strong> at £{hourlyRate}/hour</div>
            {result.taxFreeSaving > 0 && <div>🏛️ Tax-Free Childcare savings: <strong style={{ color: 'white' }}>£{result.taxFreeSaving.toLocaleString()}/year</strong></div>}
          </div>
        </div>
      )}

      {/* Caveats */}
      <div style={{ margin: '14px 16px 0', padding: '14px 16px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', marginBottom: 6 }}>⚠️ This is a rough estimate</div>
        <ul style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
          <li>Nurseries vary in how they "stretch" funded hours and what they charge for meals/extras.</li>
          <li>Funded-hours eligibility depends on each parent's earnings — check <a href="https://www.childcarechoices.gov.uk/" target="_blank" rel="noopener noreferrer" style={{ color: '#92400E', fontWeight: 700 }}>childcarechoices.gov.uk</a> for the official check.</li>
          <li>Some nurseries charge extra for meals, nappies or wraparound care.</li>
          <li>Tax-Free Childcare and the 30h scheme can be combined; Universal Credit's childcare element is a separate calculation not covered here.</li>
        </ul>
      </div>

      {/* CTA back to nurseries */}
      <div style={{ margin: '20px 16px 0', padding: '20px 16px', background: '#FAF8FF', borderRadius: 18, border: '1px solid #E9D5FF', textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Now find a nursery that fits</div>
        <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 14, lineHeight: 1.5 }}>
          Filter Ofsted-rated nurseries by which funded-hours schemes they accept.
        </div>
        <a href="/nurseries" style={{ display: 'inline-block', background: PURPLE, color: 'white', fontSize: 13, fontWeight: 800, padding: '11px 20px', borderRadius: 22, textDecoration: 'none' }}>
          Browse nurseries in Ealing →
        </a>
      </div>

      {/* Footer */}
      <div style={{ padding: '32px 20px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['Home','/'],['Nurseries','/nurseries'],['For providers','/for-providers'],['Privacy','/privacy'],['Terms','/terms']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'underline' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#D1D5DB' }}>© 2026 LITTLElocals</div>
      </div>
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>{children}</div>
  )
}

function Hint({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginTop: 3, lineHeight: 1.4 }}>{children}</div>
  )
}

function Chip({ active, onClick, fullWidth, children }) {
  return (
    <button onClick={onClick}
      style={{
        fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 18,
        border: `1px solid ${active ? PURPLE : '#E5E7EB'}`,
        background: active ? PURPLE : 'white',
        color: active ? 'white' : '#374151',
        cursor: 'pointer',
        textAlign: 'left',
        width: fullWidth ? '100%' : undefined,
      }}>
      {children}
    </button>
  )
}
