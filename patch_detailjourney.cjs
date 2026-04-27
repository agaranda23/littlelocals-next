const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingDetailClient.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `        {/* Local favourite badge */}`,
  `        {/* Worth the journey badge */}
        {listing.worth_journey && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 20, padding: '6px 14px', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#92400E' }}>
            🚗 Worth the trip
          </div>
        )}

        {/* Local favourite badge */}`
)

fs.writeFileSync(filePath, src)
console.log('done')
