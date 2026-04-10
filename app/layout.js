import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'LITTLElocals — Things to do with kids in Ealing',
  description: 'Discover the best activities for babies, toddlers and kids in Ealing. Classes, soft play, parks, nurseries and more — all in one place.',
  themeColor: '#5C4B6B',
  manifest: '/manifest.json',
  icons: {
    icon: '/bear-logo.png',
    apple: '/bear-logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LITTLElocals',
  },
  alternates: { canonical: 'https://littlelocals.uk' },
  openGraph: {
    title: 'LITTLElocals — Things to do with kids in Ealing',
    description: 'Discover the best activities for babies, toddlers and kids in Ealing. Classes, soft play, parks, nurseries and more — all in one place.',
    url: 'https://littlelocals.uk',
    siteName: 'LITTLElocals',
    images: [{ url: 'https://littlelocals.uk/bear-logo.png', width: 512, height: 512, alt: 'LITTLElocals' }],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'LITTLElocals — Things to do with kids in Ealing',
    description: 'Discover the best activities for babies, toddlers and kids in Ealing.',
    images: ['https://littlelocals.uk/bear-logo.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-Z2FJ3TC5WQ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Z2FJ3TC5WQ');
        `}</Script>
      </head>
      <body style={{ margin: 0, background: '#F9FAFB', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
