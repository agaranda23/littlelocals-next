const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingCard.js')
let src = fs.readFileSync(filePath, 'utf8')

// Add imgFit state after the existing states at top of component
src = src.replace(
  `  const [currentImage, setCurrentImage] = useState(allImages[0] || null)`,
  `  const [currentImage, setCurrentImage] = useState(allImages[0] || null)
  const [imgFit, setImgFit] = useState('cover')
  const [imgBg, setImgBg] = useState('transparent')

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target
    const ratio = naturalWidth / naturalHeight
    if (ratio <= 0.9) {
      setImgFit('contain')
      setImgBg('#F3F4F6')
    } else {
      setImgFit('cover')
      setImgBg('transparent')
    }
  }`
)

// Update the img element to use dynamic fit and add onLoad
src = src.replace(
  `<img src={currentImage} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#F3F4F6', display: 'block' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />`,
  `<img src={currentImage} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: imgFit, background: imgBg, display: 'block' }} onLoad={handleImageLoad} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />`
)

fs.writeFileSync(filePath, src)
console.log('done')
