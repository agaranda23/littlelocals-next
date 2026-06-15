const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

// Fire-and-forget welcome email when someone signs up to the weekly digest.
// Confirms the subscription, sets expectation ("Wednesdays at 9am"), and
// includes a one-click unsubscribe link tied to their token. Called from
// DigestSignup.js right after the supabase insert succeeds.

const FROM = 'LittleLocals <hello@littlelocals.uk>';
const ADMIN = 'hello@littlelocals.uk';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  const { email, name } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };

  try {
    // Look up the subscriber row to get their unsubscribe token.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: sub } = await supabase
      .from('subscribers')
      .select('unsubscribe_token, name')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!sub) {
      return { statusCode: 404, body: JSON.stringify({ error: 'subscriber not found' }) };
    }

    const displayName = (name && name.trim()) || sub.name || 'there';
    const unsubscribeUrl = `https://littlelocals.uk/unsubscribe?token=${sub.unsubscribe_token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: email,
      replyTo: ADMIN,
      subject: 'Welcome to the LITTLElocals weekly digest 🐻',
      html: `
        <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px;">
          <div style="font-size: 28px; margin-bottom: 8px;">🐻</div>
          <h2 style="color: #5B2D6E; margin: 0 0 12px;">Hi ${displayName}, you’re in.</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Every <strong>Wednesday at 9am</strong> you’ll get a short email from us — five hand-picked things to do with the kids in Ealing this weekend. Classes, soft play, nurseries to tour, days out worth the journey.
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            No spam, no chasing — just one useful email per week. Unsubscribe in one click any time.
          </p>
          <a href="https://littlelocals.uk" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background: #5B2D6E; color: white; text-decoration: none; border-radius: 22px; font-weight: 700; font-size: 14px;">
            Browse LITTLElocals →
          </a>
          <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 32px 0 16px;"/>
          <p style="color: #9CA3AF; font-size: 11px; line-height: 1.6;">
            You're receiving this because you signed up on littlelocals.uk.<br/>
            <a href="${unsubscribeUrl}" style="color: #9CA3AF;">Unsubscribe</a>
            · <a href="https://littlelocals.uk/privacy" style="color: #9CA3AF;">Privacy</a>
            · LITTLElocals, Ealing, London
          </p>
        </div>
      `,
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('notify-subscriber-welcome error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
