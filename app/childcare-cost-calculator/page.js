import ChildcareCalculatorClient from '../components/ChildcareCalculatorClient'

export const metadata = {
  title: 'UK childcare cost calculator — 15h & 30h free hours | LITTLElocals',
  description: 'Work out roughly what nursery and childcare will cost in 2026 after the 15–30 free hours and Tax-Free Childcare. Free calculator for UK parents.',
  alternates: { canonical: 'https://littlelocals.uk/childcare-cost-calculator' },
  openGraph: {
    title: 'UK childcare cost calculator — see what you actually pay',
    description: 'Estimate your monthly nursery cost after 15–30 free hours and Tax-Free Childcare. Built for UK parents.',
    url: 'https://littlelocals.uk/childcare-cost-calculator',
    siteName: 'LITTLElocals',
    images: [{ url: 'https://littlelocals.uk/bear-logo.png', width: 512, height: 512, alt: 'LITTLElocals' }],
    locale: 'en_GB',
    type: 'website',
  },
}

export default function ChildcareCostCalculatorPage() {
  return <ChildcareCalculatorClient />
}
