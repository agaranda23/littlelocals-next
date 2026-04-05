export default function Header() {
  return (
    <div style={{ background: 'white', borderBottom: '1px solid #F3F4F6', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
      <img src="/bear-logo.png" alt="LITTLElocals" style={{ width: 40, height: 40, borderRadius: 10 }} />
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.3px' }}>
        <span style={{ color: '#5B2D6E' }}>LITTLE</span><span style={{ color: '#D4732A' }}>locals</span>
      </div>
    </div>
  )
}
