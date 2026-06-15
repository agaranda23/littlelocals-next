export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Header from '../components/Header'
import NurseriesClient from '../components/NurseriesClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const metadata = {
  title: 'Nurseries in Ealing — Ofsted-rated childcare | LITTLElocals',
  description: 'Browse Ofsted-rated nurseries in Ealing and West London. Filter by Ofsted rating, funded hours accepted (15h / 30h free childcare), age groups and opening hours.',
  alternates: { canonical: 'https://littlelocals.uk/nurseries' },
  openGraph: {
    title: 'Nurseries in Ealing — Ofsted-rated childcare',
    description: 'Browse Ofsted-rated nurseries in Ealing and West London. Filter by funded hours, age groups, Ofsted rating.',
    url: 'https://littlelocals.uk/nurseries',
    siteName: 'LITTLElocals',
    images: [{ url: 'https://littlelocals.uk/bear-logo.png', width: 512, height: 512, alt: 'LITTLElocals' }],
    locale: 'en_GB',
    type: 'website',
  },
}

export default async function NurseriesPage() {
  const { data: nurseries } = await supabase
    .from('listings')
    .select('id, name, slug, location, venue, primary_image, logo, ages, age_min, age_max, verified, description, ofsted_rating, ofsted_report_url, ofsted_inspection_date, funded_hours, opens_at, closes_at, term_time_only, meals_included, nursery_fee, waitlist_status, created_at')
    .ilike('category', 'nursery')
    .eq('is_paused', false)
    .order('homepage_score', { ascending: false, nullsLast: true })

  return (
    <>
      <Header />
      <NurseriesClient nurseries={nurseries || []} />
    </>
  )
}
