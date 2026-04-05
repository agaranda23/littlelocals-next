export default function ListingCard({ listing }) {
  const isFree = listing.free || (listing.price || '').toLowerCase().includes('free')

  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #F3F4F6', cursor: 'pointer' }}>
      {listing.image && (
        <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
          <img src={listing.image} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
            {listing.name}
            {listing.verified && (
              <img src="/verified-badge.svg" width={15} height={15} style={{ marginLeft: 5, verticalAlign: 'middle' }} alt="Verified" />
            )}
          </div>
          {listing.price && (
            <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: isFree ? '#D1FAE5' : '#FFF7ED', color: isFree ? '#065F46' : '#9A3412', whiteSpace: 'nowrap' }}>
              {listing.price}
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          {listing.type}{listing.ages ? ' · ' + listing.ages : ''}
        </div>
        {listing.day && (
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>📅 {listing.day}</div>
        )}
      </div>
    </div>
  )
}
