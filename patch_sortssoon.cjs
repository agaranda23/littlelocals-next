const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// 1. Add parseStartMinutes helper before getDayContextLine
src = src.replace(
  `function getDayContextLine(`,
  `function parseStartMinutes(timeStr) {
  if (!timeStr) return null
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)/i)
    if (!match) return null
    let hours = parseInt(match[1])
    const mins = parseInt(match[2])
    const period = match[3].toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + mins
  } catch(e) { return null }
}

function getDayContextLine(`
)

// 2. Add Starts soon to sort dropdown
src = src.replace(
  `            <option value="price">💰 Price</option>`,
  `            <option value="price">💰 Price</option>
            <option value="startssoon">⏰ Starts soon</option>`
)

// 3. Add Starts soon sort logic
src = src.replace(
  `    // recommended — verified with images first, per-session shuffle within tiers`,
  `    if (sortBy === 'startssoon') {
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
      const getStartMins = (l) => {
        const m = parseStartMinutes(l.time)
        if (m === null) return 9999
        const diff = m - nowMins
        return diff >= -90 ? diff : 9999
      }
      return getStartMins(a) - getStartMins(b)
    }
    // recommended — verified with images first, per-session shuffle within tiers`
)

fs.writeFileSync(filePath, src)
console.log('done')
