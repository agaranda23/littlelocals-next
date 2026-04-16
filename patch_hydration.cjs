const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `  const [savedIds, setSavedIds] = useState(new Set())`,
  `  const [savedIds, setSavedIds] = useState(new Set())
  const [mounted, setMounted] = useState(false)`
)

src = src.replace(
  `  useEffect(() => { setCurrentPage(1) }, [dayFilter, search, ageFilter, freeOnly, weatherMode, worthJourney, nurseryFilter])`,
  `  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setCurrentPage(1) }, [dayFilter, search, ageFilter, freeOnly, weatherMode, worthJourney, nurseryFilter])`
)

src = src.replace(
  `      {/* Day context line */}`,
  `      {/* Day context line - client only to avoid hydration mismatch */}`
)

src = src.replace(
  `        const line = getDayContextLine(dayFilter, count)
        if (!line) return null
        return (`,
  `        const line = getDayContextLine(dayFilter, count)
        if (!mounted || !line) return null
        return (`
)

fs.writeFileSync(filePath, src)
console.log('done')
