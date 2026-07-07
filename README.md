# Owlry waitlist — launch package

One folder, ready to deploy. The evening show is the default; the sun/moon in the nav switches the lighting.

## What's in the box
- `index.html` — the whole site (fonts are the only external request)
- `og-image.png` — social share card (1200×630)
- `favicon.png`, `apple-touch-icon.png` — generated from Scout
- `supabase/waitlist.sql` — backend setup, one paste

## 1 · Wire the waitlist (3 minutes)
1. In your Supabase project, open the SQL editor, paste `supabase/waitlist.sql`, run it.
2. In `index.html`, find `OWLRY_WAITLIST` in the script at the bottom and paste your project URL + anon key.
3. Done. The form now inserts via a security-definer RPC (the anon key can only call
   `join_waitlist` and `waitlist_count` — it cannot read or dump the table), returns each
   reader's number ("you're reader nº 127"), treats duplicate emails as "already sealed",
   shows a live "join N readers on the perch" line, and captures referrer + UTM params in `meta`.

Left unconfigured, the form runs in **demo mode**: it seals locally and stores nothing.

## 2 · Deploy
Drag the folder into Netlify / Vercel / Cloudflare Pages. No build step.

## 3 · Pre-flight checklist
- [ ] Set the canonical URL and make `og:image` / `twitter:image` **absolute** (TODOs marked in `<head>`)
- [ ] Replace `hello@owlry.app` in the footer with your real contact address
- [ ] Confirm the two social links (X / TikTok → @thelostchapter8)
- [ ] Optional: drop your analytics snippet just before `</body>` (Plausible/Fathom fit the no-tracking microcopy best)
- [ ] Spam: a honeypot field ships in the form; if pressure grows, enable Supabase's
      built-in API rate limits or add Turnstile in front of the RPC call.

## Notes
- The daily-letter card, quote card, radar, and owls are the app's actual components — app and site share one design system.
- `prefers-reduced-motion` disables the ticker scroll, swoops, and reveals.
