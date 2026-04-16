const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingDetailClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// Fix lightbox state - use null instead of false so 0 is valid
src = src.replace(
  `  const [lightbox, setLightbox] = useState(false)`,
  `  const [lightbox, setLightbox] = useState(null)`
)

// Fix lightbox condition - check for null instead of falsy
src = src.replace(
  `      {lightbox && (`,
  `      {lightbox !== null && (`
)

// Fix close lightbox
src = src.replace(
  `        <div onClick={() => setLightbox(false)} style={{ position: 'fixed',`,
  `        <div onClick={() => setLightbox(null)} style={{ position: 'fixed',`
)

src = src.replace(
  `      <button onClick={() => setLightbox(false)} style={{ position: 'absolute',`,
  `      <button onClick={() => setLightbox(null)} style={{ position: 'absolute',`
)

fs.writeFileSync(filePath, src)
console.log('done')
