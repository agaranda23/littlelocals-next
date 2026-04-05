export default function ListingCard({ listing }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #F3F4F6'
    }}>
      {listing.image && (
        <img
          src={listing.image}
          alt={listing.name}
          style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }}
        />
      )}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
          {listing.name}
          {listing.verified && (
            <img src="/verified-badge.svg" width={17} height={17} style={{ marginLeft: 5, verticalAlign: 'middle' }} alt="Verified" />
          )}
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
          {listing.type}{listing.ages ? ' · ' + listing.ages : ''}
        </div>
        {listing.price && (
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>{listing.price}</div>
        )}
      </div>
    </div>
  )
}
