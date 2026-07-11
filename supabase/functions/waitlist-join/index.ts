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

function welcomeHtml(position: number, inviteCode: string): string {
  const url = shareUrl(inviteCode);
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0D111F;font-family:Georgia,'Times New Roman',serif;color:#EAE2CF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0D111F;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#151B2E;border:1px solid #2A3348;border-radius:12px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8B93A7;">Owl Post · Waitlist</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#F4EBD8;">You're on the perch.</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#C9C0A8;">
            Welcome to Owlry. Your seat is reserved as
            <strong style="color:#F4EBD8;">reader nº ${position}</strong>
            of ${WAITLIST_CAP} founding readers.
          </p>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#C9C0A8;">
            Your personal invite code (for beta later):
          </p>
          <p style="margin:0 0 20px;font-size:22px;letter-spacing:.14em;font-family:'Courier New',monospace;color:#F4EBD8;">
            ${inviteCode}
          </p>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#C9C0A8;">
            Share this link — each friend who joins moves you <strong style="color:#F4EBD8;">up one seat</strong>:
          </p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.5;word-break:break-all;">
            <a href="${url}" style="color:#E8A87C;">${url}</a>
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#8B93A7;">
            — the owls at <a href="${SITE}" style="color:#E8A87C;">owlry.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeText(position: number, inviteCode: string): string {
  const url = shareUrl(inviteCode);
  return `You're on the perch.

Welcome to Owlry. Your seat is reserved as reader nº ${position} of ${WAITLIST_CAP} founding readers.

Your personal invite code: ${inviteCode}

Share this link — each friend who joins moves you up one seat:
${url}

— the owls at owlry.ai`;
}

function boostHtml(newSeat: number): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0D111F;font-family:Georgia,'Times New Roman',serif;color:#EAE2CF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0D111F;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#151B2E;border:1px solid #2A3348;border-radius:12px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8B93A7;">Owl Post · Referral</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#F4EBD8;">A friend joined the perch.</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#C9C0A8;">
            You're now <strong style="color:#F4EBD8;">reader nº ${newSeat}</strong>. Keep sharing your link to climb higher.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#8B93A7;">
            — the owls at <a href="${SITE}" style="color:#E8A87C;">owlry.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
      await sendMail(
        String(result.referrer_email),
        `A friend joined — you're now reader nº ${newSeat}`,
        boostHtml(newSeat),
        `A friend joined the perch.\n\nYou're now reader nº ${newSeat}. Keep sharing your link to climb higher.\n\n— the owls at owlry.ai`,
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
