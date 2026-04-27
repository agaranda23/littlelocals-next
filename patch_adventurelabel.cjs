const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replaceAll(`'adventure', \`🚗 Adventure`, `'adventure', \`🚗 Worth the Trip`)

fs.writeFileSync(filePath, src)
console.log('done')
