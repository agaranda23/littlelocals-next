import { createClient } from '@supabase/supabase-js'
import Header from '../../components/Header'
import ListingDetailClient from '../../components/ListingDetailClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function generateMetadata({ params }) {
  const { slug } = await params
  const { data: listing } = await supabase
    .from('listings')
    .select('id, name, description, type, location, ages')
    .eq('slug', slug)
    .single()
  if (!listing) return { title: 'LITTLElocals' }
  const title = `${listing.name} — Kids Activities in ${listing.location || 'Ealing'} | LITTLElocals`
  const description = listing.description
    ? listing.description.slice(0, 155) + (listing.description.length > 155 ? '...' : '')
    : `${listing.name} is a ${listing.type} activity in ${listing.location || 'Ealing'}${listing.ages ? ' for ' + listing.ages : ''}. Find kids activities near you on LITTLElocals.`

  // Get cover image
  const { data: imgData } = await supabase
    .from('listing_images')
    .select('url')
    .eq('listing_id', listing.id)
    .order('sort_order', { ascending: true })
    .limit(1)
  const ogImage = imgData?.[0]?.url || 'https://littlelocals.uk/bear-logo.png'
  const url = `https://littlelocals.uk/listing/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'LITTLElocals',
      images: [{ url: ogImage, width: 1200, height: 630, alt: listing.name }],
      type: 'website',
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

// Map our category to a Schema.org type. Default LocalBusiness when uncertain
// — Google still understands the listing as a real business with reviews,
// hours and location. Picking a specific sub-type just adds richer hints.
function schemaTypeForCategory(category, type) {
  const cat = (category || '').toLowerCase()
  const typ = (type || '').toLowerCase()
  if (cat === 'nursery') return 'PreSchool'
  if (cat === 'soft play') return 'AmusementPark'
  if (cat === 'attraction' || cat === 'days out' || typ.includes('attraction')) return 'TouristAttraction'
  if (cat === 'park') return 'Park'
  if (cat === 'event') return 'Event'
  return 'LocalBusiness'
}

function buildOpeningHoursSpec(listing) {
  // Best-effort: nurseries use opens_at/closes_at + days; classes use day + time strings.
  // If both ends of a window are present we emit OpeningHoursSpecification entries.
  if (!listing.opens_at || !listing.closes_at) return null
  const DAY_MAP = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' }
  const days = Array.isArray(listing.days_of_week) && listing.days_of_week.length > 0
    ? listing.days_of_week.map(d => DAY_MAP[d]).filter(Boolean)
    : listing.is_daily
      ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
      : ['Monday','Tuesday','Wednesday','Thursday','Friday']
  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: days,
    opens: listing.opens_at,
    closes: listing.closes_at,
  }
}

function buildListingJsonLd(listing, slug, primaryImage) {
  const schemaType = schemaTypeForCategory(listing.category, listing.type)
  const url = `https://littlelocals.uk/listing/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: listing.name,
    url,
  }
  if (listing.description) jsonLd.description = listing.description.slice(0, 500)
  if (primaryImage) jsonLd.image = primaryImage
  if (listing.venue) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      streetAddress: listing.venue,
      addressLocality: listing.location || 'Ealing',
      addressRegion: 'London',
      addressCountry: 'GB',
    }
  }
  if (listing.lat && listing.lng) {
    jsonLd.geo = { '@type': 'GeoCoordinates', latitude: listing.lat, longitude: listing.lng }
  }
  if (listing.price) jsonLd.priceRange = listing.price
  const hours = buildOpeningHoursSpec(listing)
  if (hours) jsonLd.openingHoursSpecification = hours
  if (listing.google_rating && listing.google_review_count) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(listing.google_rating).toFixed(1),
      reviewCount: listing.google_review_count,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return jsonLd
}

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

  const primaryImage = listing.primary_image || images?.[0]?.url || null
  const jsonLd = buildListingJsonLd(listing, slug, primaryImage)

  // Fetch cross links
  const { data: crossLinksA } = await supabase
    .from('cross_links')
    .select('listing_id_b')
    .eq('listing_id_a', listing.id)
    .limit(5)

  const { data: crossLinksB } = await supabase
    .from('cross_links')
    .select('listing_id_a')
    .eq('listing_id_b', listing.id)
    .limit(5)

  const crossLinks = [...(crossLinksA || []).map(c => ({ id: c.listing_id_b })), ...(crossLinksB || []).map(c => ({ id: c.listing_id_a }))]

  let relatedListings = []
  if (crossLinks && crossLinks.length > 0) {
    const ids = crossLinks.map(c => c.id)
    const { data: related } = await supabase
      .from('listings')
      .select('id, name, slug, type, day, venue')
      .in('id', ids)
    relatedListings = related || []
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <ListingDetailClient listing={listing} images={images || []} relatedListings={relatedListings} />
    </>
  )
}
