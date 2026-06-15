'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function EditListing({ params }) {
  const [listingId, setListingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [notAuthed, setNotAuthed] = useState(false)
  const [form, setForm] = useState({
    description: '',
    price: '',
    website: '',
    free_trial_info: '',
    whatsapp_group_url: '',
    instagram: '',
    ofsted_rating: '',
    ofsted_report_url: '',
    ofsted_inspection_date: '',
    funded_hours: [],
    opens_at: '',
    closes_at: '',
    term_time_only: '',
    meals_included: '',
    nursery_fee: '',
    waitlist_status: '',
    babies_capacity: '',
    toddlers_capacity: '',
    preschool_capacity: '',
    outdoor_space: '',
    languages_spoken: '',
    sibling_discount: '',
    holiday_closures: '',
    dbs_checked: '',
    governing_body: '',
    governing_body_url: '',
    max_class_size: '',
    term_schedule: '',
    cancellation_policy: '',
    what_to_bring: '',
    under_2s_area: '',
    sock_policy: '',
    cafe_on_site: '',
    free_parking: '',
    max_session_minutes: '',
    adult_price: '',
    babies_free_under_months: '',
    pram_friendly: '',
    baby_changing: '',
    accessible: '',
    free_under_age: '',
    family_ticket_price: '',
    season: '',
    duration_typical: '',
    annual_pass_available: '',
    food_options: '',
  })
  const [listing, setListing] = useState(null)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params
      setListingId(resolved.id)
    }
    resolveParams()
  }, [])

  useEffect(() => {
    if (!listingId) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/provider/login'; return }

      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (!provider) { setNotAuthed(true); setLoading(false); return }

      const { data: owner } = await supabase
        .from('listing_owners')
        .select('listing_id')
        .eq('provider_id', provider.id)
        .eq('listing_id', parseInt(listingId))
        .eq('approved', true)
        .single()

      if (!owner) { setNotAuthed(true); setLoading(false); return }

      const { data: l } = await supabase
        .from('listings')
        .select('id, name, slug, category, type, description, price, website, free_trial, whatsapp_group_url, instagram, is_paused, logo, age_min, age_max, ofsted_rating, ofsted_report_url, ofsted_inspection_date, funded_hours, opens_at, closes_at, term_time_only, meals_included, nursery_fee, waitlist_status, babies_capacity, toddlers_capacity, preschool_capacity, outdoor_space, languages_spoken, sibling_discount, holiday_closures, dbs_checked, governing_body, governing_body_url, max_class_size, term_schedule, cancellation_policy, what_to_bring, under_2s_area, sock_policy, cafe_on_site, free_parking, max_session_minutes, adult_price, babies_free_under_months, pram_friendly, baby_changing, accessible, free_under_age, family_ticket_price, season, duration_typical, annual_pass_available, food_options')
        .eq('id', parseInt(listingId))
        .single()

      // Fetch existing photos
      const { data: existingPhotos } = await supabase
        .from('listing_images')
        .select('id, url, sort_order')
        .eq('listing_id', parseInt(listingId))
        .order('sort_order', { ascending: true })
      setPhotos(existingPhotos || [])

      if (l) {
        setListing(l)
        setLogoUrl(l.logo || null)
        setForm({
          description: l.description || '',
          price: l.price || '',
          website: l.website || '',
          free_trial_info: l.free_trial_info || '',
          whatsapp_group_url: l.whatsapp_group_url || '',
          instagram: l.instagram || '',
          is_paused: l.is_paused || false,
          age_min: l.age_min ?? '',
          age_max: l.age_max ?? '',
          ofsted_rating: l.ofsted_rating || '',
          ofsted_report_url: l.ofsted_report_url || '',
          ofsted_inspection_date: l.ofsted_inspection_date || '',
          funded_hours: l.funded_hours || [],
          opens_at: l.opens_at || '',
          closes_at: l.closes_at || '',
          term_time_only: l.term_time_only === true ? 'true' : l.term_time_only === false ? 'false' : '',
          meals_included: l.meals_included === true ? 'true' : l.meals_included === false ? 'false' : '',
          nursery_fee: l.nursery_fee || '',
          waitlist_status: l.waitlist_status || '',
          babies_capacity: l.babies_capacity ?? '',
          toddlers_capacity: l.toddlers_capacity ?? '',
          preschool_capacity: l.preschool_capacity ?? '',
          outdoor_space: l.outdoor_space || '',
          languages_spoken: Array.isArray(l.languages_spoken) ? l.languages_spoken.join(', ') : '',
          sibling_discount: l.sibling_discount || '',
          holiday_closures: l.holiday_closures || '',
          dbs_checked: l.dbs_checked === true ? 'true' : l.dbs_checked === false ? 'false' : '',
          governing_body: l.governing_body || '',
          governing_body_url: l.governing_body_url || '',
          max_class_size: l.max_class_size ?? '',
          term_schedule: l.term_schedule || '',
          cancellation_policy: l.cancellation_policy || '',
          what_to_bring: l.what_to_bring || '',
          under_2s_area: l.under_2s_area === true ? 'true' : l.under_2s_area === false ? 'false' : '',
          sock_policy: l.sock_policy || '',
          cafe_on_site: l.cafe_on_site === true ? 'true' : l.cafe_on_site === false ? 'false' : '',
          free_parking: l.free_parking === true ? 'true' : l.free_parking === false ? 'false' : '',
          max_session_minutes: l.max_session_minutes ?? '',
          adult_price: l.adult_price || '',
          babies_free_under_months: l.babies_free_under_months ?? '',
          pram_friendly: l.pram_friendly === true ? 'true' : l.pram_friendly === false ? 'false' : '',
          baby_changing: l.baby_changing === true ? 'true' : l.baby_changing === false ? 'false' : '',
          accessible: l.accessible === true ? 'true' : l.accessible === false ? 'false' : '',
          free_under_age: l.free_under_age ?? '',
          family_ticket_price: l.family_ticket_price || '',
          season: l.season || '',
          duration_typical: l.duration_typical || '',
          annual_pass_available: l.annual_pass_available === true ? 'true' : l.annual_pass_available === false ? 'false' : '',
          food_options: l.food_options || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [listingId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `${listingId}/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(filename, file, { upsert: false })
    if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(filename)
    const maxOrder = photos.length > 0 ? Math.max(...photos.map(p => p.sort_order || 0)) : 0
    const { data: newPhoto } = await supabase
      .from('listing_images')
      .insert([{ listing_id: parseInt(listingId), url: publicUrl, sort_order: maxOrder + 1 }])
      .select()
      .single()
    if (newPhoto) setPhotos(prev => [...prev, newPhoto])
    setUploading(false)
  }

  async function handleDeletePhoto(photo) {
    if (!confirm('Delete this photo?')) return
    const path = photo.url.split('/listing-images/')[1]
    await supabase.storage.from('listing-images').remove([path])
    await supabase.from('listing_images').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `${listingId}/logo-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(filename, file, { upsert: true })
    if (uploadError) { alert('Upload failed: ' + uploadError.message); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(filename)
    await supabase.from('listings').update({ logo: publicUrl }).eq('id', parseInt(listingId))
    setLogoUrl(publicUrl)
    setLogoUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    // Sanitise: empty strings/arrays -> null, coerce known types
    const boolFields = ['is_paused', 'term_time_only', 'meals_included', 'dbs_checked', 'under_2s_area', 'cafe_on_site', 'free_parking', 'pram_friendly', 'baby_changing', 'accessible', 'annual_pass_available']
    const intFields = ['age_min', 'age_max', 'babies_capacity', 'toddlers_capacity', 'preschool_capacity', 'max_class_size', 'max_session_minutes', 'babies_free_under_months', 'free_under_age']
    const arrayFields = ['funded_hours']
    // Comma-separated text -> array of trimmed non-empty strings
    const csvArrayFields = ['languages_spoken']
    const payload = {}
    for (const [k, v] of Object.entries(form)) {
      if (v === '' || v === undefined || v === null) {
        payload[k] = null
      } else if (arrayFields.includes(k)) {
        payload[k] = Array.isArray(v) && v.length > 0 ? v : null
      } else if (csvArrayFields.includes(k)) {
        const parts = String(v).split(',').map(s => s.trim()).filter(Boolean)
        payload[k] = parts.length > 0 ? parts : null
      } else if (boolFields.includes(k)) {
        payload[k] = v === true || v === 'true'
      } else if (intFields.includes(k)) {
        const n = parseInt(v, 10)
        payload[k] = isNaN(n) ? null : n
      } else {
        payload[k] = v
      }
    }

    // Derive boolean free_trial from text field
    payload.free_trial = !!(payload.free_trial_info && payload.free_trial_info.trim())

    const { error } = await supabase
      .from('listings')
      .update(payload)
      .eq('id', parseInt(listingId))
    if (error) { setError(error.message) }
    else { setSaved(true) }
    setSaving(false)
  }

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 14, color: '#6B7280' }}>Loading...</div>
    </div>
  )

  if (notAuthed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 14, color: '#DC2626' }}>You don't have permission to edit this listing.</div>
    </div>
  )

  const inputStyle = { width: '100%', fontSize: 13, padding: '9px 11px', borderRadius: 8, border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontFamily: 'sans-serif' }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#5B2D6E' }}>✏️ Edit listing</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{listing?.name}</div>
          </div>
          <Link href="/provider/dashboard" style={{ fontSize: 13, color: '#5B2D6E', fontWeight: 600, textDecoration: 'none' }}>← Dashboard</Link>
        </div>

        {saved && (
          <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#065F46' }}>
            ✅ Changes saved successfully!
          </div>
        )}
        {error && (
          <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 16 }}>Logo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 12, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏷️</div>
            )}
            <div>
              <label style={{ display: 'inline-block', padding: '8px 16px', background: '#F3F4F6', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: logoUploading ? 'default' : 'pointer' }}>
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={logoUploading} style={{ display: 'none' }} />
                {logoUploading ? 'Uploading...' : logoUrl ? '🔄 Change logo' : '⬆️ Upload logo'}
              </label>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Square image works best. PNG or JPG.</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 16 }}>About your activity</div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Describe your activity for parents..."
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Price</label>
            <input value={form.price} onChange={set('price')} placeholder="e.g. £8 per session" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Free trial / taster info</label>
            <input value={form.free_trial} onChange={set('free_trial')} placeholder="e.g. First session free" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Age range</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select value={form.age_min} onChange={set('age_min')} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Min age</option>
                {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(a => <option key={a} value={a}>{a === 0 ? 'Newborn' : `${a} yr`}</option>)}
              </select>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>to</span>
              <select value={form.age_max} onChange={set('age_max')} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Max age</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(a => <option key={a} value={a}>{`${a} yr`}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 16 }}>Links & contact</div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={set('website')} placeholder="https://yourwebsite.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Instagram</label>
            <input value={form.instagram} onChange={set('instagram')} placeholder="@yourhandle" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>WhatsApp group link</label>
            <input value={form.whatsapp_group_url} onChange={set('whatsapp_group_url')} placeholder="https://chat.whatsapp.com/..." style={inputStyle} />
          </div>
        </div>

        {/* Nursery info — only for nursery listings */}
        {(listing?.category || '').toLowerCase() === 'nursery' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 6 }}>🧸 Nursery info</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18, lineHeight: 1.5 }}>
              Parents choose nurseries on Ofsted rating, fees, opening hours and which funded-hours schemes you accept. Filling these in significantly improves how your listing performs.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Ofsted rating</label>
              <select value={form.ofsted_rating} onChange={set('ofsted_rating')} style={inputStyle}>
                <option value="">— Not set —</option>
                <option value="outstanding">Outstanding</option>
                <option value="good">Good</option>
                <option value="requires_improvement">Requires improvement</option>
                <option value="inadequate">Inadequate</option>
                <option value="not_yet_inspected">Not yet inspected</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Ofsted report URL</label>
              <input value={form.ofsted_report_url} onChange={set('ofsted_report_url')} placeholder="https://reports.ofsted.gov.uk/..." style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Last inspection date</label>
              <input type="date" value={form.ofsted_inspection_date} onChange={set('ofsted_inspection_date')} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Funded hours accepted</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB', padding: '12px 12px', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                {[
                  ['15h_universal', '15 hours universal (all 3–4 year olds)'],
                  ['30h_working', '30 hours, working parents (9 months to school age)'],
                  ['15h_2yo', '15 hours, some 2-year-olds (low-income / disadvantaged)'],
                  ['tax_free', 'Tax-Free Childcare (up to £2,000/yr per child)'],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(form.funded_hours || []).includes(key)}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        funded_hours: e.target.checked
                          ? [...(prev.funded_hours || []), key]
                          : (prev.funded_hours || []).filter(k => k !== key),
                      }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Opening hours</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="time" value={form.opens_at} onChange={set('opens_at')} style={{ ...inputStyle, flex: 1 }} />
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>to</span>
                <input type="time" value={form.closes_at} onChange={set('closes_at')} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Term-time only?</label>
              <select value={form.term_time_only} onChange={set('term_time_only')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes, term-time only</option>
                <option value="false">No, runs all year</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Meals included?</label>
              <select value={form.meals_included} onChange={set('meals_included')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes, included in fee</option>
                <option value="false">No, extra charge or bring own</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Fee</label>
              <input value={form.nursery_fee} onChange={set('nursery_fee')} placeholder="e.g. From £65/day or £14/hour" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Waitlist / availability status</label>
              <input value={form.waitlist_status} onChange={set('waitlist_status')} placeholder="e.g. Spaces available for 2–3yo, waitlist for under-2s" style={inputStyle} />
            </div>

            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 4, marginBottom: 12, fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.3, textTransform: 'uppercase' }}>
              Capacity & operations
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Capacity by age group (number of places)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input type="number" min={0} value={form.babies_capacity} onChange={set('babies_capacity')} placeholder="Babies 0–2" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number" min={0} value={form.toddlers_capacity} onChange={set('toddlers_capacity')} placeholder="Toddlers 2–3" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number" min={0} value={form.preschool_capacity} onChange={set('preschool_capacity')} placeholder="Pre-school 3–4" style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Outdoor space</label>
              <input value={form.outdoor_space} onChange={set('outdoor_space')} placeholder="e.g. Large garden + shared rooftop, near Walpole Park" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Languages spoken
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>(comma-separated)</span>
              </label>
              <input value={form.languages_spoken} onChange={set('languages_spoken')} placeholder="e.g. English, French, Polish" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Sibling discount</label>
              <input value={form.sibling_discount} onChange={set('sibling_discount')} placeholder="e.g. 10% off second child" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Holiday closures</label>
              <input value={form.holiday_closures} onChange={set('holiday_closures')} placeholder="e.g. Closed Christmas, 2 weeks August, bank holidays" style={inputStyle} />
            </div>
          </div>
        )}

        {/* Class info — only for class-like listings (anything not nursery/soft play/event/park that matches class keywords) */}
        {(() => {
          const cat = (listing?.category || '').toLowerCase()
          const type = (listing?.type || '').toLowerCase()
          if (cat === 'nursery' || cat === 'soft play' || cat === 'event' || cat === 'park' || cat === 'attraction') return false
          const CLASS_KEYWORDS = ['class', 'club', 'sport', 'music', 'dance', 'art', 'language', 'martial', 'swim', 'football', 'gymnastic', 'yoga', 'ballet', 'tennis', 'fitness']
          return CLASS_KEYWORDS.some(k => cat.includes(k) || type.includes(k))
        })() && (
          <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 6 }}>🎯 Class info</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18, lineHeight: 1.5 }}>
              Trust signals parents look for when comparing classes: DBS-checked instructors, governing-body accreditation, class size, term structure, refund policy.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>DBS-checked instructors?</label>
              <select value={form.dbs_checked} onChange={set('dbs_checked')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes — all instructors DBS-checked</option>
                <option value="false">No / not applicable</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Governing body / accreditation
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>(e.g. STA, FA, British Gymnastics)</span>
              </label>
              <input value={form.governing_body} onChange={set('governing_body')} placeholder="e.g. Swimming Teachers' Association" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Governing body URL</label>
              <input value={form.governing_body_url} onChange={set('governing_body_url')} placeholder="https://..." style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Max class size</label>
              <input type="number" min={1} value={form.max_class_size} onChange={set('max_class_size')} placeholder="e.g. 8" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Term schedule</label>
              <input value={form.term_schedule} onChange={set('term_schedule')} placeholder="e.g. Term-time, 11 weeks/term, follows Ealing council holidays" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Cancellation policy</label>
              <input value={form.cancellation_policy} onChange={set('cancellation_policy')} placeholder="e.g. 7 days notice for refund, no refunds within 24h" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>What to bring</label>
              <input value={form.what_to_bring} onChange={set('what_to_bring')} placeholder="e.g. Swimming costume, towel, goggles" style={inputStyle} />
            </div>

            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 4, marginBottom: 12, fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.3, textTransform: 'uppercase' }}>
              Also useful (shared with nurseries)
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Sibling discount</label>
              <input value={form.sibling_discount} onChange={set('sibling_discount')} placeholder="e.g. 10% off second child" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Holiday closures</label>
              <input value={form.holiday_closures} onChange={set('holiday_closures')} placeholder="e.g. Closed bank holidays + Christmas" style={inputStyle} />
            </div>
          </div>
        )}

        {/* Soft play info — only for category=soft play */}
        {(listing?.category || '').toLowerCase() === 'soft play' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 6 }}>🎈 Soft play info</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18, lineHeight: 1.5 }}>
              The deciders for soft play parents: is there a baby zone, what's the sock policy, is there a café, can they park, what do adults pay.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Dedicated under-2s area?</label>
              <select value={form.under_2s_area} onChange={set('under_2s_area')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes — separate baby zone</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Sock policy</label>
              <input value={form.sock_policy} onChange={set('sock_policy')} placeholder="e.g. Grip socks required (£2 available on site)" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Café on site?</label>
              <select value={form.cafe_on_site} onChange={set('cafe_on_site')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Free parking?</label>
              <select value={form.free_parking} onChange={set('free_parking')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes</option>
                <option value="false">No / paid only</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Max session length
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>(minutes, blank = unlimited)</span>
              </label>
              <input type="number" min={1} value={form.max_session_minutes} onChange={set('max_session_minutes')} placeholder="e.g. 90" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Adult price</label>
              <input value={form.adult_price} onChange={set('adult_price')} placeholder="e.g. £2 per adult, or 'Free with paying child'" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>
                Babies free under
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>(months)</span>
              </label>
              <input type="number" min={0} value={form.babies_free_under_months} onChange={set('babies_free_under_months')} placeholder="e.g. 12" style={inputStyle} />
            </div>
          </div>
        )}

        {/* Days out info — for attractions / days out */}
        {['attraction', 'days out', 'day out', 'theme park', 'farm', 'zoo', 'museum'].includes((listing?.category || '').toLowerCase()) && (
          <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 6 }}>🎢 Days out info</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18, lineHeight: 1.5 }}>
              Parents planning a day out need to know: pram access, baby changing, when you're open, what a family ticket costs, how long to allow.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Pram-friendly throughout?</label>
              <select value={form.pram_friendly} onChange={set('pram_friendly')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes</option>
                <option value="false">No / partial access only</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Baby changing facilities?</label>
              <select value={form.baby_changing} onChange={set('baby_changing')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Wheelchair / step-free accessible?</label>
              <select value={form.accessible} onChange={set('accessible')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes</option>
                <option value="false">Partially / limited</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Free entry under age
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>(years)</span>
              </label>
              <input type="number" min={0} value={form.free_under_age} onChange={set('free_under_age')} placeholder="e.g. 3" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Family ticket price</label>
              <input value={form.family_ticket_price} onChange={set('family_ticket_price')} placeholder="e.g. £45 for 2 adults + 2 kids" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Season</label>
              <select value={form.season} onChange={set('season')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="year_round">Year-round</option>
                <option value="spring_summer">Spring & Summer</option>
                <option value="summer_only">Summer only</option>
                <option value="autumn_winter">Autumn & Winter</option>
                <option value="school_holidays_only">School holidays only</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Typical visit duration</label>
              <input value={form.duration_typical} onChange={set('duration_typical')} placeholder="e.g. Half day, full day, 2–3 hours" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Annual pass available?</label>
              <select value={form.annual_pass_available} onChange={set('annual_pass_available')} style={inputStyle}>
                <option value="">— Not specified —</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Food options</label>
              <input value={form.food_options} onChange={set('food_options')} placeholder="e.g. Café on site + picnic area, no food sold" style={inputStyle} />
            </div>
          </div>
        )}

        {/* Photos */}
        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2D6E', marginBottom: 16 }}>Photos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
                <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => handleDeletePhoto(photo)}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            ))}
            <label style={{ aspectRatio: '1', borderRadius: 8, border: '2px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'default' : 'pointer', background: '#F9FAFB' }}>
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
              {uploading ? (
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Uploading...</div>
              ) : (
                <>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>+</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Add photo</div>
                </>
              )}
            </label>
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>Photos appear on your listing page. First photo is the cover image.</div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E5E7EB', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Pause listing</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Temporarily hide from parents (e.g. school holidays)</div>
            </div>
            <button onClick={() => setForm(prev => ({ ...prev, is_paused: !prev.is_paused }))}
              style={{ width: 48, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: form.is_paused ? '#DC2626' : '#D1D5DB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: form.is_paused ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {form.is_paused && (
            <div style={{ marginTop: 10, background: '#FEE2E2', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
              ⚠️ Your listing is currently hidden from parents
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '14px 0', background: saving ? '#9CA3AF' : '#5B2D6E', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer', marginTop: 8 }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>

        <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>
          Changes to name, location or category require manual review.
        </div>
      </div>
    </div>
  )
}
