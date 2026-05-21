export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import ForProvidersClient from '../components/ForProvidersClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const metadata = {
  title: 'List your activity on LITTLElocals — for providers',
  description: 'Get your kids’ class, club, nursery or play space in front of local families on LITTLElocals. Free to list, no commission.',
  alternates: { canonical: 'https://littlelocals.uk/for-providers' },
  openGraph: {
    title: 'List your activity on LITTLElocals',
    description: 'Reach local families discovering kids’ activities in Ealing and West London. Free to list.',
    url: 'https://littlelocals.uk/for-providers',
    siteName: 'LITTLElocals',
    images: [{ url: 'https://littlelocals.uk/bear-logo.png', width: 512, height: 512, alt: 'LITTLElocals' }],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'List your activity on LITTLElocals',
    description: 'Reach local families discovering kids’ activities. Free to list.',
    images: ['https://littlelocals.uk/bear-logo.png'],
  },
}

export default async function ForProvidersPage() {
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('is_paused', false)

  return <ForProvidersClient activityCount={count || 0} />
}
