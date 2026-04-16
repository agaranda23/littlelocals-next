const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])`,
  `  const [calMonth, setCalMonth] = useState(0)
  const [calYear, setCalYear] = useState(2026)
  const [selectedDate, setSelectedDate] = useState('')`
)

fs.writeFileSync(filePath, src)
console.log('done')
