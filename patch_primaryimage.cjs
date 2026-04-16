const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/page.js')
let src = fs.readFileSync(filePath, 'utf8')

// 1. Remove images from Promise.all and add primary_image to listings select
const oldSelect = `    supabase
      .from('listings')
      .select('id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram, created_at')
      .order('homepage_score', { ascending: false })
      .eq('is_paused', false)
      .limit(400),`

const newSelect = `    supabase
      .from('listings')
      .select('id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram, created_at, primary_image')
      .order('homepage_score', { ascending: false })
      .eq('is_paused', false)
      .limit(400),`

if (!src.includes('primary_image')) {
  src = src.replace(oldSelect, newSelect)
  console.log('✅ Added primary_image to listings select')
} else {
  console.log('⏭️ primary_image already in select, skipping')
}

// 2. Remove images from Promise.all destructure and query
const oldImagesQuery = `    { data: images },
    { data: allReviews }
  ] = await Promise.all([`

const newImagesQuery = `    { data: allReviews }
  ] = await Promise.all([`

if (src.includes('{ data: images },')) {
  src = src.replace(oldImagesQuery, newImagesQuery)
  console.log('✅ Removed images from Promise.all destructure')
}

// 3. Remove the images supabase query from Promise.all
const oldImagesSubquery = `    supabase
      .from('listing_images')
      .select('listing_id, url')
      .order('sort_order', { ascending: true })
      .limit(800),`

if (src.includes(oldImagesSubquery)) {
  src = src.replace(oldImagesSubquery, '')
  console.log('✅ Removed listing_images query')
}

// 4. Remove imageMap building code
const oldImageMap = `  const imageMap = {}
  ;(images || []).forEach(img => {
    if (!imageMap[img.listing_id]) imageMap[img.listing_id] = []
    imageMap[img.listing_id].push(img.url)
  })`

if (src.includes(oldImageMap)) {
  src = src.replace(oldImageMap, '')
  console.log('✅ Removed imageMap building code')
}

// 5. Update ealingListings map to use primary_image directly
const oldMap = `.map(l => ({ ...l, image: (imageMap[l.id] || [])[0] || null, images: imageMap[l.id] || [], recentViews: viewCounts[l.id] || 0, avgRating: reviewMap[l.id] ? (reviewMap[l.id].total / reviewMap[l.id].count).toFixed(1) : null, reviewCount: reviewMap[l.id]?.count || 0 }))`

const newMap = `.map(l => ({ ...l, image: l.primary_image || null, images: l.primary_image ? [l.primary_image] : [], recentViews: 0, avgRating: reviewMap[l.id] ? (reviewMap[l.id].total / reviewMap[l.id].count).toFixed(1) : null, reviewCount: reviewMap[l.id]?.count || 0 }))`

if (src.includes(oldMap)) {
  src = src.replace(oldMap, newMap)
  console.log('✅ Updated ealingListings to use primary_image')
} else {
  console.log('⚠️ Could not find ealingListings map — check manually')
}

fs.writeFileSync(filePath, src)
console.log('✅ patch_primaryimage.cjs done')
