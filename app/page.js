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
    .select('id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score')
    .order('homepage_score', { ascending: false })
    .limit(200)

  const { data: images } = await supabase
    .from('listing_images')
    .select('listing_id, url')
    .order('sort_order', { ascending: true })
    .in('listing_id', (listings || []).map(l => l.id))

  const imageMap = {}
  ;(images || []).forEach(img => {
    if (!imageMap[img.listing_id]) imageMap[img.listing_id] = img.url
  })

  // Filter to Ealing borough only, keep worth_journey listings too
  const ealingListings = (listings || [])
    .filter(l => l.worth_journey || EALING_BOROUGH.some(a => (l.location || '').includes(a)))
    .map(l => ({ ...l, image: imageMap[l.id] || null }))

  return (
    <>
      <Header />
      <HomeClient listings={ealingListings} />
    </>
  )
}
