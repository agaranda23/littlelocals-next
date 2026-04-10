const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LittleLocals <hello@littlelocals.uk>',
      to,
      subject,
      html,
    })
  })
  return res.json()
}

exports.handler = async function() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get all approved providers with their listings
  const { data: providers } = await supabase
    .from('providers')
    .select('id, name, email, listing_owners(listing_id, listings(id, name, slug, updated_at, description, logo, website, instagram))')
    .eq('approved', true)

  if (!providers || providers.length === 0) return { statusCode: 200, body: 'No providers' }

  let nudgesSent = 0

  for (const provider of providers) {
    const listings = (provider.listing_owners || []).map(lo => lo.listings).filter(Boolean)
    
    for (const listing of listings) {
      // Check completeness
      const { data: imgs } = await supabase
        .from('listing_images')
        .select('id')
        .eq('listing_id', listing.id)
      
      const imageCount = imgs?.length || 0
      const score = [
        imageCount >= 1 ? 15 : 0,
        imageCount >= 3 ? 20 : 0,
        listing.logo ? 10 : 0,
        listing.description ? 15 : 0,
        listing.website ? 10 : 0,
        listing.instagram ? 5 : 0,
      ].reduce((a, b) => a + b, 0)

      const isStale = listing.updated_at < thirtyDaysAgo
      const isIncomplete = score < 70

      if (!isStale && !isIncomplete) continue

      const subject = isStale
        ? `Your LittleLocals listing hasn't been updated in 30 days`
        : `Your LittleLocals listing is ${score}% complete`

      const html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="font-size: 24px; font-weight: 900; color: #5B2D6E; margin-bottom: 8px;">🏡 LittleLocals</div>
          <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 16px;">Hi ${provider.name},</div>
          ${isStale ? `
          <p style="color: #374151; line-height: 1.6;">Your listing <strong>${listing.name}</strong> hasn't been updated in over 30 days. Parents love fresh listings — keeping yours up to date helps more families find you.</p>
          ` : `
          <p style="color: #374151; line-height: 1.6;">Your listing <strong>${listing.name}</strong> is <strong>${score}% complete</strong>. Listings with more info get more views from parents.</p>
          `}
          <a href="https://littlelocals.uk/provider/listings/${listing.id}/edit"
            style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #5B2D6E; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
            Update your listing →
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #9CA3AF;">You're receiving this because you claimed a listing on LittleLocals. <a href="https://littlelocals.uk" style="color: #5B2D6E;">Visit LittleLocals</a></p>
        </div>
      `

      await sendEmail(provider.email, subject, html)
      nudgesSent++
    }
  }

  return { statusCode: 200, body: `Sent ${nudgesSent} nudges` }
}
