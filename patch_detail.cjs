const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/ListingDetailClient.js')
let src = fs.readFileSync(filePath, 'utf8')

// 1. Add detailSignal state after visited state
const oldState = `  const [visited, setVisited] = useState(false)
  const [plannedDates, setPlannedDates] = useState([])`

const newState = `  const [visited, setVisited] = useState(false)
  const [plannedDates, setPlannedDates] = useState([])
  const [detailSignal, setDetailSignal] = useState(null)`

if (!src.includes('detailSignal')) {
  src = src.replace(oldState, newState)
  console.log('✅ Added detailSignal state')
} else {
  console.log('⏭️ detailSignal state already exists, skipping')
}

// 2. Add useEffect logic after the recently viewed useEffect
const oldEffect = `  // Load from localStorage on mount`
const newEffect = `  // Contextual social proof signal (verified only)
  useEffect(() => {
    if (!listing.verified) return
    try {
      const saved = JSON.parse(localStorage.getItem('ll_favs') || '[]')
      if (saved.includes(listing.id)) {
        setDetailSignal('💜 You saved this activity')
        return
      }
      if (listing.is_local_favourite) {
        setDetailSignal('⭐ Popular with local parents this week')
        return
      }
      const today = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()]
      const isOnToday = listing.is_daily || !listing.days_of_week || listing.days_of_week.length === 0 || (listing.days_of_week || []).includes(today)
      if (isOnToday) {
        setDetailSignal('⏰ Families are heading to this today')
        return
      }
      const isOnWeekend = listing.is_daily || (listing.days_of_week || []).some(d => ['sat','sun'].includes(d))
      if (isOnWeekend) {
        setDetailSignal('📅 Parents are planning this weekend')
        return
      }
      setDetailSignal('💜 Saved by Ealing parents')
    } catch(e) {
      setDetailSignal('💜 Saved by Ealing parents')
    }
  }, [listing])

  // Load from localStorage on mount`

if (!src.includes('Contextual social proof signal')) {
  src = src.replace(oldEffect, newEffect)
  console.log('✅ Added detailSignal useEffect')
} else {
  console.log('⏭️ detailSignal useEffect already exists, skipping')
}

// 3. Replace static popular signal with new contextual one
const oldPopular = `        {/* Social proof */}
        {listing.popular && (
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>✨ Frequently chosen by Ealing parents recently</div>
        )}`

const newPopular = `        {/* Social proof signal - verified only */}
        {detailSignal && (
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, marginBottom: 12 }}>
            {detailSignal}
          </div>
        )}`

if (!src.includes('Social proof signal - verified only')) {
  src = src.replace(oldPopular, newPopular)
  console.log('✅ Replaced static popular signal with contextual detailSignal')
} else {
  console.log('⏭️ detailSignal render already exists, skipping')
}

fs.writeFileSync(filePath, src)
console.log('✅ patch_detail.cjs done')
