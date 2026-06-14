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

Critical for production:
- `DATABASE_URL` — Neon connection string
- `AUTH_SECRET` — `openssl rand -base64 32`
- `FIREBASE_*` — client and admin credentials
- `STRIPE_*` — secret key, webhook secret, price IDs

## Post-Deploy Checklist

1. `npm run db:push` against production DATABASE_URL
2. `npm run db:seed` — create mkehd tenant
3. `npm run db:migrate-queue` — migrate Firestore queue data
4. Deploy updated `firestore.rules` to Firebase
5. Create Firestore composite index on `tenants/{id}/queue`: status + position
6. Configure Stripe webhook → `/api/stripe/webhook`
7. Create MKE staff accounts before setting `SKIP_QUEUE_AUTH=false`

## Migration Rollback

Set `USE_LEGACY_QUEUE=true` to revert Firestore reads to flat `queue` collection.
