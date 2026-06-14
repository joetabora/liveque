# Stripe Setup

## Products

Create two products in Stripe Dashboard:

| Product | Price | Env Variable |
|---------|-------|--------------|
| Starter | $49/mo recurring | `STRIPE_PRICE_STARTER` |
| Professional | $99/mo recurring | `STRIPE_PRICE_PROFESSIONAL` |

## Webhook

1. Add endpoint: `https://your-domain.com/api/stripe/webhook`
2. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Test Mode Checklist

- [ ] Create test products and prices
- [ ] Set test API keys in env
- [ ] Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Complete test checkout from `/onboarding/plan`
- [ ] Verify subscription row created in Postgres
- [ ] Test customer portal from billing settings

## Plan Limits

| Plan | Locations | Displays | Staff |
|------|-----------|----------|-------|
| Starter | 1 | 1 | 3 |
| Professional | 1 | Unlimited | Unlimited |
| Enterprise | Unlimited | Unlimited | Unlimited |

MKEHD is grandfathered on enterprise plan via seed script.
