const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// 1. Remove the day context line block above filter chips
src = src.replace(
  `      {/* Day context line - client only to avoid hydration mismatch */}
      {mounted && (() => {
        const count = dayFilter === 'today' ? todayCount : dayFilter === 'tomorrow' ? tomorrowCount : dayFilter === 'weekend' ? weekendCount : weekCount
        const line = getDayContextLine(dayFilter, count)
        if (!mounted || !line) return null
        return (
          <div style={{ padding: '0 20px 8px', fontSize: 13, color: '#D4732A', fontWeight: 600 }}>
            📍 {line}
          </div>
        )
      })()}`,
  ``
)

// 2. Replace the plain count text with styled orange version
src = src.replace(
  `<span style={{ fontSize: 13, color: '#6B7280' }}>{filtered.length} activities for families in Ealing this week</span>`,
  `{mounted && <span style={{ fontSize: 13, color: '#D4732A', fontWeight: 600 }}>📍 {getDayContextLine(dayFilter, filtered.length) || filtered.length + ' activities in Ealing'}</span>}`
)

fs.writeFileSync(filePath, src)
console.log('done')
