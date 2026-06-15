const { Resend } = require('resend');

// Called from ListingDetailClient.js right after a tour_requests row is
// inserted. Sends two emails: confirmation to the parent, and a
// notification to the founder/admin (long-term: directly to the nursery
// once listings have an enquiry_email field).
//
// Fire-and-forget from the client — if this fails, the tour_request row
// is still safely in the database and the parent already saw the success
// state. We log the error and return 500 but don't surface to the user.

const ADMIN_EMAIL = 'hello@littlelocals.uk';
const FROM = 'LittleLocals <hello@littlelocals.uk>';

const CHILD_AGE_LABELS = {
  under_6mo: 'Under 6 months',
  '6_to_12mo': '6–12 months',
  '1_to_2yr': '1–2 years',
  '2_to_3yr': '2–3 years',
  '3_to_4yr': '3–4 years',
  '4_plus': '4+ years',
};

const TIME_LABELS = {
  morning: '🌅 Morning',
  afternoon: '🌇 Afternoon',
  either: '✨ Either',
};

function fmtDate(d) {
  if (!d) return null;
  try {
    return new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch (e) {
    return d;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const {
    listing_id,
    listing_name,
    listing_slug,
    parent_name,
    parent_email,
    parent_phone,
    child_age,
    preferred_date,
    alternative_date,
    time_window,
    message,
  } = JSON.parse(event.body || '{}');

  if (!listing_id || !parent_email || !preferred_date) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const ageLabel = CHILD_AGE_LABELS[child_age] || child_age || 'Not specified';
  const timeLabel = TIME_LABELS[time_window] || 'Either';
  const preferredLabel = fmtDate(preferred_date);
  const altLabel = fmtDate(alternative_date);
  const listingUrl = `https://littlelocals.uk/listing/${listing_slug}`;

  const requestRecap = `
    <div style="background: #F9FAFB; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.7; color: #374151;">
      <div><strong>Child age:</strong> ${ageLabel}</div>
      <div><strong>Preferred date:</strong> ${preferredLabel}</div>
      ${altLabel ? `<div><strong>Alternative date:</strong> ${altLabel}</div>` : ''}
      <div><strong>Time preference:</strong> ${timeLabel}</div>
      ${message ? `<div style="margin-top: 8px;"><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</div>` : ''}
    </div>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1. Parent confirmation
    await resend.emails.send({
      from: FROM,
      to: parent_email,
      replyTo: ADMIN_EMAIL,
      subject: `Tour request sent — ${listing_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <div style="font-size: 28px; margin-bottom: 8px;">🐻</div>
          <h2 style="color: #5B2D6E; margin: 0 0 12px;">Tour request sent — ${listing_name}</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Hi ${parent_name}, thanks for using LittleLocals to request a tour.
            We've passed your details to the team at <strong>${listing_name}</strong>
            and they'll be in touch within 48 hours to confirm a time.
          </p>
          ${requestRecap}
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            In the meantime you can revisit the listing here:
          </p>
          <a href="${listingUrl}" style="display: inline-block; margin-top: 4px; padding: 11px 22px; background: #5B2D6E; color: white; text-decoration: none; border-radius: 22px; font-weight: 700; font-size: 14px;">
            View ${listing_name} →
          </a>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px; line-height: 1.6;">
            If you don't hear back within 48 hours, reply to this email and we'll chase it for you.<br/>
            LittleLocals — discover, plan, visit.
          </p>
        </div>
      `
    });

    // 2. Admin/provider notification
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: parent_email,
      subject: `📅 New tour request: ${parent_name} → ${listing_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <div style="font-size: 22px; margin-bottom: 8px;">📅</div>
          <h2 style="color: #5B2D6E; margin: 0 0 4px;">New tour request</h2>
          <div style="font-size: 13px; color: #6B7280; margin-bottom: 18px;">via LittleLocals</div>

          <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="font-size: 16px; font-weight: 800; color: #5B2D6E;">${listing_name}</div>
            <a href="${listingUrl}" style="font-size: 12px; color: #5B2D6E; text-decoration: underline;">View listing →</a>
          </div>

          <div style="font-size: 14px; line-height: 1.8; color: #111827;">
            <div><strong>Parent:</strong> ${parent_name}</div>
            <div><strong>Email:</strong> <a href="mailto:${parent_email}" style="color: #5B2D6E;">${parent_email}</a></div>
            ${parent_phone ? `<div><strong>Phone:</strong> ${parent_phone}</div>` : ''}
          </div>

          ${requestRecap}

          <p style="color: #4B5563; font-size: 13px; line-height: 1.6;">
            Reply directly to this email to respond to <strong>${parent_name}</strong>
            (their address is set as Reply-To).
          </p>
          <p style="color: #9CA3AF; font-size: 11px; margin-top: 24px;">
            Tour requests are stored in the <code>tour_requests</code> Supabase table.
            Update status to 'contacted', 'visited' or 'closed' from the admin.
          </p>
        </div>
      `
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('notify-tour-request error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
