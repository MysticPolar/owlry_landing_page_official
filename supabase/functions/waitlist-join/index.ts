// Owlry waitlist join + welcome email + referral seat boosts
// Share: https://owlry.ai/?ref={invite_code}
// From: support@owlry.ai · Replies: polar@owlry.ai

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const WAITLIST_CAP = 2000;
const SITE = 'https://owlry.ai';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function shareUrl(inviteCode: string): string {
  return `${SITE}/?ref=${encodeURIComponent(inviteCode)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailShell(preheader: string, bodyRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Owlry</title>
<!--[if mso]><style>body,table,td{font-family:Georgia,serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#E9DCBB;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#E9DCBB;opacity:0;">
    ${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E9DCBB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="center" style="padding:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#A8730A;">
              Owlry
            </td>
          </tr>
          <tr>
            <td style="background:#FBF4E1;border:1px solid rgba(34,26,14,.16);border-radius:4px;box-shadow:0 12px 28px -18px rgba(64,44,10,.45);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="height:6px;background:#FFC017;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:36px 36px 40px;font-family:Georgia,'Times New Roman',serif;color:#241B0E;">
                    ${bodyRows}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.5;color:#6F6452;">
              Sent by the owls at
              <a href="${SITE}" style="color:#A8730A;text-decoration:underline;">owlry.ai</a>
              · Reply anytime
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function welcomeHtml(position: number, inviteCode: string): string {
  const url = shareUrl(inviteCode);
  const code = escapeHtml(inviteCode);
  const body = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#A8730A;">
      Owl Post · Waitlist
    </p>
    <h1 style="margin:0 0 18px;font-size:32px;line-height:1.2;font-weight:normal;color:#221A0E;">
      You're on the perch.
    </h1>
    <p style="margin:0 0 22px;font-size:17px;line-height:1.65;color:#3A3124;">
      Welcome to Owlry — the reading perch for people who want books that actually stick.
      Your place among the founding readers is sealed.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td align="center" style="background:#F4E6C4;border:1px solid rgba(34,26,14,.14);border-radius:4px;padding:22px 20px;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6F6452;">
            Your seat
          </p>
          <p style="margin:0;font-size:40px;line-height:1.1;color:#221A0E;">
            nº&nbsp;${position}
          </p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.4;color:#6F6452;">
            of ${WAITLIST_CAP} founding readers
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:#3A3124;">
      Your personal code <span style="color:#6F6452;">(for beta later)</span>
    </p>
    <p style="margin:0 0 28px;font-size:22px;letter-spacing:.18em;font-family:'Courier New',Courier,monospace;color:#221A0E;">
      ${code}
    </p>
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#A8730A;">
      Move up the line
    </p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3A3124;">
      Share your invite link. Each friend who joins the waitlist moves you
      <strong style="color:#221A0E;">up one seat</strong>.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;">
      <tr>
        <td align="center" style="border-radius:4px;background:#221A0E;">
          <a href="${url}" style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.2;color:#FBF4E1;text-decoration:none;">
            Copy &amp; share your link
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 28px;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${url}" style="color:#A8730A;text-decoration:underline;">${escapeHtml(url)}</a>
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#6F6452;">
      We'll write when beta opens for your place. Until then — keep reading.
    </p>
  `;
  return emailShell(
    `You're reader nº ${position}. Share your link to climb the waitlist.`,
    body,
  );
}

function welcomeText(position: number, inviteCode: string): string {
  const url = shareUrl(inviteCode);
  return `You're on the perch.

Welcome to Owlry — the reading perch for people who want books that actually stick.
Your place among the founding readers is sealed.

Your seat: reader nº ${position} of ${WAITLIST_CAP}

Personal invite code (for beta later): ${inviteCode}

Move up the line
Share your invite link. Each friend who joins moves you up one seat:
${url}

We'll write when beta opens for your place. Until then — keep reading.

— the owls at owlry.ai`;
}

function boostHtml(newSeat: number, shareLink?: string): string {
  const url = shareLink || SITE;
  const body = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#A8730A;">
      Owl Post · Referral
    </p>
    <h1 style="margin:0 0 18px;font-size:32px;line-height:1.2;font-weight:normal;color:#221A0E;">
      A friend joined the perch.
    </h1>
    <p style="margin:0 0 22px;font-size:17px;line-height:1.65;color:#3A3124;">
      Someone used your invite. Your seat just improved.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td align="center" style="background:#F4E6C4;border:1px solid rgba(34,26,14,.14);border-radius:4px;padding:22px 20px;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6F6452;">
            You're now
          </p>
          <p style="margin:0;font-size:40px;line-height:1.1;color:#221A0E;">
            reader nº&nbsp;${newSeat}
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3A3124;">
      Keep sharing — every new friend moves you one seat closer to the front.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="border-radius:4px;background:#221A0E;">
          <a href="${url}" style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.2;color:#FBF4E1;text-decoration:none;">
            Share your invite again
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailShell(`A friend joined — you're now reader nº ${newSeat}.`, body);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};
    const referralCode = String(
      body.referral_code ?? meta.referral_code ?? meta.ref_code ?? '',
    )
      .trim()
      .toUpperCase();

    if (!isEmail(email)) {
      return json({ ok: false, error: 'invalid email' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return json({ ok: false, error: 'server misconfigured' }, 500);
    }

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/join_waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        p_email: email,
        p_meta: meta,
        p_referral_code: referralCode || null,
      }),
    });

    if (!rpcRes.ok) {
      const detail = await rpcRes.text();
      console.error('join_waitlist failed', rpcRes.status, detail);
      return json({ ok: false, error: 'join failed' }, 502);
    }

    const result = await rpcRes.json();
    if (result.full) {
      return json({
        ok: false,
        full: true,
        cap: WAITLIST_CAP,
        already: false,
        position: null,
        emailSent: false,
      });
    }

    const seat = Number(result.seat_number ?? result.position);
    const inviteCode = String(result.invite_code ?? '');
    const share = String(result.share_url ?? (inviteCode ? shareUrl(inviteCode) : ''));

    let emailSent = false;
    if (!result.already && seat && inviteCode) {
      emailSent = await sendMail(
        email,
        `You're reader nº ${seat} — Owlry waitlist`,
        welcomeHtml(seat, inviteCode),
        welcomeText(seat, inviteCode),
        'waitlist_welcome',
        serviceKey,
        supabaseUrl,
      );
    }

    if (result.referrer_boosted && result.referrer_email && result.referrer_new_seat) {
      const newSeat = Number(result.referrer_new_seat);
      const referrerShare = referralCode ? shareUrl(referralCode) : SITE;
      await sendMail(
        String(result.referrer_email),
        `A friend joined — you're now reader nº ${newSeat}`,
        boostHtml(newSeat, referrerShare),
        `A friend joined the perch.

Someone used your invite. Your seat just improved.

You're now reader nº ${newSeat}.

Keep sharing — every new friend moves you one seat closer to the front:
${referrerShare}

— the owls at owlry.ai`,
        'waitlist_referral_boost',
        serviceKey,
        supabaseUrl,
      );
    }

    return json({
      ok: true,
      full: false,
      cap: WAITLIST_CAP,
      already: !!result.already,
      position: seat,
      seat_number: seat,
      invite_code: inviteCode || null,
      share_url: share || null,
      referral_count: result.referral_count ?? 0,
      referrer_boosted: !!result.referrer_boosted,
      emailSent,
    });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'unexpected error' }, 500);
  }
});

async function sendMail(
  to: string,
  subject: string,
  html: string,
  text: string,
  kind: string,
  serviceKey: string,
  supabaseUrl: string,
): Promise<boolean> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from =
    Deno.env.get('WAITLIST_FROM_EMAIL') ||
    'Owlry <support@owlry.ai>';
  const replyTo =
    Deno.env.get('WAITLIST_REPLY_TO') ||
    'polar@owlry.ai';

  if (!resendKey) {
    console.warn('RESEND_API_KEY missing — email skipped', kind);
    return false;
  }

  const logId = crypto.randomUUID();
  await fetch(`${supabaseUrl}/rest/v1/email_log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      id: logId,
      to_email: to,
      kind,
      language: 'en',
      subject,
      status: 'pending',
      attempt_count: 1,
    }),
  }).catch((e) => console.error('email_log insert failed', e));

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({ from, reply_to: replyTo, to: [to], subject, html, text }),
  });

  const data = await res.json().catch(() => ({}));
  const ok = res.ok;
  await fetch(`${supabaseUrl}/rest/v1/email_log?id=eq.${logId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      status: ok ? 'sent' : 'failed',
      provider_message_id: data?.id ?? null,
      error: ok ? null : JSON.stringify(data),
      sent_at: ok ? new Date().toISOString() : null,
      attempt_count: 1,
    }),
  }).catch((e) => console.error('email_log update failed', e));

  if (!ok) console.error('Resend error', kind, data);
  return ok;
}
