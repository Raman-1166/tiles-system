# Clay & Co. — Operations & Deployment Runbook

This operational runbook provides production deployment procedures, health monitoring commands, backup workflows, and troubleshooting playbooks for Clay & Co.

---

## 1. Quick Start with Docker Compose

To boot the entire stack (Next.js Application + MySQL 8.0 + Mailpit SMTP):

```bash
# 1. Build and boot services in background
docker compose up -d --build

# 2. Check service container health
docker compose ps

# 3. View live application logs
docker compose logs -f app
```

- **Storefront & Admin:** `http://localhost:3000`
- **Readiness Health Probe:** `http://localhost:3000/api/ready`
- **Mailpit Email Inspector:** `http://localhost:8025`

---

## 2. Environment Configuration

All required environment variables are defined in `.env.example`. In production:

| Variable                | Description                                        | Validation Rule                 |
| ----------------------- | -------------------------------------------------- | ------------------------------- |
| `DATABASE_URL`          | MySQL 8.0 connection string                        | Valid MySQL URI (`mysql://...`) |
| `ADMIN_SESSION_SECRET`  | HMAC-SHA256 signing secret for admin cookies       | Min 32 characters               |
| `ORDER_TOKEN_SECRET`    | Cryptographic secret for signed order access links | Min 32 characters               |
| `PAYMENT_PROVIDER`      | Payment processor (`stripe` or `mock`)             | Production requires `stripe`    |
| `STRIPE_SECRET_KEY`     | Stripe secret API key (`sk_live_...`)              | Required if provider = stripe   |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`)        | Required if provider = stripe   |
| `NEXT_PUBLIC_SITE_URL`  | Canonical origin for OG tags & sitemaps            | Valid HTTP/HTTPS URL            |

---

## 3. Database Migrations & Verification

To verify database schema parity and data consistency:

```bash
# Run automated 5-stage database verification
npm run db:verify

# Run migration to latest schema version
npm run db:migrate

# Setup isolated test database without mutating dev DB
npm run db:test:setup
```

---

## 4. Health & Observability Endpoints

The application exports two health and observability probes:

1. **`GET /api/ready` (Readiness Probe):**
   - Validates live database query execution (`SELECT 1`).
   - Validates critical environment configuration.
   - Returns HTTP 200 with latency and uptime, or HTTP 503 if unreachable.
   - Used by Docker/Kubernetes container orchestration.

2. **`GET /api/health` (Liveness Probe):**
   - Light ping verifying process event loop responsiveness.
   - Masked internal errors in production to avoid leaking database credentials.

---

## 5. Backup & Disaster Recovery

### Database Dump

```bash
# Backup MySQL database to timestamped gzip file
docker exec clay-db mysqldump -u app_user -papp_password app_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database Restore

```bash
# Restore from backup archive
gunzip < backup_20261014.sql.gz | docker exec -i clay-db mysql -u app_user -papp_password app_db
```

---

## 6. Troubleshooting Common Issues

### Issue: "Cross-origin request blocked (403)"

- **Cause:** State-changing API call (`POST`, `PATCH`, `DELETE`) with mismatched `Origin` and `Host` headers.
- **Fix:** Verify `NEXT_PUBLIC_SITE_URL` matches the domain serving the request or check proxy headers behind Cloudflare/Nginx.

### Issue: "Order link expired or invalid (401)"

- **Cause:** Order access token signature mismatch or token expired (valid for 30 days).
- **Fix:** Customer can request a fresh token by entering their Order Number & Email at `/order/lookup`.
