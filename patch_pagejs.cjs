const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/page.js')
let src = fs.readFileSync(filePath, 'utf8')

const oldFetch = `  const { data: listings } = await supabase
    .from('listings')
    .select('id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram')
    .order('homepage_score', { ascending: false })
    .eq('is_paused', false)
    .limit(500)

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

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('listing_id, rating')

  const reviewMap = {}
  ;(allReviews || []).forEach(r => {
    if (!reviewMap[r.listing_id]) reviewMap[r.listing_id] = { total: 0, count: 0 }
    reviewMap[r.listing_id].total += r.rating
    reviewMap[r.listing_id].count += 1
  })`

const newFetch = `  // Run all independent queries in parallel
  const [
    { data: listings },
    { data: localFavData },
    { data: recentListings },
    { data: images },
    { data: allReviews }
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram, created_at')
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
      .from('listing_images')
      .select('listing_id, url')
      .order('sort_order', { ascending: true })
      .limit(800),
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
  })`

if (!src.includes('Promise.all')) {
  src = src.replace(oldFetch, newFetch)
  console.log('✅ Parallelised queries and removed listing_views serial fetch')
} else {
  console.log('⏭️ Already parallelised, skipping')
}

fs.writeFileSync(filePath, src)
console.log('✅ patch_pagejs.cjs done')
