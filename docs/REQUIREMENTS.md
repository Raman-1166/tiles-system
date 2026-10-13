# Requirements Specification — Clay & Co.

This document classifies all features discovered in the codebase into **Must-Have** (core production features implemented and functional) and **Nice-to-Have / Partially Implemented** (features present in schema, stubs, or prototypes but not fully integrated).

---

## 1. Must-Have Features (Fully Implemented in Code)

### 1.1 Interactive 3D Hero Experience
- **Interactive Instanced Tile Wall (`HeroTileWall.tsx`):**
  - Grid of instanced ceramic tiles (cols and rows dynamically scaling based on device capability: 14×9 for high tier, 11×7 for medium tier, 8×6 for low tier).
  - Pointer hover wave ripple animation calculated via Euclidean distance.
  - Touch/tap flip interaction rotating individual tiles by 180 degrees.
  - Clearcoat and roughness physical material response with GPU-generated studio specular highlights.
- **Scroll Camera Rig (`HeroCameraRig.tsx`):**
  - Smooth camera translation pullback and angle adjustment bound to window scroll progress.
- **Hardware Tier Adaptability (`useDeviceTier.ts`, `useVisibleFrameloop.ts`):**
  - Automatic detection of hardware concurrency, device memory, and GPU capabilities.
  - Fallback to high-resolution static hero image (`/images/hero-fallback.jpg`) on mobile or low-capability devices.
  - Frameloop switches between `"always"` and `"never"` based on viewport intersection observer to conserve GPU resources when scrolled out of view.

### 1.2 Product Catalogue & Shop Browsing
- **Dual Catalog Segmentation (`src/app/shop/page.tsx`):**
  - Dedicated tabs and filtering for **Tiles** (`type=tile`) and **Furniture** (`type=furniture`).
- **Product Filtering & Sorting (`src/db/queries.ts`, `src/components/tiles/TileFilters.tsx`):**
  - Filter by category slug and category ID.
  - Filter by price range (`minPrice`, `maxPrice`).
  - Search query matching name, description, and material.
  - Filter by variant attributes: colour family, size label, finish, and stock status (`inStock`).
  - Sorting modes: newest (`newest`), price ascending (`price_asc`), and price descending (`price_desc`).
  - Server-side pagination with default page size of 24 items.
- **Procedural 2D Tile Card Rendering (`src/components/tiles/TileImage.tsx`, `src/lib/tileArt.ts`):**
  - Dynamic client-side HTML5 canvas generation producing realistic tile faces, glaze variations, grout colors, herringbone/straight layouts, and diagonal gloss reflections without requiring static image downloads.
- **Procedural Furniture Card Rendering (`src/components/furniture/FurnitureImage.tsx`):**
  - Three.js WebGL canvas snapshots for furniture cards based on category model types and fabric/finish colors.

### 1.3 Product Detail Pages (PDP)
- **Dynamic Routing (`src/app/shop/[type]/[slug]/page.tsx`):**
  - Validation that category type matches URL parameter (`tile` vs `furniture`); returns Next.js `notFound()` on mismatch or inactive status.
- **Interactive Tile Viewer (`TileMediaViewer.tsx`, `TileViewer.tsx`):**
  - Multi-view switching: Single tile closeup, 3×3 surface preview, and full-screen 3D rotation.
- **3D Furniture Viewer (`src/components/furniture/FurnitureViewer.tsx`, `FurnitureModel.tsx`):**
  - Real-time 3D rotation, pan, and zoom via Three.js.
  - Supports GLB binary files via `@react-three/drei` `useGLTF` with Draco compression support (`/draco/`).
  - Fallback to parametric procedural Three.js models when no GLB file is present.
  - Live dimension callouts (Width × Height × Depth) in centimeters.
- **Variant Selector (`ProductVariantSelector.tsx`):**
  - Dynamic selection of SKU variants based on colour, size, and finish.
  - Real-time updating of price, SKU code, and stock badge ("In Stock", "Only X left", or "Out of Stock").
- **Tile Box & Area Calculator (`TileCalculator.tsx`):**
  - User inputs room width and length (in meters or feet).
  - Automatically calculates square meters with a selectable 10% or 15% wastage margin.
  - Calculates exact number of boxes required based on `coveragePerBoxSqm` and computes total order price.
- **SEO & Structured Data:**
  - Dynamic Open Graph metadata and Schema.org `AggregateOffer` JSON-LD injection.

### 1.4 3D Room Visualizer
- **Visualizer Engine (`src/app/visualizer/page.tsx`, `RoomVisualizerNew.tsx`):**
  - Interactive 3D room scenes: **Living Room**, **Kitchen**, and **Bathroom**.
  - Surface targeting: Apply tiles to **Floor**, **Wall**, or **Both**.
  - Tile layout patterns: **Straight**, **Brick**, and **Herringbone**.
  - Real-time grout color selection with live procedural canvas re-rendering onto 3D surfaces.
  - Orbit camera controls for inspection from any angle.
  - "Before & After" comparison toggle slider.
  - Direct "Add to Cart" with room square footage and layout configuration stored in line-item metadata.

### 1.5 Shopping Cart & Session Persistence
- **Guest Session Tracking (`src/lib/session.ts`):**
  - Cookie-based session generation (`cart_session`) with 90-day lifespan.
- **Database-Backed Cart (`src/lib/cart.ts`, `src/app/api/cart/route.ts`):**
  - Cart items persist in MySQL table `cart_items`.
  - Automatic line-item merging and quantity incrementing for duplicate items.
  - Update quantity (`PATCH /api/cart/[id]`) and remove line (`DELETE /api/cart/[id]`).
- **Reactive Zustand Store (`src/store/cartStore.ts`):**
  - Synchronizes badge counts and cart totals across navigation components.
- **Cart Page UI (`src/app/cart/page.tsx`):**
  - Full breakdown of cart lines, custom tile swatches, delivery calculations, and "Save for Later" drawer.

### 1.6 Checkout & Order Creation
- **Checkout Interface (`src/app/checkout/page.tsx`):**
  - Customer contact details, multi-line delivery address, and shipping method selection.
  - Order breakdown including subtotal, tax (8%), shipping costs, and final total.
- **Order Generation API (`src/app/api/checkout/route.ts`):**
  - Generates unique order identifier (format `CLAY-XXXXX`).
  - Writes records to `orders` and `order_items` tables in MySQL.
  - Automatically empties the cart upon successful placement.

### 1.7 Administration & Access Control
- **Security Middleware (`src/middleware.ts`):**
  - Edge-compatible HMAC-SHA256 cookie validation (`admin_session`) protecting `/admin/*`.
  - Unauthenticated requests redirected to `/admin/login?from=...`.
- **Admin Dashboard (`src/app/admin/page.tsx`):**
  - Live table of all products in catalog.
  - Visual product preview thumbnails, category categorization, and retail pricing.
  - Summed variant inventory counts with visual color badges: Red for out of stock, Amber for low stock (<15 units), Green for active.

---

## 2. Nice-to-Have & Partially Implemented Features

| Feature | Code Status | Notes |
|---|---|---|
| **Stripe Payment Gateway** | Partially Implemented | Database columns (`stripeSessionId` in `orders`, `payments` table) exist, but checkout API mocks success (`status: "paid"`) without redirecting to a payment gateway. |
| **Customer Authentication** | Partially Implemented | `customers` table with `passwordHash` and `addresses` table exist in `src/db/schema.ts`, but login/registration UI routes are **not found**. Checkout operates exclusively as guest. |
| **Augmented Reality (AR / Quick Look)** | Partially Implemented | `ARButton.tsx` and `arModelUrl` column exist, but USDZ files are **not found** in `public/models`. |
| **PBR Tile Texture Maps** | Stubbed / Fallback | Schema contains `textureSet` (`albedo`, `normal`, `roughness`) and generator script `scripts/generate-pbr-maps.mjs` exists, but `src/components/three/tileTextures.ts` returns an empty object (`{}`) to prevent 404 network fetch errors. |
| **Admin Product CRUD** | Partially Implemented | Admin panel displays a read-only product inventory table; forms to create, edit, or delete products or update order fulfillment are **not found**. |
| **Order Management Dashboard** | Not Found | Database stores orders in `orders` table, but an administrative UI to inspect or manage orders is **not found** in `/admin`. |
| **Coupon / Discount System** | Partially Implemented | Input field exists in `src/app/cart/page.tsx`, but backend validation endpoint is **not found**. |
