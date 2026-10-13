# Current Status — Clay & Co.

This document details the exact status of the codebase, identifying what is production-ready, what is partially implemented, what is missing or has bugs/warnings, and the prioritized roadmap of next steps.

---

## 1. What is Complete (Working in Production)

### 1.1 Database & Persistence
- **MySQL Connection & Resilience:** Configured with `mysql2` connection pool (`__tilestorePool`) surviving Next.js Turbopack reloads.
- **Automated Verification:** `verify-database.mjs` passes 5/5 validation stages (Connection, Database existence, Tables, Seeded Data, Cart operations).
- **Domain Seeding:** 9 categories, 19 products, and 33 SKU variants seeded across Floor Tiles, Wall Tiles, Mosaic Tiles, Accessories, Living Room, Dining Room, Bedroom, and Outdoor Furniture.
- **Health Check Endpoint:** `GET /api/health` queries `SELECT 1` on MySQL and returns HTTP 200 `{"ok":true,"status":"healthy"}`.

### 1.2 3D Graphics & Canvas Engines
- **Hero 3D Tile Wall (`Hero3D.tsx`):**
  - Self-contained procedural studio lighting environment with `@react-three/drei` `<Lightformer>`s (resolved the external CDN `potsdamer_platz_1k.hdr` fetch failure).
  - Instanced mesh rendering of tiles with interactive pointer ripple and touch flip physics.
  - Smooth camera rig tracking page scroll progress.
  - Automatic hardware tier detection falling back to `/images/hero-fallback.jpg` on low-power devices.
- **Procedural 2D Tile Generation (`tileArt.ts`, `TileImage.tsx`):**
  - Generates realistic ceramic tile faces with gloss reflection sheens, grout color joints, and patterns (marble, glaze, speck, wood) in HTML5 Canvas with zero network image overhead.
- **Parametric 3D Furniture Models (`furniture3d.ts`, `FurnitureImage.tsx`):**
  - Procedural Three.js geometry generators for 10 distinct furniture categories with customizable fabric and wood/metal finishes.
- **Room Visualizer (`RoomVisualizerNew.tsx`):**
  - Interactive 3D room environments (Living Room, Kitchen, Bathroom).
  - Surface switching (Floor, Wall, Both) and pattern layouts (Straight, Brick, Herringbone).
  - Real-time procedural texture generation reflecting chosen tile and grout colors.
  - "Before & After" comparison toggle and orbit camera controls.

### 1.3 Shopping & Product Detail Experiences
- **Catalog Navigation (`/shop`):**
  - Dedicated Tile and Furniture catalog views.
  - Filtering by category, price range, search query, material, colour family, and in-stock availability.
  - Price sorting (asc/desc) and newest first.
- **Product Detail Pages (`/shop/[type]/[slug]`):**
  - Interactive media gallery with 3D rotation view and tile closeups.
  - Live variant selection updating SKU, price, and stock levels.
  - Tile box calculator calculating square footage, adding 10% or 15% wastage, and determining required boxes.
  - Automated Open Graph metadata and Schema.org `AggregateOffer` JSON-LD generation.

### 1.4 Cart & Checkout Pipelines
- **Persistent Cart:**
  - Guest sessions backed by 90-day `cart_session` cookie.
  - Items persist in MySQL `cart_items` table.
  - Automatic quantity incrementing for duplicate items.
  - Client synchronization via Zustand store (`useCartStore`).
- **Checkout Process (`/checkout`, `/api/checkout`):**
  - Comprehensive customer contact, delivery address, and shipping method inputs.
  - 8% tax calculation and order total breakdown.
  - Generates unique order number (`CLAY-XXXXX`) and creates records in `orders` and `order_items` tables.
  - Empties cart upon successful order creation.

### 1.5 Security & Administration
- **Edge Security Middleware (`src/middleware.ts`):**
  - Restricts `/admin/*` routes to authenticated sessions.
  - Constant-time verification of HMAC-SHA256 signature on the `admin_session` cookie via Web Crypto API.
- **Admin Dashboard (`/admin`):**
  - Displays all products, categories, base pricing, and total variant inventory stock.
  - Visual status indicators for low stock (<15 units), out of stock, and active status.
  - Secure login and logout endpoints (`/api/admin/login`, `/api/admin/logout`).

---

## 2. What is Partly Done

| Feature | Current State in Code | What is Missing |
|---|---|---|
| **Stripe Payment Integration** | `orders.stripe_session_id` and `payments` table exist in schema. Checkout API calculates totals and sets `status = "paid"`. | Actual Stripe API client (`stripe`), Stripe Checkout redirect, and webhook listener are **not found**. |
| **Furniture 3D Models** | 4 binary GLB files (`armchair.glb`, `bookshelf.glb`, `coffee-table.glb`, `floor-lamp.glb`) exist in `public/models/furniture/`. | Other furniture products fall back to procedural Three.js meshes. GLB models for all catalog items are **not found**. |
| **PBR Tile Texture Maps** | Schema defines `texture_set` (`albedo`, `normal`, `roughness`) and generator script `scripts/generate-pbr-maps.mjs` exists. | `tileTextures.ts` returns `{}` as fallback because texture images are not placed in `public/textures/tiles/`. |
| **Room Visualizer Variants** | `RoomVisualizerNew.tsx` is connected and active. | An older implementation `RoomVisualizer.tsx` remains in the codebase but is not routed. |
| **Zustand Cart Stores** | `src/store/cartStore.ts` is actively used across all components. | An alternative store `src/lib/cart-store.ts` exists but is unreferenced. |

---

## 3. What is Missing or Has Bugs / Warnings

### 3.1 Missing Features
- **Customer Account Management:** The `customers` and `addresses` tables contain fields for customer profiles and password hashes (`password_hash`), but registration, login, and user profile pages are **not found**. Checkout currently runs as guest only.
- **Admin Product CRUD:** The admin panel at `/admin` is read-only. Forms to add new products, edit pricing, adjust inventory, or view order fulfillment details are **not found**.
- **Augmented Reality (AR):** `ARButton.tsx` and the `ar_model_url` database column exist, but USDZ models for iOS Quick Look are **not found**.

### 3.2 Known Deprecations & Warnings in Server Logs
- **Next.js 16 Middleware Deprecation Warning:**
  ```
  ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
  To migrate automatically, run: npx @next/codemod@canary middleware-to-proxy .
  ```
  *Impact:* The existing `src/middleware.ts` functions correctly, but will need migration in future Next.js major versions.
- **Three.js Clock Deprecation Warning:**
  ```
  [browser] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
  ```
  *Impact:* Non-breaking console notice from Three.js 0.186.1.

---

## 4. What to Do Next (Prioritized Action Plan)

### Step 1: Stripe Payment Gateway Integration
1. Install `stripe` SDK package (`npm install stripe`).
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`.
3. In `src/app/api/checkout/route.ts`, create a real Stripe Checkout Session and return the redirect URL.
4. Add a webhook handler (`src/app/api/webhooks/stripe/route.ts`) to listen for `checkout.session.completed`, update the order status in MySQL to `"paid"`, and insert a record into the `payments` table.

### Step 2: Next.js 16 Middleware to Proxy Migration
1. Run `npx @next/codemod@canary middleware-to-proxy .` or migrate `src/middleware.ts` to the Next.js 16 proxy convention to clear the deprecation warning.

### Step 3: Admin Catalog & Order Management CRUD
1. Build an admin order management page (`src/app/admin/orders/page.tsx`) to view incoming orders and update fulfillment status (`pending` → `packed` → `shipped` → `delivered`).
2. Add modal forms in `src/app/admin/page.tsx` allowing administrators to update product pricing, variant stock levels, and toggle active status.

### Step 4: Customer Authentication & Order History
1. Create user authentication routes (`/login`, `/register`) using bcrypt/Argon2 for `password_hash` in the `customers` table.
2. Link session carts to customer IDs upon login.
3. Add a customer dashboard (`/account/orders`) displaying past purchases and order status tracking.

### Step 5: Codebase Cleanup
1. Delete unused `src/lib/cart-store.ts` to prevent developer confusion with `src/store/cartStore.ts`.
2. Consolidate visualizer components by deprecating or removing `src/components/visualizer/RoomVisualizer.tsx` in favor of `RoomVisualizerNew.tsx`.
3. Run `scripts/generate-pbr-maps.mjs` to output physical texture sets into `public/textures/tiles/` and re-enable texture maps in `src/components/three/tileTextures.ts`.
