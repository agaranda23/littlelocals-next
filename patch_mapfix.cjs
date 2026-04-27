const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/MapView.js')
let src = fs.readFileSync(filePath, 'utf8')

// Fix: use a longer delay and check map is ready before adding markers
src = src.replace(
  `      mapInstanceRef.current = map
      updateMarkers(L, map, listings)
      // Re-run with filtered after initial load
      setTimeout(() => {
        if (mapInstanceRef.current) updateMarkers(L, mapInstanceRef.current, listings.filter(l => l.lat && l.lng))
      }, 100)`,
  `      mapInstanceRef.current = map
      // Wait for map to be fully ready before adding markers
      map.whenReady(() => {
        setTimeout(() => {
          updateMarkers(L, map, listings.filter(l => l.lat && l.lng))
        }, 200)
      })`
)

fs.writeFileSync(filePath, src)
console.log('done')
