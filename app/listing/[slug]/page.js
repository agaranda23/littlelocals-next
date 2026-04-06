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
    .select('name, description, type, location, ages')
    .eq('slug', slug)
    .single()
  if (!listing) return { title: 'LITTLElocals' }
  const title = `${listing.name} — Kids Activities in ${listing.location || 'Ealing'} | LITTLElocals`
  const description = listing.description || `${listing.name} is a ${listing.type} activity in ${listing.location || 'Ealing'}${listing.ages ? ' for ' + listing.ages : ''}. Find kids activities near you on LITTLElocals.`
  return {
    title,
    description,
    openGraph: { title, description, siteName: 'LITTLElocals' },
    twitter: { card: 'summary', title, description },
  }
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
      <Header />
      <ListingDetailClient listing={listing} images={images || []} relatedListings={relatedListings} />
    </>
  )
}
