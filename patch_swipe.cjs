const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingDetailClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// Add touch state variables after lightbox state
src = src.replace(
  `  const [lightbox, setLightbox] = useState(null)`,
  `  const [lightbox, setLightbox] = useState(null)
  const [touchStartX, setTouchStartX] = useState(null)`
)

// Replace the lightbox image container with swipe-enabled version
src = src.replace(
  `            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url?.endsWith('.mp4') ? <video src={images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url} controls autoPlay style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 8 }} onClick={e => e.stopPropagation()} /> : <img src={images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />}
            </div>`,
  `            <div
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={e => {
                if (touchStartX === null) return
                const diff = touchStartX - e.changedTouches[0].clientX
                if (Math.abs(diff) > 50) {
                  const idx = typeof lightbox === 'number' ? lightbox : 0
                  if (diff > 0 && idx < images.length - 1) setLightbox(idx + 1)
                  if (diff < 0 && idx > 0) setLightbox(idx - 1)
                }
                setTouchStartX(null)
              }}
              onClick={e => e.stopPropagation()}
            >
              {images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url?.endsWith('.mp4') ? <video src={images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url} controls autoPlay style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 8 }} /> : <img src={images[typeof lightbox === 'number' ? lightbox : imgIdx]?.url} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />}
            </div>`
)

fs.writeFileSync(filePath, src)
console.log('done')
