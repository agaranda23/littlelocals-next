import './globals.css'

export const metadata = {
  title: 'LITTLElocals — Things to do with kids in Ealing',
  description: 'Quick ideas around Ealing for babies, toddlers and kids',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#F9FAFB', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
