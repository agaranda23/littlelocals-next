import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'LITTLElocals — Things to do with kids in Ealing',
  description: 'Quick ideas around Ealing for babies, toddlers and kids',
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
