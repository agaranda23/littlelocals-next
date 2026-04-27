const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { email, name, listingName, listingId } = JSON.parse(event.body || '{}');

  if (!email || !listingId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or listingId' }) };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Ensure the auth user exists. If not, create. Either way, get their ID.
    let userId;
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (found) {
      userId = found.id;
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createErr) throw new Error('Create user failed: ' + createErr.message);
      userId = created.user.id;
    }

    // 2. Upsert provider row (idempotent on user_id).
    const { data: existingProvider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let providerId;
    if (existingProvider) {
      providerId = existingProvider.id;
      await supabase.from('providers').update({ approved: true, name, email }).eq('id', providerId);
    } else {
      const { data: newProvider, error: provErr } = await supabase
        .from('providers')
        .insert({ user_id: userId, name, email, approved: true })
        .select('id')
        .single();
      if (provErr) throw new Error('Provider insert failed: ' + provErr.message);
      providerId = newProvider.id;
    }

    // 3. Upsert listing_owners link (idempotent on provider_id + listing_id).
    const { data: existingLink } = await supabase
      .from('listing_owners')
      .select('id')
      .eq('provider_id', providerId)
      .eq('listing_id', listingId)
      .maybeSingle();

    if (!existingLink) {
      const { error: linkInsertErr } = await supabase
        .from('listing_owners')
        .insert({ provider_id: providerId, listing_id: listingId, approved: true });
      if (linkInsertErr) throw new Error('Listing link failed: ' + linkInsertErr.message);
    }

    // 4. Generate a real magic link via admin API. Lasts 24h (Supabase OTP expiry setting).
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'https://littlelocals.uk/provider/dashboard' }
    });
    if (linkErr) throw new Error('Generate link failed: ' + linkErr.message);
    const magicLink = linkData?.properties?.action_link;
    if (!magicLink) throw new Error('No magic link returned');

    // 5. Email the link via Resend.
    const resend = new Resend(process.env.RESEND_API_KEY);
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
            Click below to access your provider dashboard — no password needed.
          </p>
          <a href="${magicLink}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #5B2D6E; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
            Access your dashboard →
          </a>
          <p style="color: #9CA3AF; font-size: 13px; margin-top: 32px;">
            This link is valid for 24 hours. If it expires, just visit <a href="https://littlelocals.uk/provider/login" style="color:#5B2D6E;">littlelocals.uk/provider/login</a> and request a new one.<br/>
            Questions? Reply to this email.
          </p>
        </div>
      `
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('send-magic-link error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
