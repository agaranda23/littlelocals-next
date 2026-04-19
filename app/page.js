export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Header from './components/Header'
import HomeClient from './components/HomeClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const EALING_BOROUGH = ['Ealing','Hanwell','West Ealing','North Ealing','South Ealing','Hanger Hill','Northfields','Pitshanger','Perivale','Acton','Chiswick','Greenford','Northolt','Southall','Yeading','Hayes']

export default async function HomePage() {
  // Run all independent queries in parallel
  const [
    { data: listings },
    { data: localFavData },
    { data: recentListings },
    { data: allReviews }
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, time, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram, created_at, primary_image, temporarily_closed')
      .order('homepage_score', { ascending: false })
      .eq('is_paused', false)
      .limit(400),
    supabase
      .from('listings')
      .select('id, name, slug, type, price, free, verified, logo, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text')
      .eq('is_local_favourite', true)
      .limit(1),
    supabase
      .from('listings')
      .select('id, name, slug, type')
      .order('created_at', { ascending: false })
      .limit(12),

    supabase
      .from('reviews')
      .select('listing_id, rating')
      .limit(500)
  ])

  // viewCounts stubbed — not worth a serial query on every load
  const viewCounts = {}

  const reviewMap = {}
  ;(allReviews || []).forEach(r => {
    if (!reviewMap[r.listing_id]) reviewMap[r.listing_id] = { total: 0, count: 0 }
    reviewMap[r.listing_id].total += r.rating
    reviewMap[r.listing_id].count += 1
  })

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



  // Filter to Ealing borough only, keep worth_journey listings too
  const ealingListings = (listings || [])
    .filter(l => l.worth_journey || EALING_BOROUGH.some(a => (l.location || '').includes(a)))
    .map(l => ({ ...l, image: l.primary_image || null, images: l.primary_image ? [l.primary_image] : [], recentViews: 0, avgRating: reviewMap[l.id] ? (reviewMap[l.id].total / reviewMap[l.id].count).toFixed(1) : null, reviewCount: reviewMap[l.id]?.count || 0 }))

  return (
    <>
      <Header />
      <HomeClient listings={ealingListings} recentListings={recentListings || []} localFav={localFav} viewCounts={viewCounts} />
    </>
  )
}
