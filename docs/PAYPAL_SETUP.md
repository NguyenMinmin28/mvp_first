# PayPal Integration Setup Guide

This guide covers the complete setup of PayPal integration following production-ready best practices.

## Quick Start Checklist

### 1. PayPal Account & Apps Setup

#### Sandbox (Development)
```bash
# 1. Go to https://developer.paypal.com/
# 2. Create Sandbox App
# 3. Note down Client ID & Client Secret
# 4. Create Webhook endpoint (you'll update URL later)
```

#### Live (Production)
```bash
# 1. Go to https://developer.paypal.com/
# 2. Create Live App (requires business verification)
# 3. Note down Client ID & Client Secret  
# 4. Create Webhook endpoint
```

### 2. Environment Variables

Create/update your `.env` file:

```bash
# PayPal Configuration
PAYPAL_MODE=sandbox  # or "live" for production
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id

# Cron Job Security
CRON_SECRET=your_random_secret_for_cron_jobs

# Database (if not already set)
DATABASE_URL=your_mongodb_connection_string
```

### 3. Create PayPal Products & Plans

Run the setup script to create subscription products and plans:

```bash
npx tsx scripts/paypal/seed-products-plans.ts
```

This will create:
- **Basic Plan**: $29/month, 2 projects, 3 contact reveals per project
- **Standard Plan**: $49/month, 5 projects, 5 contact reveals per project  
- **Premium Plan**: $99/month, 15 projects, 10 contact reveals per project

**Copy the generated plan IDs** and add them to your environment:

```bash
PAYPAL_PLAN_ID_BASIC_PLAN=P-xxxxxxxxxxxxxxxxxxxx
PAYPAL_PLAN_ID_STANDARD_PLAN=P-xxxxxxxxxxxxxxxxxxxx
PAYPAL_PLAN_ID_PREMIUM_PLAN=P-xxxxxxxxxxxxxxxxxxxx
```

### 4. Sync Plans with Database

```bash
npx tsx scripts/paypal/sync-plans.ts
```

### 5. Setup Webhook URL

#### For Development (ngrok)
```bash
# Install ngrok if not already installed
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your PayPal webhook URL to: https://abc123.ngrok.io/api/paypal/webhook
```

#### For Production
Update webhook URL to: `https://yourdomain.com/api/paypal/webhook`

### 6. Webhook Events Configuration

Ensure these events are enabled in your PayPal webhook:

- `BILLING.SUBSCRIPTION.CREATED`
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.SALE.DENIED`
- `PAYMENT.CAPTURE.DENIED`

### 7. Test the Integration

#### Test Webhook (Development)
```bash
# Use PayPal's webhook simulator or:
curl -X POST http://localhost:3000/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -H "PayPal-Transmission-Id: test-id" \
  -H "PayPal-Cert-Id: test-cert" \
  -H "PayPal-Transmission-Sig: test-sig" \
  -H "PayPal-Transmission-Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -d '{
    "id": "WH-TEST-123",
    "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
    "resource_type": "subscription",
    "resource": {
      "id": "I-TEST123",
      "status": "ACTIVE",
      "plan_id": "P-TEST123"
    }
  }'
```

#### Test Subscription Flow
1. Go to `/pricing` page
2. Select a plan
3. Complete PayPal checkout in sandbox
4. Verify subscription appears in database
5. Test project posting and contact reveal quotas

### 8. Setup Reconciliation Job

#### Option A: Vercel Cron (Recommended for Vercel deployments)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reconcile-subscriptions",
      "schedule": "0 */30 * * * *"
    }
  ]
}
```

#### Option B: External Cron Service
Setup a cron job to call:
```bash
curl -X POST https://yourdomain.com/api/cron/reconcile-subscriptions \
  -H "Authorization: Bearer $CRON_SECRET"
```

Schedule: Every 30 minutes (`0 */30 * * * *`)

## API Endpoints

### Public Endpoints
- `GET /api/billing/packages` - List available packages
- `POST /api/billing/subscriptions/verify` - Verify subscription after PayPal checkout

### Protected Endpoints (Require Authentication)
- `GET /api/billing/quotas` - Get current quotas and usage
- `POST /api/projects` - Create project (gated by quota)
- `POST /api/projects/[id]/contact-reveal` - Reveal contact (gated by quota)

### Admin Endpoints
- `POST /api/billing/reconcile` - Manual reconciliation
- `GET /api/billing/reconcile` - Reconciliation health check

### Webhook Endpoints
- `POST /api/paypal/webhook` - PayPal webhook handler

### Cron Endpoints
- `POST /api/cron/reconcile-subscriptions` - Scheduled reconciliation

## Testing

Run the test suite:

```bash
npm test -- tests/paypal.webhook.spec.ts
```

The test suite covers:
- ✅ Happy path subscription activation
- ✅ Idempotent webhook handling
- ✅ Duplicate event detection
- ✅ State transitions (active → cancelled)
- ✅ Error handling and retry logic
- ✅ Invalid signature rejection
- ✅ Malformed payload handling

## Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes
- Billing API: 30 requests per minute  
- Webhook: 50 requests per 5 minutes

### Content Security Policy
Configured for PayPal domains:
- `script-src`: PayPal JS SDK domains
- `frame-src`: PayPal iframe domains
- `connect-src`: PayPal API domains

### Webhook Verification
- Full signature verification using PayPal's verification API
- Idempotency protection
- Request logging and correlation IDs

## Monitoring & Alerts

### Health Checks
- `GET /api/cron/reconcile-subscriptions` - Overall system health
- `GET /api/billing/reconcile` - Reconciliation status

### Key Metrics to Monitor
- Webhook verification failures
- Failed reconciliation attempts  
- Rate limit breaches
- Subscription state discrepancies

### Recommended Alerts
- Webhook verification failure rate > 5%
- Failed reconciliation > 3 consecutive attempts
- No webhooks received in 24 hours

## Troubleshooting

### Common Issues

#### "Invalid webhook signature"
1. Check `PAYPAL_WEBHOOK_ID` matches PayPal dashboard
2. Verify webhook URL is HTTPS in production
3. Check PayPal environment (sandbox vs live)

#### "No active subscription found"
1. Check subscription status in database
2. Run reconciliation manually: `POST /api/billing/reconcile`
3. Verify PayPal subscription is actually active

#### "Project quota exceeded"
1. Check current usage: `GET /api/billing/quotas`
2. Verify subscription period is current
3. Check if usage reset properly on new billing cycle

#### Webhook not received
1. Check ngrok is running (development)
2. Verify webhook URL in PayPal dashboard
3. Check webhook event types are enabled
4. Look for webhook delivery failures in PayPal dashboard

### Logs

Check structured logs for correlation IDs:
```bash
# Find all events for a specific correlation ID
grep "corr-1234567890-abc123" logs/app.log

# Find webhook processing errors
grep "PayPal Webhook" logs/app.log | grep ERROR
```

## Production Deployment

### Environment Switch
1. Update `PAYPAL_MODE=live`
2. Update client ID/secret to live credentials
3. Update webhook URL to production domain
4. Test with small amount first

### Security Checklist
- ✅ All secrets in environment variables (never in code)
- ✅ HTTPS enforced
- ✅ CSP headers configured
- ✅ Rate limiting enabled
- ✅ Webhook signature verification active
- ✅ Reconciliation job scheduled
- ✅ Monitoring and alerts configured

Happy integrating! 🎉
