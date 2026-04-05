import { createClient } from '@supabase/supabase-js'
import Header from '../../components/Header'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function ListingPage({ params }) {
  const { slug } = await params

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!listing) return <div style={{ padding: 40, textAlign: 'center' }}>Listing not found</div>

  const { data: images } = await supabase
    .from('listing_images')
    .select('url, sort_order')
    .eq('listing_id', listing.id)
    .order('sort_order', { ascending: true })

  const isFree = listing.free || (listing.price || '').toLowerCase().includes('free')

  return (
    <>
      <Header />
      <main style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80, fontFamily: 'system-ui, sans-serif' }}>
        {images?.[0] && (
          <div style={{ height: 260, overflow: 'hidden' }}>
            <img src={images[0].url} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {listing.logo && <img src={listing.logo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: 'white', border: '1px solid #F3F4F6' }} />}
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>
              {listing.name}
              {listing.verified && <img src="/verified-badge.svg" width={18} height={18} style={{ marginLeft: 6, verticalAlign: 'middle' }} alt="Verified" />}
            </h1>
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
            {listing.type}{listing.ages ? ' · ' + listing.ages : ''}
          </div>
          {listing.price && (
            <div style={{ display: 'inline-block', fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 10, background: isFree ? '#D1FAE5' : '#FFF7ED', color: isFree ? '#065F46' : '#9A3412', marginBottom: 16 }}>
              {listing.price}
            </div>
          )}
          <div style={{ background: '#F9FAFB', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            {listing.day && <div style={{ fontSize: 14, marginBottom: 8 }}>📅 <strong>When</strong> · {listing.day}</div>}
            {listing.time && <div style={{ fontSize: 14, marginBottom: 8 }}>🕐 <strong>Time</strong> · {listing.time}</div>}
            {listing.ages && <div style={{ fontSize: 14, marginBottom: 8 }}>👶 <strong>Ages</strong> · {listing.ages}</div>}
            {listing.venue && <div style={{ fontSize: 14, marginBottom: 8 }}>📍 <strong>Venue</strong> · {listing.venue}</div>}
            {listing.location && <div style={{ fontSize: 14 }}>🗺️ <strong>Area</strong> · {listing.location}</div>}
          </div>
          {listing.description && (
            <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, marginBottom: 20 }}>
              {listing.description}
            </div>
          )}
          {listing.cta_url && (
            <a href={listing.cta_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#5B2D6E', color: 'white', textAlign: 'center', padding: '14px 20px', borderRadius: 14, fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
              {listing.cta_label || 'Book now'}
            </a>
          )}
          {listing.website && (
            <a href={listing.website} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'white', color: '#5B2D6E', textAlign: 'center', padding: '12px 20px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: '2px solid #5B2D6E' }}>
              Visit website
            </a>
          )}
        </div>
      </main>
    </>
  )
}
