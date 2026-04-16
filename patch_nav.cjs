const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replaceAll(
  `padding: '6px 0 16px'`,
  `padding: '4px 0 8px'`
)

fs.writeFileSync(filePath, src)
console.log('done')
