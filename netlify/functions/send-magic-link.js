const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { email, name, listingName } = JSON.parse(event.body || '{}');

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const loginUrl = 'https://littlelocals.uk/provider/login';

  try {
    await resend.emails.send({
      from: 'LittleLocals <hello@littlelocals.uk>',
      to: email,
      subject: `Your listing has been approved – ${listingName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="font-size: 28px; margin-bottom: 8px;">🐻</div>
          <h2 style="color: #5B2D6E; margin: 0 0 16px;">Hi ${name}, you're approved!</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Your listing <strong>${listingName}</strong> has been approved on LittleLocals.
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            You can now log in to your provider dashboard to update your listing details, add photos, and more.
          </p>
          <a href="${loginUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #5B2D6E; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
            Access your dashboard →
          </a>
          <p style="color: #9CA3AF; font-size: 13px; margin-top: 32px;">
            You'll receive a magic link to sign in — no password needed.<br/>
            Questions? Reply to this email.
          </p>
        </div>
      `
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Resend error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
