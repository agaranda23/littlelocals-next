import { createClient } from '@supabase/supabase-js'
import ListingCard from './components/ListingCard'
import Header from './components/Header'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function HomePage() {
  const { data: listings } = await supabase
    .from('listings')
    .select('id, name, slug, location, type, emoji, ages, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score')
    .order('homepage_score', { ascending: false })
    .limit(24)

  const { data: images } = await supabase
    .from('listing_images')
    .select('listing_id, url')
    .order('sort_order', { ascending: true })
    .in('listing_id', (listings || []).map(l => l.id))

  const imageMap = {}
  ;(images || []).forEach(img => {
    if (!imageMap[img.listing_id]) imageMap[img.listing_id] = img.url
  })

  const enriched = (listings || []).map(l => ({
    ...l,
    image: imageMap[l.id] || null
  }))

  return (
    <>
      <Header />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 100px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 4, marginTop: 8 }}>
            What shall we do today?
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
            Quick ideas around Ealing for babies, toddlers and kids
          </p>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none', marginBottom: 8 }}>
          {['Today', 'This weekend', 'Free', 'Outdoor', 'Indoor', '🏫 Nurseries'].map(chip => (
            <span key={chip} style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20, background: 'white', color: '#6B7280', border: '1px solid #E5E7EB', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              {chip}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {enriched.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </main>
    </>
  )
}
