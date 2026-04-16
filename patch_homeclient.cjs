const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// Add getDayContextLine function after getGreeting function
const oldGreeting = `export default function HomeClient(`
const newGreeting = `function getDayContextLine(dayFilter, count) {
  const h = new Date().getHours()
  if (dayFilter === 'today') {
    if (h >= 6 && h < 12) return \`\${count} things happening this morning in Ealing\`
    if (h >= 12 && h < 17) return \`\${count} things happening this afternoon in Ealing\`
    if (h >= 17) return \`\${count} things happening later today in Ealing\`
    return \`\${count} things happening today in Ealing\`
  }
  if (dayFilter === 'tomorrow') return \`\${count} things happening tomorrow in Ealing\`
  if (dayFilter === 'weekend') return \`\${count} things on this weekend in Ealing\`
  if (dayFilter === 'week') return \`\${count} things happening this week in Ealing\`
  return null
}

export default function HomeClient(`

if (!src.includes(newGreeting)) {
  src = src.replace(oldGreeting, newGreeting)
  console.log('✅ Added getDayContextLine function')
} else {
  console.log('⏭️ getDayContextLine already exists, skipping')
}

// Add context line render after day tabs
const oldDayTabs = `      {/* Filter chips */}`
const newDayTabs = `      {/* Day context line */}
      {(() => {
        const count = dayFilter === 'today' ? todayCount : dayFilter === 'tomorrow' ? tomorrowCount : dayFilter === 'weekend' ? weekendCount : weekCount
        const line = getDayContextLine(dayFilter, count)
        if (!line) return null
        return (
          <div style={{ padding: '0 20px 8px', fontSize: 13, color: '#D4732A', fontWeight: 600 }}>
            📍 {line}
          </div>
        )
      })()}

      {/* Filter chips */}`

if (!src.includes('Day context line')) {
  src = src.replace(oldDayTabs, newDayTabs)
  console.log('✅ Added day context line render')
} else {
  console.log('⏭️ Day context line already exists, skipping')
}

fs.writeFileSync(filePath, src)
console.log('✅ patch_homeclient.cjs done')
