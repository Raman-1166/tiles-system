# Deploying Clay & Co. to Aiven for MySQL + Vercel / Railway

This guide walks you through hosting your database on **Aiven for MySQL** and deploying your Next.js storefront to **Vercel** (or Railway / Render).

---

## Architecture Overview

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│   Frontend & API Application    │       │     Managed Cloud Database       │
│      (Vercel / Railway)         │ ────> │        (Aiven for MySQL 8)       │
│  Next.js 16 • Three.js • Edge   │  SSL  │  13 Tables • Seeded Catalog      │
└─────────────────────────────────┘       └──────────────────────────────────┘
```

- **Aiven:** Hosts the managed MySQL 8 database with automatic backups, high availability, and SSL encryption.
- **Vercel / Railway:** Hosts the Next.js web application connected to your GitHub repository ([`Raman-1166/tiles-system`](https://github.com/Raman-1166/tiles-system)).

---

## Step 1: Create an Aiven for MySQL Service

1. Go to [https://console.aiven.io/](https://console.aiven.io/) and sign up or log in.
2. Click **Create service**.
3. Select **MySQL** as the service type.
4. Select MySQL Version **8.0**.
5. Choose your Cloud Provider and Region (e.g., `AWS us-east-1` or `GCP us-central1` close to your target users).
6. Choose a Service Plan (Free Trial or Startup-4).
7. Give your service a name (e.g., `clay-and-co-db`) and click **Create service**.
8. Wait ~2 minutes until the status shows **Running**.
9. In the **Service Overview** tab, copy the **Service URI**. It looks like:
   ```text
   mysql://avnadmin:AVNS_AbCdEf123456@mysql-xxxx-project.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED
   ```

---

## Step 2: Push Database Schema & Seed Data to Aiven

From your local project terminal, you can push the entire schema and seed catalog to Aiven in two quick commands:

### 1. Set your Aiven connection URL

Create or update your `.env` file (or set in terminal):

```bash
# In your .env file:
DATABASE_URL="mysql://avnadmin:YOUR_PASSWORD@YOUR_AIVEN_HOST:PORT/defaultdb?ssl-mode=REQUIRED"
```

> **Note on SSL with mysql2:** If using Node.js without custom CA certificates, append `&ssl={"rejectUnauthorized":false}` or keep `?ssl-mode=REQUIRED`.

### 2. Push Schema & Seed Catalog

```bash
# Push all 13 tables (products, variants, orders, customers, etc.) to Aiven
npm run db:push

# Seed the 19 products, 33 variants, and 9 categories
npm run db:seed

# Verify 5/5 database stages on Aiven
npm run db:verify
```

Your Aiven cloud database is now fully populated!

---

## Step 3: Deploy Frontend to Vercel (Recommended & Free)

1. Go to [https://vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Select and import your GitHub repository: **`Raman-1166/tiles-system`**.
3. In **Configure Project**, under **Environment Variables**, add the following:

| Name                   | Value                                                                     | Note                        |
| ---------------------- | ------------------------------------------------------------------------- | --------------------------- |
| `DATABASE_URL`         | `mysql://avnadmin:...@...aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED` | From Aiven Service Overview |
| `ADMIN_SESSION_SECRET` | `generate-a-random-secret-at-least-32-characters-long`                    | Admin cookie signing        |
| `ORDER_TOKEN_SECRET`   | `generate-a-random-secret-at-least-32-characters-long`                    | Order lookup link signing   |
| `PAYMENT_PROVIDER`     | `mock` (or `stripe` for live payments)                                    | `mock` works out of the box |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app-name.vercel.app`                                        | Your Vercel domain          |

4. Click **Deploy**.
5. Vercel will build the Next.js application and deploy it globally on its CDN edge network.

---

## Step 4: Verification Checklist

Once deployed:

- Visit `https://your-domain/api/ready` — should return `{"ok": true, "status": "ready", "checks": {"db": "ok", "env": "ok"}}`.
- Visit `https://your-domain/shop` — all products and categories should load from your Aiven database.
- Visit `https://your-domain/visualizer` — 3D procedural textures and GLB furniture should render.
- Visit `https://your-domain/admin/login` — enter your admin credentials to manage inventory and orders.
