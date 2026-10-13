# Clay & Co. — Industry Readiness Progress Tracker

This document tracks all tasks, baselines, code-vs-doc audits, and out-of-scope issues identified across the industry-readiness roadmap.

---

## 1. Baseline Audit & Code Truth Findings (Task 0.1 & 0.2)

### 1.1 Audit Question Answers (Direct from Code)

- **(a) Where "Save for later" is stored:**
  - **Location:** Client-side browser `localStorage` under the key `"clay_saved_cart_items"`.
  - **Evidence:** `src/app/cart/page.tsx` (lines 671, 683). Not persisted in MySQL.
- **(b) Whether admin pages currently render the shop Navbar and Footer:**
  - **Answer:** **Yes**.
  - **Evidence:** `src/app/layout.tsx` wraps all routes (including `/admin` and `/admin/login`) with `<Navbar />` and `<Footer />` because route groups `(store)` and `(admin)` have not yet been established.
- **(c) Whether any API response leaks fields it shouldn't:**
  - **Answer:** **Yes**.
    1. `GET /api/health` leaks internal database error messages on failure: `{ ok: false, status: "unhealthy", error: error.message }` (reveals database host, port, credentials if connection string is echoed).
    2. `POST /api/checkout` returns `{ error: err?.message }` on exceptions.
    3. `GET /api/products` and `GET /api/products/[slug]` return entire unprojected database records, including internal timestamps (`createdAt`, `updatedAt`), raw internal JSON specs, and unsanitized parameters.
- **(d) The payload size of `GET /api/products`:**
  - **Measured payload:** **33,916 bytes (~33.12 KB)** raw uncompressed JSON for 19 products.
- **(e) Whether any product has a NULL `category_id`:**
  - **Answer:** **No (0 products)**. All 19 active products in `app_db` have valid non-null `category_id` values.
- **(f) How order numbers are generated and whether they can collide:**
  - **Implementation:** `const randomDigits = Math.floor(10000 + Math.random() * 90000); const orderNumber = \`CLAY-\${randomDigits}\`;`in`src/app/api/checkout/route.ts` (lines 38–39).
  - **Collision Risk:** Highly prone to collisions (only 90,000 possibilities, ~50% collision probability after ~350 orders per the Birthday Paradox).
  - **Schema Risk:** `orders.order_number` lacks a `UNIQUE` constraint in `src/db/schema.ts`, and there is no retry logic.
- **(g) Which files import the dead code listed in task 2.2:**
  - `src/lib/cart-store.ts`: **0 files** (already deleted; was an unreferenced alternate cart store).
  - `RoomVisualizer.tsx`: **0 files** (already deleted; app routes to `RoomVisualizerNew.tsx`).
  - `src/lib/products.ts`: **3 files** import it:
    1. `src/app/page.tsx`
    2. `src/app/api/products/[slug]/route.ts`
    3. `src/app/api/products/route.ts`
       (All 3 can be redirected to import directly from `@/db/queries`).

### 1.2 Baseline Verification Summary

- **Git:** Initialized clean baseline on `main` (`fd2fff6`), active branch `industry-ready`.
- **Environment Secrets:** `.env` confirmed untracked and excluded in `.gitignore`. No credentials were ever committed to git history.
- **Database (`verify-database.mjs`):** 5/5 stages passed (MySQL 8.0.43, `app_db`, 11 tables, 19 products, 33 variants, cart operations operational).
- **Test Database Isolation (`setup-test-db.mjs`):** Isolated `app_db_test` created and migrated without mutating dev DB.
- **TypeScript & Build:** `next build` and `tsc --noEmit` succeed cleanly with 0 errors. Next.js 16 Proxy convention verified without deprecation warnings.
- **Unit Testing:** Vitest test suite runs and passes (8/8 tests pass).
- **ESLint:** Baseline recorded: 19 errors (17 `@typescript-eslint/no-explicit-any`, 2 `react-hooks/set-state-in-effect`), 16 warnings.

---

## 2. Phase-by-Phase Task Tracker

| Task ID | Task Description                                                                         | Status      | Evidence / Files                                                            | Commit Hash |
| ------- | ---------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------- | ----------- |
| **0.1** | Branch `industry-ready`, audit baseline, confirm `.env` safety                           | **done**    | `.gitignore`, `git branch`                                                  | `fd2fff6`   |
| **0.2** | `docs/PROGRESS.md` with baseline audit answers                                           | **done**    | `docs/PROGRESS.md`                                                          | `ef0d690`   |
| **0.3** | Prettier, EditorConfig, scripts (`typecheck`, `test`, `test:e2e`), Husky, test DB script | **done**    | `package.json`, `.editorconfig`, `.prettierrc`, `scripts/setup-test-db.mjs` | `a7adc3c`   |
| **0.4** | GitHub Actions CI (`.github/workflows/ci.yml`), Dependabot                               | **done**    | `.github/workflows/ci.yml`, `.github/dependabot.yml`                        | `e13aa38`   |
| **0.5** | Zod `src/lib/env.ts` validation, `.env.example` sync                                     | **done**    | `src/lib/env.ts`, `src/lib/env.test.ts`, `.env.example`                     | `4608f8b`   |
| **1.1** | `money.ts`, `tile-math.ts` with pure unit tests                                          | **pending** | `src/lib/money.ts`, `src/lib/tile-math.ts`, `src/config/commerce.ts`        |             |
| **1.2** | Services layer (`src/services/*`), uniform error shapes                                  | **pending** | `src/services/`                                                             |             |
| **1.3** | Database migrations (indexes, order statuses, events, unique keys)                       | **pending** | `drizzle/`, `src/db/schema.ts`                                              |             |
| **1.4** | Stripe checkout & webhook transaction pipeline, mock payment provider                    | **pending** | `src/app/api/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`     |             |
| **1.5** | Order tracking & lookup pages (`/order/[orderNumber]`, `/order/lookup`)                  | **pending** | `src/app/order/`                                                            |             |
| **1.6** | Double-submit idempotency protection                                                     | **pending** | `src/app/checkout/page.tsx`, `src/services/checkout.ts`                     |             |
| **1.7** | Security: Next 16 `proxy.ts`, HttpOnly cookies, `requireAdmin()`, rate limiting          | **partial** | `src/proxy.ts` (migrated from `middleware.ts`)                              |             |
| **1.8** | Money, tile-math, webhook idempotency, and checkout E2E tests                            | **pending** | `tests/unit/`, `tests/integration/`, `tests/e2e/`                           |             |
| **2.1** | Route groups: `(store)` and `(admin)/admin`, root layout simplification                  | **pending** | `src/app/(store)/`, `src/app/(admin)/`                                      |             |
| **2.2** | Remove dead code (`products.ts` re-export, rename `RoomVisualizerNew`)                   | **partial** | `cart-store.ts` removed                                                     |             |
| **2.3** | Consolidate docs into README/docs, move scripts, prune `AGENTS.md`/`CLAUDE.md`           | **pending** | `README.md`, `scripts/`                                                     |             |
| **2.4** | Accessible UI primitives in `src/components/ui/`                                         | **pending** | `src/components/ui/`                                                        |             |
| **2.5** | Data consolidation & schema contract                                                     | **pending** | `drizzle/`, `src/db/schema.ts`                                              |             |
| **3.1** | Trust pages (`about`, `contact`, `faq`, `shipping-returns`, `privacy`, `terms`)          | **pending** | `src/app/(store)/`                                                          |             |
| **3.2** | Mini-cart slideover, toast feedback, remove coupon placeholder                           | **pending** | `src/components/layout/MiniCart.tsx`                                        |             |
| **3.3** | Multi-step checkout polish, shared validation schema                                     | **pending** | `src/app/(store)/checkout/`                                                 |             |
| **3.4** | Catalog pagination, URL search params, debounced search, EXPLAIN indexes                 | **pending** | `src/app/(store)/shop/`, `src/app/api/products/route.ts`                    |             |
| **3.5** | Pre-rendered static thumbnails for catalog cards, remove Unsplash hot-links              | **pending** | `scripts/generate-thumbnails.mjs`, `public/images/`                         |             |
| **3.6** | Accessibility (A11y ≥ 95), keyboard tile flip, reduced motion                            | **pending** | `tests/e2e/a11y.spec.ts`                                                    |             |
| **4.1** | Tile sample ordering flow                                                                | **pending** | `src/config/commerce.ts`, `src/app/(store)/shop/`                           |             |
| **4.2** | Cross-tool link: PDP → Visualizer → Calculator                                           | **pending** | `src/app/(store)/tools/tile-calculator/`                                    |             |
| **4.3** | "You'll also need" accessories recommendation engine                                     | **pending** | `src/config/accessories.ts`                                                 |             |
| **4.4** | Visualizer state URL serialization & PNG export                                          | **pending** | `src/components/visualizer/`                                                |             |
| **4.5** | GLB furniture in visualizer scenes                                                       | **pending** | `src/components/visualizer/`                                                |             |
| **4.6** | Dual unit pricing display (m² / ft²)                                                     | **pending** | `src/components/catalog/`                                                   |             |
| **4.7** | AR model-viewer optimization & PBR map benchmark                                         | **pending** | `src/components/product/ARButton.tsx`                                       |             |
| **5.1** | Admin sidebar shell & order fulfillment dashboard (`/admin/orders`)                      | **pending** | `src/app/(admin)/admin/orders/`                                             |             |
| **5.2** | Admin product CRUD, variant stock editor, S3/local image upload                          | **pending** | `src/app/(admin)/admin/products/`                                           |             |
| **5.3** | Customer authentication, saved addresses, wishlist migration                             | **pending** | `src/app/(store)/account/`                                                  |             |
| **6.1** | Observability (Sentry, Pino structured logs, `/api/ready`)                               | **pending** | `src/lib/logger.ts`, `src/app/api/ready/route.ts`                           |             |
| **6.2** | Next 16 cache tags, bundle optimization, Lighthouse verification                         | **pending** | `next.config.ts`                                                            |             |
| **6.3** | Security headers, CSP report-only → enforced                                             | **pending** | `src/proxy.ts`                                                              |             |
| **6.4** | SEO: `sitemap.ts`, `robots.ts`, Open Graph, JSON-LD schemas                              | **pending** | `src/app/sitemap.ts`, `src/app/robots.ts`                                   |             |
| **6.5** | Dockerfile, docker-compose (app + MySQL + Mailpit), deployment runbook                   | **pending** | `Dockerfile`, `docker-compose.yml`, `docs/RUNBOOK.md`                       |             |
| **6.6** | Handover documentation & ADRs (`docs/adr/`)                                              | **pending** | `docs/adr/`, `docs/INDUSTRY_READINESS_REPORT.md`                            |             |

---

## 3. "Found Along the Way" (Out-of-Scope Issues & Tech Debt)

1. **Unsplash Image External Dependency:** Product images in `seed.ts` reference `images.unsplash.com`. Should be replaced with self-hosted assets in Phase 3.5.
2. **Three.js Clock Deprecation Notice:** Console warning regarding `THREE.Clock` deprecation in Three.js r186.
3. **Database Client Packaging:** Node warns about `MODULE_TYPELESS_PACKAGE_JSON` when executing scripts with ESM imports without `"type": "module"` in `package.json`.
4. **CSS Font Loading:** `globals.css` uses `@import url(...)` for Google Fonts, causing render-blocking stylesheets. Should migrate to `next/font/google`.
