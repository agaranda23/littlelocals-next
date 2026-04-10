import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function sitemap() {
  const { data: listings } = await supabase
    .from('listings')
    .select('slug, created_at')
    .order('homepage_score', { ascending: false })
    .limit(500)

  const listingUrls = (listings || []).map(l => ({
    url: `https://littlelocals.uk/listing/${l.slug}`,
    lastModified: l.created_at ? new Date(l.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://littlelocals.uk',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...listingUrls,
  ]
}
