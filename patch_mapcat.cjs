const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/MapView.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `  { label: '🧸 Nursery', keywords: ['nursery', 'playgroup', 'toddler group', 'stay and play'] },`,
  `  { label: '🧸 Nursery', keywords: ['nursery'] },`
)

fs.writeFileSync(filePath, src)
console.log('done')
