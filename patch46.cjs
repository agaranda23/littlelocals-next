const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/components/ListingDetailClient.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add reviews state
code = code.replace(
  `const [lightbox, setLightbox] = React.useState(false);`,
  `const [lightbox, setLightbox] = React.useState(false);
  const [reviews, setReviews] = React.useState([]);`
);

// 2. Add reviews fetch
code = code.replace(
  `}, [listing.id]);`,
  `}, [listing.id]);

  React.useEffect(() => {
    if (!listing?.id) return;
    supabase
      .from('reviews')
      .select('id, reviewer_name, rating, review_text, created_at')
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data); });
  }, [listing.id]);`
);

// 3. Inject reviews section before the lightbox
const reviewsSection = \`
      {/* Reviews */}
      {reviews.length > 0 && (() => {
        const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
        return (
          <div style={{ margin: '0 16px 24px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>⭐ {avg}</span>
              <span style={{ fontSize: 14, color: '#6B7280' }}>· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>{'⭐'.repeat(r.rating)}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{r.reviewer_name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{r.review_text}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
\`;

code = code.replace(
  \`      {/* Lightbox */}\`,
  reviewsSection + \`\n      {/* Lightbox */}\`
);

fs.writeFileSync(filePath, code);
console.log('patch46 applied ✅');
