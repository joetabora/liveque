# LiveQue Architecture

## Overview

LiveQue is a multi-tenant SaaS appointment queue platform built on Next.js 16 with:

- **PostgreSQL (Neon)** — tenants, users, memberships, subscriptions, audit logs
- **Firebase Firestore** — real-time queue sync for display boards
- **Auth.js + Resend** — authentication (swappable to Clerk via `AUTH_PROVIDER`)
- **Stripe** — subscription billing

## Tenant Isolation

- Each business is a row in the `tenants` table with a unique `slug` (URL identifier)
- Queue data lives at `tenants/{tenantId}/queue/{itemId}` in Firestore
- All Postgres queries include `tenant_id` from authenticated session
- Queue writes go through API routes using Firebase Admin SDK — clients cannot write directly

## Auth Adapter

The `AuthProvider` interface in `src/lib/auth/provider.ts` abstracts authentication. Set `AUTH_PROVIDER=authjs` (default) or `clerk` (future) to swap providers without changing business logic.

## Legacy Support

Milwaukee Harley-Davidson uses `/admin` and `/display` (legacy routes). These map to the `mkehd` tenant via `LEGACY_TENANT_SLUG`. Set `SKIP_QUEUE_AUTH=true` during migration until staff accounts are created.

## Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Marketing |
| `/[slug]/admin` | Staff queue dashboard |
| `/[slug]/display/[id]` | Public TV display |
| `/[slug]/checkin` | QR code self check-in |
| `/platform` | Super admin dashboard |
| `/admin`, `/display` | Legacy MKEHD routes |
