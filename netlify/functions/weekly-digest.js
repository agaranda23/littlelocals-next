const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

// Weekly "This weekend in Ealing" digest. Scheduled by Netlify to run
// Wednesdays at 8am UTC (9am BST / 8am GMT in the UK) so parents get
// it during the morning-coffee planning window.
//
// Curation logic (no admin curation required for MVP):
//   1. Hot this weekend  → 3 listings, worth_journey OR sat/sun day, by homepage_score
//   2. New on LITTLElocals → 2 listings added in the past 14 days
//   3. Featured pick     → 1 listing where is_local_favourite=true (optional)
//
// Sending: iterates all subscribers with status='active' and
// last_sent_at older than 6 days. Updates last_sent_at after each send
// so a re-trigger (or a partial crash) won't double-send.

exports.config = {
  schedule: '0 8 * * 3', // Wednesday 8am UTC
};

const FROM = 'LittleLocals <hello@littlelocals.uk>';
const ADMIN = 'hello@littlelocals.uk';

const EALING_BOROUGH = ['Ealing','Hanwell','West Ealing','North Ealing','South Ealing','Hanger Hill','Northfields','Pitshanger','Perivale','Acton','Chiswick','Greenford','Northolt','Southall','Yeading','Hayes'];

function isInEaling(l) {
  return l.worth_journey || EALING_BOROUGH.some(a => (l.location || '').includes(a));
}

function isWeekendListing(l) {
  if (l.is_daily) return true;
  if (!Array.isArray(l.days_of_week)) return false;
  return l.days_of_week.includes('sat') || l.days_of_week.includes('sun');
}

function fmtPrice(l) {
  if (l.free) return 'Free';
  if (l.price) return l.price;
  return null;
}

function listingCardHtml(l, sample = false) {
  const url = `https://littlelocals.uk/listing/${l.slug}`;
  const img = l.primary_image || '';
  const venue = [l.venue, l.location].filter(Boolean)[0] || '';
  const meta = [l.day || (l.is_daily ? 'Daily' : null), l.time].filter(Boolean).join(' · ');
  const price = fmtPrice(l);
  const rating = l.google_rating
    ? `⭐ ${Number(l.google_rating).toFixed(1)} on Google`
    : (l.ofsted_rating === 'outstanding' ? '🏆 Outstanding (Ofsted)' : null);

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px; background: white; border: 1px solid #F3F4F6; border-radius: 14px; overflow: hidden;">
      <tr>
        ${img ? `<td style="width: 110px; vertical-align: top;"><a href="${url}"><img src="${img}" alt="" style="width: 110px; height: 110px; object-fit: cover; display: block;"/></a></td>` : ''}
        <td style="padding: 12px 14px; vertical-align: top;">
          <a href="${url}" style="font-size: 15px; font-weight: 800; color: #111827; text-decoration: none; line-height: 1.3;">${l.name}</a>
          ${venue ? `<div style="font-size: 12px; color: #6B7280; margin-top: 3px;">📍 ${venue}</div>` : ''}
          ${meta ? `<div style="font-size: 12px; color: #6B7280; margin-top: 3px;">🕐 ${meta}</div>` : ''}
          ${price ? `<div style="font-size: 12px; color: #6B7280; margin-top: 3px;">💷 ${price}</div>` : ''}
          ${rating ? `<div style="font-size: 12px; color: #5B2D6E; font-weight: 700; margin-top: 6px;">${rating}</div>` : ''}
        </td>
      </tr>
    </table>
  `;
}

function buildDigestHtml({ hot, fresh, featured, unsubscribeUrl, name }) {
  const greeting = name && name.trim() ? `Hi ${name.trim()},` : 'Hi there,';
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 20px 24px; background: #F9FAFB; color: #111827;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px;">
        <img src="https://littlelocals.uk/bear-logo.png" alt="" style="width: 32px; height: 32px; border-radius: 7px;"/>
        <span style="font-size: 17px; font-weight: 900; letter-spacing: -0.4px;">LITTLE<span style="color: #D4732A;">locals</span></span>
      </div>

      <h1 style="font-size: 24px; font-weight: 900; color: #111827; margin: 0 0 8px; line-height: 1.2;">This weekend in Ealing</h1>
      <p style="font-size: 14px; color: #6B7280; margin: 0 0 22px; line-height: 1.5;">
        ${greeting} five hand-picked things to do with the kids before Sunday night.
      </p>

      ${featured ? `
        <div style="background: #FAF8FF; border: 1px solid #E9D5FF; border-radius: 14px; padding: 14px 14px 4px; margin-bottom: 18px;">
          <div style="font-size: 11px; font-weight: 800; color: #5B2D6E; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">⭐ LITTLElocals pick this week</div>
          ${listingCardHtml(featured)}
        </div>
      ` : ''}

      <div style="font-size: 11px; font-weight: 800; color: #D4732A; letter-spacing: 1.2px; text-transform: uppercase; margin: 0 0 10px;">🔥 Hot this weekend</div>
      ${hot.map(l => listingCardHtml(l)).join('')}

      ${fresh.length > 0 ? `
        <div style="font-size: 11px; font-weight: 800; color: #D4732A; letter-spacing: 1.2px; text-transform: uppercase; margin: 24px 0 10px;">🆕 New on LITTLElocals</div>
        ${fresh.map(l => listingCardHtml(l)).join('')}
      ` : ''}

      <div style="background: white; border: 1px solid #F3F4F6; border-radius: 14px; padding: 16px; margin-top: 20px; text-align: center;">
        <div style="font-size: 13px; color: #6B7280; margin-bottom: 10px;">Looking for childcare instead?</div>
        <a href="https://littlelocals.uk/nurseries" style="display: inline-block; background: #5B2D6E; color: white; font-size: 13px; font-weight: 800; padding: 9px 16px; border-radius: 18px; text-decoration: none;">Browse Ofsted-rated nurseries →</a>
      </div>

      <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 28px 0 14px;"/>
      <p style="font-size: 11px; color: #9CA3AF; line-height: 1.6; margin: 0;">
        You're receiving this because you signed up at littlelocals.uk.<br/>
        <a href="${unsubscribeUrl}" style="color: #9CA3AF;">Unsubscribe</a>
        · <a href="https://littlelocals.uk/privacy" style="color: #9CA3AF;">Privacy</a>
        · LITTLElocals, Ealing, London
      </p>
    </div>
  `;
}

exports.handler = async (event) => {
  // Allow manual trigger via POST too (admin testing). Scheduled invocations
  // arrive without event.httpMethod set in some Netlify configurations, so
  // accept both.
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Pull a generous pool of listings; filter to Ealing + active in code.
    const { data: pool } = await supabase
      .from('listings')
      .select('id, name, slug, location, venue, day, time, days_of_week, is_daily, price, free, worth_journey, homepage_score, is_local_favourite, primary_image, created_at, ofsted_rating, google_rating, category')
      .eq('is_paused', false)
      .order('homepage_score', { ascending: false, nullsLast: true })
      .limit(200);

    const all = (pool || []).filter(isInEaling);

    // Featured pick (optional)
    const featured = all.find(l => l.is_local_favourite) || null;

    // Hot this weekend: weekend-matching, high homepage_score, excludes featured
    const hot = all
      .filter(l => isWeekendListing(l) && l.id !== featured?.id)
      .slice(0, 3);

    // New on LITTLElocals: added in past 14 days, excludes already-selected
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const selectedIds = new Set([featured?.id, ...hot.map(l => l.id)].filter(Boolean));
    const fresh = all
      .filter(l => new Date(l.created_at).getTime() >= cutoff && !selectedIds.has(l.id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2);

    if (hot.length === 0 && !featured) {
      console.log('weekly-digest: no eligible listings, skipping send');
      return { statusCode: 200, body: JSON.stringify({ sent: 0, reason: 'no listings' }) };
    }

    // 2. Pull active subscribers who haven't been sent in last 6 days
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const { data: subscribers } = await supabase
      .from('subscribers')
      .select('id, email, name, unsubscribe_token, last_sent_at')
      .eq('status', 'active');

    const sendList = (subscribers || []).filter(s =>
      !s.last_sent_at || s.last_sent_at < sixDaysAgo
    );

    if (sendList.length === 0) {
      console.log('weekly-digest: no eligible subscribers');
      return { statusCode: 200, body: JSON.stringify({ sent: 0, reason: 'no subscribers' }) };
    }

    // 3. Send. Sequential to be polite to Resend; ~50 emails / minute is fine.
    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;
    let failed = 0;
    for (const sub of sendList) {
      try {
        const unsubscribeUrl = `https://littlelocals.uk/unsubscribe?token=${sub.unsubscribe_token}`;
        await resend.emails.send({
          from: FROM,
          to: sub.email,
          replyTo: ADMIN,
          subject: 'This weekend in Ealing 🐻',
          html: buildDigestHtml({ hot, fresh, featured, unsubscribeUrl, name: sub.name }),
        });
        await supabase
          .from('subscribers')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', sub.id);
        sent++;
      } catch (e) {
        console.error(`weekly-digest: failed for ${sub.email}:`, e.message);
        failed++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        sent,
        failed,
        featured: featured?.slug,
        hot: hot.map(l => l.slug),
        fresh: fresh.map(l => l.slug),
      }),
    };
  } catch (err) {
    console.error('weekly-digest fatal:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
