const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingCard.js')
let src = fs.readFileSync(filePath, 'utf8')

// Fix badge function
src = src.replace(
  `if (listing.verified && (listing.images?.length || 0) >= 2) return { label: 'Verified provider', icon: '✔' }`,
  `if (listing.verified && listing.image) return { label: 'Verified provider', icon: '✔' }`
)

// Fix inline badge checks
src = src.replaceAll(
  `listing.verified && (listing.images?.length || 0) >= 2`,
  `listing.verified && listing.image`
)

fs.writeFileSync(filePath, src)
console.log('✅ patch_badge.cjs done')
