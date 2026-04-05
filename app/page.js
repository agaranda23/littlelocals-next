import { createClient } from '@supabase/supabase-js'
import ListingCard from './components/ListingCard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function HomePage() {
  const { data: listings } = await supabase
    .from('listings')
    .select('id, name, slug, location, type, emoji, ages, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score')
    .eq('location', 'Ealing')
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
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 4 }}>
        <span style={{ color: '#5B2D6E' }}>LITTLE</span>locals
      </h1>
      <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 15 }}>
        Quick ideas around Ealing for babies, toddlers and kids
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {enriched.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </main>
  )
}
