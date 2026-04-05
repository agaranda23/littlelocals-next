const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/components/HomeClient.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "const [exploringCount, setExploringCount] = useState(0)",
  "const [exploringCount, setExploringCount] = useState(0)\n  const [visibleCount, setVisibleCount] = useState(6)"
);

content = content.replace(
  "{filtered.map(listing => (",
  "{filtered.slice(0, visibleCount).map(listing => ("
);

content = content.replace(
  "{/* Bottom nav */}",
  `{filtered.length > visibleCount && (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <button onClick={() => setVisibleCount(v => v + 6)} style={{ background: '#5B2D6E', color: 'white', border: 'none', borderRadius: 14, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Load more ({filtered.length - visibleCount} more)
          </button>
        </div>
      )}

      {/* Bottom nav */}`
);

content = content.replace(
  "const clearAll = () => {",
  "const clearAll = () => {\n    setVisibleCount(6)"
);

content = content.replace(
  "const [nurseryFilter, setNurseryFilter] = useState(false)",
  "const [nurseryFilter, setNurseryFilter] = useState(false)\n\n  useEffect(() => { setVisibleCount(6) }, [dayFilter, search, ageFilter, freeOnly, weatherMode, worthJourney, nurseryFilter])"
);

fs.writeFileSync(filePath, content);
console.log('Done!');
