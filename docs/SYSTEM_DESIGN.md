# System Design — Clay & Co.

This document outlines the system architecture, component boundaries, execution runtimes, data flow pipelines, and session management protocols of the Clay & Co. e-commerce platform.

---

## 1. High-Level System Architecture

Clay & Co. is architected as a hybrid full-stack application built on **Next.js 16 (App Router)** with **Turbopack**, backed by a **MySQL 8.0** relational database.

```mermaid
graph TB
    subgraph ClientBrowser [Client Browser Environment]
        UI[React 19 Components]
        WebGL[Three.js / React Three Fiber / Drei]
        Canvas2D[Procedural 2D Tile Engine]
        ZustandStore[Zustand Cart Store]
        CookieStorage[Browser Cookie Store: cart_session, admin_session]
    end

    subgraph EdgeRuntime [Next.js Edge Middleware]
        MW[middleware.ts: SubtleCrypto HMAC-SHA256 Guard]
    end

    subgraph ServerRuntime [Next.js Node.js Server Runtime]
        RSC[React Server Components: /shop, /shop/:type/:slug, /admin]
        API[API Route Handlers: /api/cart, /api/checkout, /api/products, /api/admin]
        DrizzleORM[Drizzle ORM Query Layer]
        Pool[mysql2 Connection Pool: __tilestorePool]
    end

    subgraph DatabaseLayer [Persistence Tier]
        MySQL[(MySQL 8.0: app_db)]
    end

    %% Client Interactions
    UI -->|Read / Mutate| ZustandStore
    UI -->|Render 3D Viewers| WebGL
    UI -->|Render Tile Swatches| Canvas2D
    CookieStorage -.->|Sends Cookies| MW
    CookieStorage -.->|Sends Cookies| API

    %% Edge Routing
    MW -->|Authorize /admin| RSC
    MW -->|Redirect Unauthorized| UI

    %% Server Interactions
    RSC -->|Direct Database Queries| DrizzleORM
    API -->|Cart & Order Operations| DrizzleORM
    ZustandStore -->|Fetch / Revalidate| API
    UI -->|Form Post / Checkout| API

    %% Database Connectivity
    DrizzleORM -->|Executes SQL| Pool
    Pool -->|TCP Connection Pool :3306| MySQL
```

---

## 2. Architectural Tiers & Communication Protocols

### 2.1 Frontend Tier (Client Browser)
- **React Server Components (RSC) vs. Client Components:**
  - High-level layout pages (`src/app/shop/page.tsx`, `src/app/shop/[type]/[slug]/page.tsx`, `src/app/admin/page.tsx`) run as **Server Components**, querying the database directly with zero client JavaScript overhead for initial data loading.
  - Interactive nodes (`Hero3D.tsx`, `RoomVisualizerNew.tsx`, `FurnitureViewer.tsx`, `TileImage.tsx`, `AddToCartForm.tsx`, `ProductVariantSelector.tsx`) are marked with `"use client"` and dynamically imported with `{ ssr: false }` to isolate WebGL canvas lifecycle from the server.
- **Client-Side State Synchronization:**
  - `src/store/cartStore.ts`: Zustand store managing badge counter (`count`), current total (`totalCents`), and hydration flags.
  - Whenever an "Add to Cart", quantity update, or item removal occurs, the client invokes the corresponding Route Handler and updates the Zustand store from the server JSON response.

### 2.2 Security & Edge Middleware Tier
- **Edge Middleware (`src/middleware.ts`):**
  - Targets `/admin/:path*` (excluding `/admin/login`).
  - Executes on the **Edge Runtime** (lightweight V8 isolate, no `node:crypto`).
  - Utilizes Web Crypto API `crypto.subtle` to perform HMAC-SHA256 signature verification and timing-safe constant-time bitwise comparisons on the `admin_session` token (`admin:<timestamp>.<signature>`).
  - Redirects invalid or expired sessions immediately to `/admin/login?from=<path>`.

### 2.3 Backend & Route Handler Tier
- **Route Handlers (`src/app/api/*`):**
  - Run on the **Node.js Server Runtime**.
  - Handles state mutations and JSON communications for cart management, checkout submissions, and authentication.
- **Session Resolution:**
  - Guest Cart: `src/lib/session.ts` extracts `cart_session` from incoming cookies or generates a `crypto.randomUUID()` attached to the outgoing `Set-Cookie` header with a 90-day lifespan.
  - Admin: `src/lib/admin-session.ts` signs payloads with `process.env.ADMIN_SESSION_SECRET` using Node.js `node:crypto` (`createHmac`).

### 2.4 Data Access Tier
- **Connection Pooling (`src/db/index.ts`):**
  - Uses `mysql2/promise` with global singleton memoization (`globalThis.__tilestorePool` and `globalThis.__tilestoreDb`). This prevents socket exhaustion during Next.js Turbopack hot-module reloads.
- **Type-Safe Queries (`src/db/queries.ts`):**
  - Built using Drizzle ORM query builders (`db.select().from(...).where(...)`).
  - Joins products, categories, and SKU variants with strongly typed results (`ProductWithDetails`).

---

## 3. Core Data Flow Pipelines

### 3.1 Product Detail & Variant Selection Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant RSC as Server Page (PDP)
    participant DB as MySQL Database
    participant Client as Client Component (ProductVariantSelector)

    User->>RSC: GET /shop/tile/chalk-white-gloss
    RSC->>DB: getProductBySlug("chalk-white-gloss")
    DB-->>RSC: Return product, category, and variants
    RSC-->>User: Render HTML with initial product data + JSON-LD
    User->>Client: Selects Variant (e.g., Size: 20x20, Finish: Gloss)
    Client->>Client: Match SKU in preloaded variants array
    Client->>User: Re-render price, SKU code, stock availability badge
```

---

### 3.2 Add to Cart & Persistence Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant API as Route Handler (/api/cart)
    participant Lib as Cart Service (src/lib/cart.ts)
    participant DB as MySQL (cart_items)
    participant Store as Zustand Store (cartStore)

    User->>API: POST /api/cart { productId: 1, variantId: 1, quantity: 2, meta: {...} }
    Note over API: Extracts or creates cart_session UUID
    API->>Lib: addToCart({ sessionId, productId, variantId, quantity, meta })
    Lib->>DB: Check existing matching row without metadata
    alt Existing line found
        Lib->>DB: UPDATE cart_items SET quantity = quantity + 2
    else New line or custom visualizer metadata
        Lib->>DB: INSERT INTO cart_items (...)
    end
    DB-->>Lib: Row inserted / updated
    Lib->>DB: SELECT * FROM cart_items JOIN products WHERE session_id = ?
    DB-->>Lib: Returns all current lines
    Lib-->>API: Returns { item, count, totalCents }
    API-->>User: 200 OK + Set-Cookie (if new session)
    User->>Store: setFromResponse({ count, totalCents })
    Store-->>User: Updates Navbar cart counter badge
```

---

### 3.3 Checkout & Order Creation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant CheckoutAPI as Route Handler (/api/checkout)
    participant DB as MySQL (orders & order_items)
    participant CartLib as Cart Service (src/lib/cart.ts)

    User->>CheckoutAPI: POST /api/checkout (Customer, Address, Shipping Method)
    CheckoutAPI->>CartLib: getCartLines(sessionId)
    CartLib->>DB: SELECT active cart lines for session
    DB-->>CartLib: Returns lines
    alt Cart is empty
        CheckoutAPI-->>User: 400 Bad Request ("Cart is empty")
    else Cart has items
        CheckoutAPI->>CheckoutAPI: Calculate subtotal, shipping ($0 / $25), tax (8%), total
        CheckoutAPI->>CheckoutAPI: Generate order number "CLAY-XXXXX"
        CheckoutAPI->>DB: INSERT INTO orders (orderNumber, email, shippingAddress, totals, status='paid')
        DB-->>CheckoutAPI: Order insertId
        loop For each cart line
            CheckoutAPI->>DB: INSERT INTO order_items (orderId, variantId, name, sku, price, qty)
        end
        CheckoutAPI->>CartLib: clearCart(sessionId)
        CartLib->>DB: DELETE FROM cart_items WHERE session_id = ?
        CheckoutAPI-->>User: 200 OK { ok: true, orderNumber: "CLAY-XXXXX", totals... }
        User->>User: Display Order Confirmation Screen
    end
```
