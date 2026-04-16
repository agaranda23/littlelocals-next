const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app/components/HomeClient.js')
let src = fs.readFileSync(filePath, 'utf8')

src = src.replace(
  `  const [sessionSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff))`,
  `  const [sessionSeed, setSessionSeed] = useState(1234567)
  useEffect(() => { setSessionSeed(Math.floor(Math.random() * 0x7fffffff)) }, [])`
)

fs.writeFileSync(filePath, src)
console.log('done')
