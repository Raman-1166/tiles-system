# Clay & Co. — Interactive 3D Tile & Furniture Experience

An interactive 3D e-commerce experience for ceramic tiles and architectural furniture built with **Next.js 16 (App Router & Turbopack)**, **Three.js / React Three Fiber**, **MySQL 8.0**, and **Drizzle ORM**.

---

## Features

- **Interactive 3D Hero Tile Wall:** Real-time ceramic tile grid with cursor ripple wave physics, touch flip rotation, and GPU-calculated studio reflections.
- **3D Room Visualizer:** Preview tiles on floors and walls across Living Room, Kitchen, and Bathroom environments with customizable layout patterns (straight, brick, herringbone) and grout colors.
- **Dual Catalog & Filtering:** Browse ceramic tiles and architectural furniture with price range, category, material, finish, and in-stock filters.
- **Product Detail Pages & Calculators:** Interactive 3D model viewers, live SKU variant selectors, and a room area-to-box tile calculator with wastage margins.
- **Persistent MySQL Cart & Checkout:** Cookie-session backed cart, reactive Zustand badge synchronization, address checkout flow, and database order placement.
- **Secure Admin Dashboard:** Edge-compatible HMAC-SHA256 authenticated inventory management panel.

---

## Prerequisites

- **Node.js:** `>= 20.0.0`
- **npm:** `>= 10.0.0`
- **MySQL:** `8.x` running locally or accessible via network

---

## Environment Setup

Create a `.env` file in the project root (see `.env.example`):

```env
DATABASE_URL=mysql://root:yourpassword@localhost:3306/app_db
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=your_32_character_random_secret_string
```

---

## Quick Start

Run the following commands in order:

### 1. Create the MySQL Database

Connect to your local MySQL server:

```powershell
mysql -uroot -p
```

Create the database with utf8mb4 encoding:

```sql
CREATE DATABASE IF NOT EXISTS app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Install Dependencies & Run Migrations

```powershell
npm install
npm run db:migrate
```

### 3. Seed Database

Populate categories, products, and SKU variants (run twice to confirm idempotent seeding):

```powershell
npm run db:seed
npm run db:seed
```

### 4. Verify Database Setup

Run the automated 5-step verification test suite:

```powershell
npm run db:verify
```

Expected output: `5/5 steps passed`

### 5. Start the Development Server

```powershell
npm run dev
```

Visit the application at:

- **Homepage:** [http://localhost:3000](http://localhost:3000)
- **Shop Catalog:** [http://localhost:3000/shop](http://localhost:3000/shop)
- **Room Visualizer:** [http://localhost:3000/visualizer](http://localhost:3000/visualizer)
- **Cart:** [http://localhost:3000/cart](http://localhost:3000/cart)
- **Checkout:** [http://localhost:3000/checkout](http://localhost:3000/checkout)
- **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Available Scripts

| Command               | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Starts Next.js development server with Turbopack       |
| `npm run build`       | Builds production bundle                               |
| `npm run start`       | Starts Next.js production server                       |
| `npm run lint`        | Runs ESLint validation                                 |
| `npm run typecheck`   | Runs TypeScript type checking (`tsc --noEmit`)         |
| `npm run db:migrate`  | Applies Drizzle database migrations                    |
| `npm run db:seed`     | Seeds database with categories, products, and variants |
| `npm run db:generate` | Generates new SQL migration files with Drizzle Kit     |
| `npm run db:studio`   | Opens Drizzle Studio database browser                  |

---

## Documentation

Comprehensive technical documentation is available in the [`docs/`](./docs) folder:

- [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md): Problem statement, tech stack, and user personas
- [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md): Core functional requirements and partially implemented features
- [`docs/DATABASE_DESIGN.md`](./docs/DATABASE_DESIGN.md): Table schemas, columns, constraints, and Mermaid ER diagram
- [`docs/API_DESIGN.md`](./docs/API_DESIGN.md): REST endpoints, request payloads, and response structures
- [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md): System architecture, execution runtimes, and Mermaid flow diagrams
- [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md): Codebase directory hierarchy and file index
- [`docs/CURRENT_STATUS.md`](./docs/CURRENT_STATUS.md): Current operational status, known warnings, and roadmap
