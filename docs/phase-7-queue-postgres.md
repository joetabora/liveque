# Phase 7: Queue Migration to PostgreSQL (Future)

This phase is **not implemented** — it is documented for when Firestore costs or complexity warrant a single data store.

## When to Pursue

- Firestore costs exceed ~$25/mo at current tenant count
- Need complex queue analytics without audit log derivation
- Want to eliminate dual-database operational overhead

## Recommended Approach

1. Add `queue_items` Postgres table with `tenant_id`, same fields as Firestore docs
2. Use Supabase Realtime or Server-Sent Events for display updates
3. Dual-write period: API writes to both Firestore and Postgres
4. Switch `useQueue` to Postgres subscription
5. Deprecate Firestore queue subcollections after 7-day rollback window

## Not Required For

- 500 tenants at current scale
- Sub-second display sync (Firestore excels here)

Track this as a future optimization, not a launch blocker.
