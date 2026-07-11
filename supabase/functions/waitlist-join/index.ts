// Owlry waitlist join + welcome email (Resend)
// Deployed with verify_jwt=false so the public landing can call it with the anon key.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const WAITLIST_CAP = 2000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function welcomeHtml(position: number): string {
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
          <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#C9C0A8;">
            We're only boarding ${WAITLIST_CAP} readers for now. The moment beta opens for your place in line, we'll write you immediately — no spam, just the letter that matters.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#8B93A7;">
            — the owls at <a href="https://owlry.ai" style="color:#E8A87C;">owlry.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeText(position: number): string {
  return `You're on the perch.

Welcome to Owlry. Your seat is reserved as reader nº ${position} of ${WAITLIST_CAP} founding readers.

We're only boarding ${WAITLIST_CAP} readers for now. The moment beta opens for your place in line, we'll write you immediately.

— the owls at owlry.ai`;
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
      body: JSON.stringify({ p_email: email, p_meta: meta }),
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

    let emailSent = false;
    if (!result.already && result.position) {
      emailSent = await sendWelcome(email, Number(result.position), serviceKey, supabaseUrl);
    }

    return json({
      ok: true,
      full: false,
      cap: WAITLIST_CAP,
      already: !!result.already,
      position: result.position,
      emailSent,
    });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'unexpected error' }, 500);
  }
});

async function sendWelcome(
  email: string,
  position: number,
  serviceKey: string,
  supabaseUrl: string,
): Promise<boolean> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from =
    Deno.env.get('WAITLIST_FROM_EMAIL') ||
    'Owlry <hello@owlry.ai>';

  if (!resendKey) {
    console.warn('RESEND_API_KEY missing — welcome email skipped');
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
      to_email: email,
      kind: 'waitlist_welcome',
      language: 'en',
      subject: `You're reader nº ${position} — Owlry waitlist`,
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
    body: JSON.stringify({
      from,
      to: [email],
      subject: `You're reader nº ${position} — Owlry waitlist`,
      html: welcomeHtml(position),
      text: welcomeText(position),
    }),
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

  if (!ok) console.error('Resend error', data);
  return ok;
}
