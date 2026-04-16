const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/page.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `'id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram, created_at, primary_image'`,
  `'id, name, slug, location, type, emoji, ages, age_min, age_max, price, free, indoor, verified, popular, logo, days_of_week, is_daily, day, time, worth_journey, category, homepage_score, is_local_favourite, local_favourite_subtitle, littlelocals_offer_text, description, free_trial, lat, lng, whatsapp_group_url, instagram, created_at, primary_image'`
)

fs.writeFileSync(filePath, src)
console.log('done')
