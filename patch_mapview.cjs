const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/MapView.js')
let src = fs.readFileSync(filePath, 'utf8')

// Fix the second useEffect to check Leaflet is loaded and map exists
src = src.replace(
  `  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    updateMarkers(window.L, mapInstanceRef.current, filtered)
  }, [filtered.length, activeCategory, search])`,
  `  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    updateMarkers(window.L, mapInstanceRef.current, filtered)
  }, [filtered.length, activeCategory, search, listings.length])`
)

// Fix initial load - pass all listings first, then filtered will take over
src = src.replace(
  `      updateMarkers(L, map, listings)`,
  `      updateMarkers(L, map, listings)
      // Re-run with filtered after initial load
      setTimeout(() => {
        if (mapInstanceRef.current) updateMarkers(L, mapInstanceRef.current, listings.filter(l => l.lat && l.lng))
      }, 100)`
)

fs.writeFileSync(filePath, src)
console.log('done')
