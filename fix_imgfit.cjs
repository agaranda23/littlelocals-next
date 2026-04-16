const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingCard.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `objectFit: 'cover', objectPosition: 'top', display: 'block' }}`,
  `objectFit: 'cover', display: 'block' }}`
)

fs.writeFileSync(filePath, src)
console.log('done')
