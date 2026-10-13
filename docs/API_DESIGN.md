# API Design — Clay & Co.

This document details every REST endpoint implemented under `src/app/api/`. All endpoints are built with Next.js App Router Route Handlers (`route.ts`).

---

## 1. API Route Index

| Method | Endpoint | Description | Auth / Session |
|---|---|---|---|
| `GET` | `/api/health` | Service and MySQL database health check | Public |
| `GET` | `/api/products` | Retrieve filtered product catalog | Public |
| `GET` | `/api/products/[slug]` | Retrieve single product details by slug | Public |
| `GET` | `/api/cart` | Retrieve current cart lines, item count, and total | `cart_session` Cookie |
| `POST` | `/api/cart` | Add product/variant to cart or increment quantity | `cart_session` Cookie (auto-created) |
| `PATCH` | `/api/cart/[id]` | Update line item quantity | `cart_session` Cookie |
| `DELETE` | `/api/cart/[id]` | Remove line item from cart | `cart_session` Cookie |
| `POST` | `/api/checkout` | Process order submission and save order to DB | `cart_session` Cookie |
| `POST` | `/api/admin/login` | Authenticate administrator and set session cookie | Public |
| `POST` | `/api/admin/logout` | Revoke administrator session cookie | Admin Cookie |

---

## 2. Endpoint Specifications

### 2.1 Health Check
**`GET /api/health`**
- **Description:** Verifies database connectivity by executing a raw SQL query (`SELECT 1`).
- **Headers:** None required.
- **Request Parameters / Body:** None.
- **Responses:**
  - **`200 OK` (Healthy):**
    ```json
    {
      "ok": true,
      "status": "healthy"
    }
    ```
  - **`503 Service Unavailable` (Database Failure):**
    ```json
    {
      "ok": false,
      "status": "unhealthy",
      "error": "connect ECONNREFUSED 127.0.0.1:3306"
    }
    ```

---

### 2.2 List Products
**`GET /api/products`**
- **Description:** Fetches products from MySQL. Optionally filters by category slug.
- **Query Parameters:**
  - `category` *(optional, string)*: Slug of category to filter (e.g., `floor-tiles`, `living-room`).
- **Request Body:** None.
- **Responses:**
  - **`200 OK`:**
    ```json
    {
      "products": [
        {
          "id": 1,
          "categoryId": 3,
          "slug": "chalk-white-gloss",
          "name": "Chalk White Gloss Tile",
          "tagline": "Pure chalk white with a mirror-gloss glaze.",
          "description": "Thick glazed ceramic tile...",
          "material": "Ceramic",
          "soldBy": "box",
          "coveragePerBoxSqm": "1.4400",
          "priceCents": 4200,
          "colorHex": "#f4f1ea",
          "unit": "per box",
          "images": ["https://images.unsplash.com/..."],
          "specs": {
            "Finish": "Gloss",
            "Tile Size": "20×20 cm",
            "Coverage": "1.44 m² / box"
          },
          "textureSet": null,
          "tileSizeCm": 20,
          "visualizerColor": "#f4f1ea",
          "pattern": "glaze",
          "finish": "gloss",
          "pricePerM2": 2900,
          "textureImage": null,
          "gloss": true,
          "groutColor": "#d6d0c5",
          "tileLayout": "straight",
          "tilesAcross": 3,
          "tileType": "Gloss",
          "colourFamily": "White",
          "sizeLabel": "20×20",
          "showFromPrice": false,
          "modelUrl": null,
          "arModelUrl": null,
          "dimensions": null,
          "featured": true,
          "isActive": true,
          "createdAt": "2026-10-12T13:47:00.000Z",
          "updatedAt": "2026-10-12T13:47:00.000Z",
          "category": {
            "id": 3,
            "name": "Floor Tiles",
            "slug": "floor-tiles",
            "parentId": null,
            "type": "tile",
            "sortOrder": 1,
            "createdAt": "2026-10-12T13:47:00.000Z",
            "updatedAt": "2026-10-12T13:47:00.000Z"
          },
          "productVariants": [
            {
              "id": 1,
              "productId": 1,
              "sku": "CWG-2020",
              "size": "20×20 cm",
              "colour": "Chalk White",
              "finish": "Gloss",
              "priceCents": 4200,
              "salePriceCents": null,
              "stockQuantity": 85,
              "lowStockThreshold": 10,
              "createdAt": "2026-10-12T13:47:00.000Z",
              "updatedAt": "2026-10-12T13:47:00.000Z"
            }
          ]
        }
      ]
    }
    ```

---

### 2.3 Get Product by Slug
**`GET /api/products/[slug]`**
- **Description:** Returns full product details, resolved category, and active SKU variants.
- **Path Parameters:**
  - `slug` *(required, string)*: The product slug (e.g., `chalk-white-gloss`, `nordic-dining-chair`).
- **Request Body:** None.
- **Responses:**
  - **`200 OK`:**
    ```json
    {
      "product": {
        "id": 1,
        "categoryId": 3,
        "slug": "chalk-white-gloss",
        "name": "Chalk White Gloss Tile",
        "tagline": "Pure chalk white with a mirror-gloss glaze.",
        "description": "Thick glazed ceramic tile...",
        "priceCents": 4200,
        "category": { "id": 3, "name": "Floor Tiles", "slug": "floor-tiles" },
        "productVariants": [ ... ]
      }
    }
    ```
  - **`404 Not Found`:**
    ```json
    {
      "error": "Not found"
    }
    ```

---

### 2.4 Get Cart
**`GET /api/cart`**
- **Description:** Returns all line items for the session matching the `cart_session` cookie.
- **Headers / Cookies:**
  - Cookie: `cart_session=<uuid>` *(optional; returns empty lines if omitted)*
- **Request Body:** None.
- **Responses:**
  - **`200 OK`:**
    ```json
    {
      "lines": [
        {
          "id": 4,
          "sessionId": "4bb94a2e-ff6a-49ae-a83a-8664ecbf25a3",
          "productId": 1,
          "variantId": 1,
          "quantity": 2,
          "variant": null,
          "meta": {
            "room": "kitchen",
            "layout": "herringbone",
            "groutColor": "#d6d0c5"
          },
          "createdAt": "2026-10-12T13:50:00.000Z",
          "product": {
            "id": 1,
            "name": "Chalk White Gloss Tile",
            "priceCents": 4200,
            "slug": "chalk-white-gloss"
          }
        }
      ],
      "count": 2,
      "totalCents": 8400
    }
    ```

---

### 2.5 Add to Cart
**`POST /api/cart`**
- **Description:** Adds an item to the current session cart. If no session exists, generates a new UUID and sets the `cart_session` cookie (90 days). If identical item without metadata exists, increments the quantity.
- **Headers:**
  - `Content-Type: application/json`
  - Cookie: `cart_session=<uuid>` *(optional)*
- **Request Body Payload:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `productId` | `number` | Yes | ID of product to add |
  | `variantId` | `number` | No | ID of chosen SKU variant |
  | `quantity` | `number` | No | Quantity to add (defaults to 1) |
  | `variant` | `string` | No | Legacy variant label |
  | `meta` | `object` | No | Visualizer attributes (`{ layout, groutColor, areaSqM, room }`) |
- **Example Request Body:**
  ```json
  {
    "productId": 1,
    "variantId": 1,
    "quantity": 3,
    "meta": {
      "surface": "floor",
      "layout": "straight"
    }
  }
  ```
- **Responses:**
  - **`200 OK`:**
    - *Headers:* `Set-Cookie: cart_session=<uuid>; Path=/; Max-Age=7776000; SameSite=Lax`
    ```json
    {
      "ok": true,
      "item": {
        "id": 7,
        "sessionId": "4bb94a2e-ff6a-49ae-a83a-8664ecbf25a3",
        "productId": 1,
        "variantId": 1,
        "quantity": 3,
        "variant": null,
        "meta": { "surface": "floor", "layout": "straight" },
        "createdAt": "2026-10-12T13:51:00.000Z"
      },
      "count": 3,
      "totalCents": 12600
    }
    ```
  - **`400 Bad Request`:**
    ```json
    {
      "error": "productId is required"
    }
    ```

---

### 2.6 Update Cart Item Quantity
**`PATCH /api/cart/[id]`**
- **Description:** Updates the quantity of a specific line item. If quantity <= 0, deletes the item.
- **Path Parameters:**
  - `id` *(required, number)*: Primary key ID in `cart_items`.
- **Headers / Cookies:**
  - Cookie: `cart_session=<uuid>` *(required)*
- **Request Body:**
  ```json
  {
    "quantity": 5
  }
  ```
- **Responses:**
  - **`200 OK`:**
    ```json
    {
      "ok": true,
      "count": 5,
      "totalCents": 21000
    }
    ```
  - **`400 Bad Request` (Missing Session or Invalid Quantity):**
    ```json
    {
      "error": "No session"
    }
    ```
    or
    ```json
    {
      "error": "quantity is required"
    }
    ```

---

### 2.7 Delete Cart Item
**`DELETE /api/cart/[id]`**
- **Description:** Deletes a specific line item from the user's cart session.
- **Path Parameters:**
  - `id` *(required, number)*: Primary key ID in `cart_items`.
- **Headers / Cookies:**
  - Cookie: `cart_session=<uuid>` *(required)*
- **Request Body:** None.
- **Responses:**
  - **`200 OK`:**
    ```json
    {
      "ok": true,
      "count": 0,
      "totalCents": 0
    }
    ```
  - **`400 Bad Request`:**
    ```json
    {
      "error": "No session"
    }
    ```

---

### 2.8 Checkout Order Placement
**`POST /api/checkout`**
- **Description:** Converts cart lines into a confirmed order in MySQL (`orders` and `order_items`), clears the session cart, and returns the generated order reference.
- **Headers / Cookies:**
  - `Content-Type: application/json`
  - Cookie: `cart_session=<uuid>` *(required)*
- **Request Body:**
  ```json
  {
    "name": "Alex Taylor",
    "email": "alex.taylor@example.com",
    "line1": "742 Evergreen Terrace",
    "line2": "Apt 4B",
    "city": "San Francisco",
    "region": "CA",
    "postalCode": "94107",
    "country": "US",
    "shippingMethod": "standard"
  }
  ```
  *(Note: `shippingMethod` can be `"standard"` [$0.00] or `"express"` [$25.00])*
- **Responses:**
  - **`200 OK` (Order Created):**
    ```json
    {
      "ok": true,
      "orderNumber": "CLAY-58291",
      "subtotalCents": 8400,
      "shippingCents": 0,
      "taxCents": 672,
      "totalCents": 9072,
      "itemCount": 1,
      "createdAt": "2026-10-12T13:52:10.123Z"
    }
    ```
  - **`400 Bad Request`:**
    ```json
    {
      "error": "No active session"
    }
    ```
    or
    ```json
    {
      "error": "Cart is empty"
    }
    ```
  - **`500 Internal Server Error`:**
    ```json
    {
      "error": "Checkout failed"
    }
    ```

---

### 2.9 Admin Login
**`POST /api/admin/login`**
- **Description:** Verifies password against `ADMIN_PASSWORD` using constant-time comparison (`timingSafeEqual`) and issues an HMAC-SHA256 signed `admin_session` cookie (valid 8 hours).
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "password": "example_admin_password"
  }
  ```
- **Responses:**
  - **`200 OK` (Authenticated):**
    - *Headers:* `Set-Cookie: admin_session=admin:1791850000.<hmac_sha256>; Path=/; Max-Age=28800; HttpOnly; SameSite=Lax`
    ```json
    {
      "ok": true
    }
    ```
  - **`401 Unauthorized`:**
    ```json
    {
      "error": "Invalid password"
    }
    ```

---

### 2.10 Admin Logout
**`POST /api/admin/logout`**
- **Description:** Revokes the administrator cookie by clearing the `admin_session` cookie.
- **Headers:** None.
- **Request Body:** None.
- **Responses:**
  - **`200 OK`:**
    - *Headers:* `Set-Cookie: admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
    ```json
    {
      "ok": true
    }
    ```
