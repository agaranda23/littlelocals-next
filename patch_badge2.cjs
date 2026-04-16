const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingCard.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replaceAll(
  'listing.verified && listing.image',
  'listing.verified'
)

fs.writeFileSync(filePath, src)
console.log('✅ patch_badge2.cjs done')
