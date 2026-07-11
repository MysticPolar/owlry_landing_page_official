# Owlry waitlist — launch package

One folder, ready to deploy. The evening show is the default; the sun/moon in the nav switches the lighting.

## What's in the box
- `index.html` — the whole site (fonts are the only external request)
- `og-image.png` — social share card (1200×630)
- `favicon.png`, `apple-touch-icon.png` — generated from Scout
- `supabase/waitlist.sql` — backend setup, one paste

## 1 · Wire the waitlist (already applied on Supabase)
The `join_waitlist` / `waitlist_count` RPCs and `waitlist-join` Edge Function are live
(cap **2000**). The landing form is wired to project `twxzbpfchoctxyjeivvr`.

**To turn on welcome emails**, follow [supabase/EMAIL_SETUP.md](supabase/EMAIL_SETUP.md)
(Resend API key + verify `owlry.ai` as a sending domain).

## 2 · Deploy
Drag the folder into Netlify / Vercel / Cloudflare Pages, or push to GitHub Pages. No build step.

## 3 · Pre-flight checklist
- [ ] Confirm `https://owlry.ai` is serving this landing (not GoDaddy Website Builder)
- [ ] Add Resend secrets so welcome emails actually send ([EMAIL_SETUP.md](supabase/EMAIL_SETUP.md))
- [ ] Confirm the two social links (X / TikTok → @thelostchapter8)
- [ ] Optional: drop your analytics snippet just before `</body>` (Plausible/Fathom fit the no-tracking microcopy best)
- [ ] Spam: a honeypot field ships in the form; if pressure grows, enable Supabase's
    built-in API rate limits or add Turnstile in front of the join call.

## Notes
- The daily-letter card, quote card, radar, and owls are the app's actual components — app and site share one design system.
- `prefers-reduced-motion` disables the ticker scroll, swoops, and reveals.
