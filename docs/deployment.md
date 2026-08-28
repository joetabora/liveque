# Deployment Guide

## Vercel

1. Push to GitHub and import in Vercel
2. Add environment variables (see `.env.local.example`)
3. Deploy

## Required Services

| Service | Purpose |
|---------|---------|
| Neon | PostgreSQL database |
| Firebase | Firestore real-time queue + Admin SDK for writes |
| Resend | Transactional email |
| Stripe | Billing |
| Upstash (optional) | Rate limiting |

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values.

For preview deployments on the `develop` branch, see [vercel-preview.md](vercel-preview.md).

Critical for production (enable the **Production** scope in Vercel for each):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon connection string — required for auth, queue admin, promotions |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://liveque.vercel.app` (or your production domain) |
| `NEXT_PUBLIC_APP_URL` | Same as `AUTH_URL` |
| `FIREBASE_*` | Client and admin credentials |
| `STRIPE_*` | Secret key, webhook secret, price IDs |
| `SKIP_QUEUE_AUTH` | `true` until MKE staff memberships exist |

After adding or changing variables, **Redeploy** — existing builds do not pick up new env vars.

## Post-Deploy Checklist

1. `npm run db:push` against production DATABASE_URL
2. `npm run db:seed` — create mkehd tenant
3. `npm run db:migrate-queue` — migrate Firestore queue data
4. Deploy updated `firestore.rules` to Firebase **only after** production runs the `develop` build (server-side queue writes). If production still runs `main` (client-side Firestore writes to `queue`), keep legacy `allow write: if true` on the flat `queue` collection until cutover.
5. Create Firestore composite index on `tenants/{id}/queue`: status + position
6. Configure Stripe webhook → `/api/stripe/webhook`
7. Create MKE staff accounts before setting `SKIP_QUEUE_AUTH=false`

## Migration Rollback

Set `USE_LEGACY_QUEUE=true` to revert Firestore reads to flat `queue` collection.
