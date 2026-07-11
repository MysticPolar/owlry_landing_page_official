# Activate waitlist welcome emails (Resend)

The landing form already saves signups (cap **2000**) and calls the `waitlist-join` Edge Function.
Emails send only after you add a Resend API key.

## 1. Create a Resend account
1. Sign up at https://resend.com
2. Create an API key → copy it (`re_...`)

## 2. Verify your sending domain (owlry.ai)
1. In Resend → **Domains** → Add `owlry.ai`
2. Add the DNS records Resend shows (SPF / DKIM) in GoDaddy DNS for `owlry.ai`
3. Wait until Resend marks the domain **Verified**
4. Until then, you can test with `from: Owlry <onboarding@resend.dev>` (Resend test sender; only delivers to *your* Resend account email)

## 3. Add secrets in Supabase
Project: **Owlry Landing Page** (`twxzbpfchoctxyjeivvr`)

Dashboard → **Project Settings** → **Edge Functions** → **Secrets**, add:

| Name | Value |
|------|--------|
| `RESEND_API_KEY` | your `re_...` key |
| `WAITLIST_FROM_EMAIL` | `Owlry <hello@owlry.ai>` (after domain verified) |

Or CLI (from any machine with Supabase linked):

```bash
supabase secrets set RESEND_API_KEY=re_xxxx WAITLIST_FROM_EMAIL="Owlry <hello@owlry.ai>" --project-ref twxzbpfchoctxyjeivvr
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already injected automatically.

## 4. Smoke-test
```bash
curl -s -X POST 'https://twxzbpfchoctxyjeivvr.supabase.co/functions/v1/waitlist-join' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","meta":{"source":"manual-test"}}'
```

You should get `{ "ok": true, "position": N, "emailSent": true, ... }` and receive the welcome letter with your seat number.

Check **Table Editor → `email_log`** for `kind = waitlist_welcome` and status `sent`.

## What the email says
- Welcome / you're on the perch
- Seat ranking: reader nº N of 2000
- You'll hear immediately when beta opens for your place
