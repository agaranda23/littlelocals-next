import { createClient } from '@supabase/supabase-js'
import Header from './components/Header'
import HomeClient from './components/HomeClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const EALING_BOROUGH = ['Ealing','Hanwell','West Ealing','North Ealing','South Ealing','Hanger Hill','Northfields','Pitshanger','Perivale','Acton','Chiswick','Greenford','Northolt','Southall','Yeading','Hayes']

export default async function HomePage() {
  const { data: listings } = await supabase
    .from('listings')
    .select('id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram')
    .order('homepage_score', { ascending: false })
    .limit(200)

  const { data: localFavData } = await supabase
    .from('listings')
    .select('id, name, slug, type, price, free, verified, logo, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text')
    .eq('is_local_favourite', true)
    .limit(1)

  // Get recently viewed listing IDs (last 7 days)
  const { data: recentViews } = await supabase
    .from('listing_views')
    .select('listing_id')
    .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500)

  const viewCounts = {}
  ;(recentViews || []).forEach(v => {
    viewCounts[v.listing_id] = (viewCounts[v.listing_id] || 0) + 1
  })

  const { data: recentListings } = await supabase
    .from('listings')
    .select('id, name, slug, type')
    .order('created_at', { ascending: false })
    .limit(12)

  const { data: images } = await supabase
    .from('listing_images')
    .select('listing_id, url')
    .order('sort_order', { ascending: true })
    .in('listing_id', (listings || []).map(l => l.id))

  const localFav = localFavData?.[0] || null
  if (localFav) {
    const { data: favImg } = await supabase
      .from('listing_images')
      .select('url')
      .eq('listing_id', localFav.id)
      .order('sort_order', { ascending: true })
      .limit(1)
    if (favImg?.[0]) localFav.image = favImg[0].url
  }

  const imageMap = {}
  ;(images || []).forEach(img => {
    if (!imageMap[img.listing_id]) imageMap[img.listing_id] = img.url
  })

  // Filter to Ealing borough only, keep worth_journey listings too
  const ealingListings = (listings || [])
    .filter(l => l.worth_journey || EALING_BOROUGH.some(a => (l.location || '').includes(a)))
    .map(l => ({ ...l, image: imageMap[l.id] || null, recentViews: viewCounts[l.id] || 0 }))

  return (
    <>
      <Header />
      <HomeClient listings={ealingListings} recentListings={recentListings || []} localFav={localFav} viewCounts={viewCounts} />
    </>
  )
}
