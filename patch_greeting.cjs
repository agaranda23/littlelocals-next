const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// Fix headline - use static fallback until mounted
src = src.replace(
  `<h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>{getHeadline()}</h1>`,
  `<h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>{mounted ? getHeadline() : 'What shall we do today?'}</h1>`
)

// Fix greeting
src = src.replace(
  `<div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{getGreeting(weather)}</div>`,
  `<div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{mounted ? getGreeting(weather) : '👋 Hello, Ealing parents'}</div>`
)

fs.writeFileSync(filePath, src)
console.log('done')
