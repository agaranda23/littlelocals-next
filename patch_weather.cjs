const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// Replace the weather parsing to include emoji and better descriptions
src = src.replace(
  `        const temp = Math.round(d.current_weather?.temperature || 0)
        const code = d.current_weather?.weathercode || 0
        const isRainy = code >= 51
        setWeather({ temp, isRainy, desc: isRainy ? 'and rainy' : 'and sunny' })`,
  `        const temp = Math.round(d.current_weather?.temperature || 0)
        const code = d.current_weather?.weathercode || 0
        const isRainy = code >= 51
        const getWeatherEmoji = (c) => {
          if (c === 0) return { emoji: '☀️', desc: 'and sunny' }
          if (c <= 2) return { emoji: '🌤️', desc: 'and mostly sunny' }
          if (c === 3) return { emoji: '☁️', desc: 'and cloudy' }
          if (c <= 49) return { emoji: '🌫️', desc: 'and foggy' }
          if (c <= 59) return { emoji: '🌦️', desc: 'and drizzly' }
          if (c <= 69) return { emoji: '🌧️', desc: 'and rainy' }
          if (c <= 79) return { emoji: '🌨️', desc: 'and snowy' }
          if (c <= 82) return { emoji: '🌧️', desc: 'and showery' }
          if (c <= 84) return { emoji: '🌨️', desc: 'and hail showers' }
          if (c <= 94) return { emoji: '⛈️', desc: 'and stormy' }
          return { emoji: '⛈️', desc: 'and thundery' }
        }
        const { emoji, desc } = getWeatherEmoji(code)
        setWeather({ temp, isRainy, desc, emoji })`
)

// Update the greeting display to use emoji
src = src.replace(
  `{weather && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{weather.temp}°C {weather.desc}</div>}`,
  `{weather && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{weather.emoji} {weather.temp}°C {weather.desc}</div>}`
)

// Update getGreeting to use emoji too
src = src.replace(
  `function getGreeting(weather) {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return weather?.isRainy ? '🌧️ Rainy morning — easy indoor ideas below' : '🌤️ Good morning, Ealing parents'
  if (h >= 12 && h < 18) return weather?.isRainy ? '🌧️ Rainy afternoon — indoor ideas below' : '👋 Afternoon, Ealing parents'
  return '🌙 Planning ahead with the kids?'
}`,
  `function getGreeting(weather) {
  const h = new Date().getHours()
  const emoji = weather?.emoji || (weather?.isRainy ? '🌧️' : '👋')
  if (h >= 5 && h < 12) return weather?.isRainy ? \`\${emoji} Rainy morning — indoor ideas below\` : \`🌤️ Good morning, Ealing parents\`
  if (h >= 12 && h < 18) return weather?.isRainy ? \`\${emoji} Rainy afternoon — indoor ideas below\` : \`👋 Afternoon, Ealing parents\`
  return '🌙 Planning ahead with the kids?'
}`
)

fs.writeFileSync(filePath, src)
console.log('done')
