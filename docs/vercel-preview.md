# Vercel Preview Deployment

Deploy the `develop` branch as a Vercel **Preview** environment before merging to `main`.

## 1. Connect the project

1. Import the GitHub repo in [Vercel](https://vercel.com)
2. Set **Production Branch** to `main` (unchanged — MKEHD stays on old code)
3. Preview deployments will build from `develop` and other branches automatically

## 2. Environment variables

In Vercel → Project → Settings → Environment Variables, add all values from [`.env.local.example`](../.env.local.example).

Minimum for a working preview:

| Variable | Preview value |
|----------|---------------|
| `DATABASE_URL` | Neon connection string (can be same or separate preview DB) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel preview URL (e.g. `https://liveque-xxx.vercel.app`) |
| `AUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` |
| Firebase client + admin vars | Same `mkehdlive` project credentials |
| `SKIP_QUEUE_AUTH` | `true` until staff accounts exist |
| Stripe vars | Test mode keys for preview |

Scope variables to **Preview** (and Production when ready).

**Important:** Each variable must have the **Preview** checkbox enabled in Vercel (not only Production). After adding or changing variables, **Redeploy** the preview deployment — old builds do not pick up new env vars.

Verify database connectivity after deploy:

```
https://your-preview-url.vercel.app/api/health/db
```

Expected: `{ "ok": true, "hasAuthUsers": true, "tableCount": 12, ... }`

Verify Firebase Admin (queue writes) after deploy:

```
https://your-preview-url.vercel.app/api/health/firebase
```

Expected: `{ "ok": true, "projectId": "...", "privateKeyLooksValid": true }`

If `ok: false`, fix `FIREBASE_PRIVATE_KEY` in Vercel — paste the full service account key as one line with `\n` between lines.

## 3. Database setup (preview DB)

```bash
DATABASE_URL="your-preview-neon-url" npm run db:push
DATABASE_URL="your-preview-neon-url" npm run db:seed
DATABASE_URL="your-preview-neon-url" npm run db:migrate-queue
```

## 4. Firestore composite index

Create a **collection group** index in Firebase Console:

- Collection group ID: `queue`
- Fields: `status` (Ascending), `position` (Ascending)

Or open `/admin` on the preview URL and click the index link in the browser console if Firestore prompts you.

## 5. Stripe webhook (preview)

In Stripe Dashboard → Webhooks, add endpoint:

```
https://your-preview-url.vercel.app/api/stripe/webhook
```

Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

Set `STRIPE_WEBHOOK_SECRET` in Vercel Preview env.

## 6. Deploy

Push to `develop`:

```bash
git push origin develop
```

Vercel builds a preview deployment automatically. Open the preview URL and test:

- `/admin` — legacy MKEHD queue (with `SKIP_QUEUE_AUTH=true`)
- `/display` — TV board
- `/signup` → `/onboarding` → plan → setup — new tenant flow

## 7. MKEHD cutover checklist

Before pointing MKEHD production at the new build:

- [ ] Staff accounts created and `MKE_STAFF_EMAILS` seeded
- [ ] `SKIP_QUEUE_AUTH=false` on production
- [ ] `USE_LEGACY_QUEUE=false` on production
- [ ] Firestore rules deployed
- [ ] Composite index enabled
- [ ] Stripe live mode configured (when billing real customers)
