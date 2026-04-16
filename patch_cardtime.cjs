const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingCard.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `{dayLabel && <div style={{ fontSize: 13, fontWeight: 600, color: '#D4732A', marginBottom: 3 }}>📅 {dayLabel}</div>}`,
  `{(dayLabel || listing.time) && (
          <div style={{ fontSize: 13, fontWeight: 600, color: '#D4732A', marginBottom: 3 }}>
            📅 {dayLabel}{dayLabel && listing.time ? ' · ' : ''}{listing.time ? listing.time.split('–')[0].trim() : ''}
          </div>
        )}`
)

fs.writeFileSync(filePath, src)
console.log('done')
