# Tenant Onboarding Guide

## For New Customers

1. **Sign up** at `/signup` with email and password
2. **Create business** at `/onboarding` — enter name and choose URL slug
3. **Choose plan** at `/onboarding/plan` — Starter ($49) or Professional ($99)
4. **Enter payment** via Stripe Checkout (14-day free trial)
5. **Configure branding** at `/onboarding/setup` (after Stripe checkout) or `/[slug]/settings/branding`
6. **Open display** at `/[slug]/display/main` on your TV
7. **Add staff** at `/[slug]/settings/team`

Goal: operational in under 10 minutes.

## For Milwaukee Harley-Davidson (Existing)

No URL changes required. Continue using:
- `/admin` — staff dashboard
- `/display` — TV board

After migration:
1. Run `npm run db:seed` and `npm run db:migrate-queue`
2. Deploy updated Firestore rules
3. Create staff accounts at `/signup`
4. Run `MKE_STAFF_EMAILS=you@example.com npm run db:seed` to grant memberships
5. Set `SKIP_QUEUE_AUTH=false` when ready

## QR Check-In

Share `/[slug]/checkin` URL or generate a QR code pointing to it. Customers can self check-in from their phone.

## Display Setup

1. Open `/[slug]/display/main?kiosk=1` on your TV browser
2. Click fullscreen button or use browser kiosk mode
3. Bookmark the URL for auto-start
