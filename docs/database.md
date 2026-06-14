# Database Schema

## PostgreSQL (Neon + Drizzle)

Schema files: `src/db/schema/`

### Tables

- **tenants** — business accounts with branding and billing metadata
- **users** — application users linked to auth provider via `auth_provider_id`
- **memberships** — user ↔ tenant with role (`owner`, `staff`)
- **displays** — display board configurations per tenant
- **subscriptions** — Stripe subscription state and plan limits
- **audit_logs** — immutable activity trail
- **platform_admins** — super admin access
- **auth_users**, **auth_accounts**, **auth_sessions**, **auth_verification_tokens** — Auth.js adapter tables

### Migrations

```bash
npm run db:push      # Push schema to Neon
npm run db:seed      # Seed mkehd tenant
npm run db:migrate-queue  # Copy legacy Firestore queue to tenant path
```

## Firestore

### Queue Path

```
tenants/{tenantId}/queue/{itemId}
  name, hereToSee, serviceType, status, position, createdAt, createdBy
```

### Legacy Path (rollback)

```
queue/{itemId}
```

### Required Index

Collection group or subcollection: `status ASC + position ASC`

## Seed Data

The `mkehd` tenant is seeded with Milwaukee Harley-Davidson branding (blue `#0065a6`, enterprise plan).
