# Project Overview — Clay & Co.

## 1. Problem Statement
Purchasing ceramic tiles and architectural furniture online presents significant tactile and spatial challenges for customers. In conventional e-commerce stores:
- **Tiles cannot be felt or observed in varying light:** Static 2D photographs fail to convey glaze depth, glossiness, surface relief, and specular reflection angles.
- **Scale and spatial context are lost:** Customers struggle to visualize how specific tile sizes (e.g., 20×20 cm vs. 30×60 cm), layouts (straight, brick, herringbone), and grout colors interact across walls and floors in living spaces.
- **Quantity estimation is error-prone:** Calculating required tile boxes from room dimensions, tile coverage per box, and wastage percentages frequently leads to shortages or excessive surplus.
- **Furniture coordination is disjointed:** Choosing furniture that complements wall and floor materials requires tedious cross-referencing between separate platforms.

**Clay & Co.** resolves these challenges by uniting modern e-commerce with real-time 3D WebGL graphics and procedural rendering. Customers can turn tiles interactively, test real-time room configurations (living room, kitchen, bathroom) on floors and walls, inspect procedural and GLB furniture models with customizable fabrics/finishes, accurately calculate box quantities, and order directly through a unified cart and checkout flow.

---

## 2. Technology Stack

### Frontend & Application Framework
- **Framework:** Next.js 16.3.8 (App Router, Turbopack)
- **Language:** TypeScript 5.9.3
- **UI Library:** React 19.2.6 & React DOM 19.2.6
- **Styling:** Tailwind CSS 4.1.17 (`@tailwindcss/postcss`), CSS Modules (`*.module.css`), Vanilla CSS custom properties
- **Typography:** Google Fonts (`Bricolage Grotesque`, `DM Sans`) via `@import` in `globals.css`
- **State Management:** Zustand 5.0.15 for client-side cart synchronization

### 3D Graphics & Visual Computing
- **Core 3D Engine:** Three.js 0.186.1
- **React 3D Ecosystem:**
  - `@react-three/fiber` 9.8.1 (declarative Three.js scene graph)
  - `@react-three/drei` 10.7.9 (Orbit controls, procedural Lightformers, GLTF loader, HTML overlays)
- **AR & Web Components:** `@google/model-viewer` 4.3.1 (iOS Quick Look / WebXR preparation)
- **Procedural 2D Art Generator:** HTML5 Canvas API (`src/lib/tileArt.ts`) for procedural ceramic tile rendering with patterns (marble, glaze, speck, wood), grout lines, and gloss sheen.
- **Procedural 3D Furniture:** Three.js parametric mesh generator (`src/lib/furniture3d.ts`) supporting 10 furniture categories.

### Backend & Database
- **Runtime:** Node.js (>=20.0.0, running on Windows environment)
- **Database Engine:** MySQL 8.0.43 (database: `app_db`, character set: `utf8mb4_unicode_ci`)
- **Driver:** `mysql2` 3.11.5 (connection pool with persistent reuse across dev reloads)
- **ORM & Migrations:** Drizzle ORM 0.45.2, `drizzle-kit` 0.31.10
- **Database Scripts & Seeding:** `tsx` 4.19.2 executing `src/db/seed.ts`

### Security & Session Management
- **Guest Cart Session:** Persistent cookie-based UUID (`cart_session`, 90-day validity)
- **Admin Session:** Edge-compatible HMAC-SHA256 signed token (`admin_session`, 8-hour expiration) verified via Web Crypto API (`SubtleCrypto`) in Next.js middleware.
- **Secrets Management:** `dotenv` 17.3.1 loading `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.

---

## 3. User Personas (Who Uses It)

### 1. Homeowners & Renovators (End Consumers)
- Browse curated tile collections and architectural furniture.
- Interact with the 3D tile wall on the homepage to inspect glaze reflections and movement.
- Use the **Room Visualizer** to preview how tile colours, layouts, and grout combinations look in bathrooms, kitchens, and living rooms.
- Use the **Tile Calculator** on product pages to determine exact square meters and box counts required.
- Add items to a persistent cart and complete checkout with shipping and order confirmation.

### 2. Interior Designers & Architects
- Experiment with distinct finishes (Gloss, Matte, Natural, Satin) and color families (Terracotta, Sage Green, Charcoal, Warm Ivory, Chalk White).
- Select layout patterns (Straight, Brick, Herringbone) and custom grout contrasts.
- Inspect furniture dimensions (Width × Height × Depth in centimeters) and custom fabric/wood finishes in 3D.

### 3. Store Administrators & Catalog Managers
- Access protected back-office routes at `/admin`.
- Authenticate via secure password matching and HMAC session tokens.
- Monitor active products, catalog categorization, real-time variant pricing, total inventory quantities, and low-stock threshold alerts (<15 units).
