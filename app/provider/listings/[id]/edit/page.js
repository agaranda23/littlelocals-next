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
    free_trial: '',
    whatsapp_group_url: '',
    instagram: '',
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
        .select('id, name, slug, description, price, website, free_trial, whatsapp_group_url, instagram')
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
          free_trial: l.free_trial || '',
          whatsapp_group_url: l.whatsapp_group_url || '',
          instagram: l.instagram || '',
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
    const { error } = await supabase
      .from('listings')
      .update(form)
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

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Free trial / taster info</label>
            <input value={form.free_trial} onChange={set('free_trial')} placeholder="e.g. First session free" style={inputStyle} />
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
