# MySQL Database Setup and Verification Guide

This guide walks you through setting up and verifying the MySQL database for this project.

## Prerequisites

- MySQL 8.x installed and running
- Node.js and npm installed
- The `.env` file is configured with your DATABASE_URL

## Current Configuration

```
DATABASE_URL=mysql://root:*****@localhost:3306/app_db
```

---

## Step-by-Step Verification

### STEP 1: Create Database (if needed)

Connect to MySQL and create the database:

```powershell
mysql -uroot -p
```

Then run:

```sql
CREATE DATABASE IF NOT EXISTS app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### STEP 2: Install Dependencies

```powershell
npm install
```

### STEP 3: Run Migrations

```powershell
npm run db:migrate
```

**Expected output:**

```
10 tables
addresses 11 columns 1 indexes 1 fks
cart_items 8 columns 0 indexes 2 fks
categories 8 columns 1 indexes 0 fks
... (and so on)
[✓] Your SQL migration file ➜ drizzle/0000_fearless_abomination.sql 🚀
```

If you get an error, check:

- MySQL is running
- The database `app_db` exists
- Your `.env` DATABASE_URL is correct

### STEP 4: Seed the Database

Run the seed script **twice** to verify it doesn't create duplicates:

```powershell
npm run db:seed
```

**Expected output (first run):**

```
🌱 Starting seed...

📁 Seeding categories...
  ✓ Floor Tiles (floor-tiles)
  ✓ Wall Tiles (wall-tiles)
  ... (9 categories)

✅ 9 categories seeded

🛍️  Seeding products and variants...
  ✓ Chalk White Gloss 20x20
    → TILE-CW20-GLOSS (stock: 500)
    → TILE-CW20-MATTE (stock: 300)
  ... (19 products, 43 variants)

✅ 19 products seeded with variants

📊 Database summary:
   Categories: 9
   Products: 19
   Variants: 43

✨ Seed complete!
```

Run it again:

```powershell
npm run db:seed
```

**Expected:** Same output, no errors, counts should remain the same (19 products, 43 variants).

### STEP 5: Verify Data with SQL

Connect to MySQL and run these queries:

```powershell
mysql -uroot -p app_db
```

```sql
-- Count products
SELECT COUNT(*) FROM products;
-- Expected: 19

-- Count variants
SELECT COUNT(*) FROM product_variants;
-- Expected: 43

-- Products per category
SELECT c.name, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name
ORDER BY c.name;
-- Expected: All categories with at least 1 product
-- Tile Accessories should have 3 products

-- Products with variant counts
SELECT p.name, COUNT(v.id) as variant_count
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id
GROUP BY p.name
ORDER BY p.name;
-- Expected: All 19 products listed with their variant counts

EXIT;
```

### STEP 6: Run Automated Verification

Run the verification script:

```powershell
npm run db:verify
```

This script tests:

1. MySQL connection
2. Database exists
3. Tables are created
4. Data is seeded
5. Cart table is accessible

### STEP 7: Start Development Server

```powershell
npm run dev
```

Open your browser and test:

1. **Health Check:** http://localhost:3000/api/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Shop Page:** http://localhost:3000/shop
   - Should display product grid with 19 products
   - Filter and sort should work

3. **Product Page:** http://localhost:3000/shop/tile/chalk-white-20
   - Should show product details, variants, and tile calculator

4. **Furniture Page:** http://localhost:3000/shop/furniture/harbor-armchair
   - Should show product details with colour variants

### STEP 8: Test Cart (Browser)

1. Go to a product page: http://localhost:3000/shop/tile/chalk-white-20
2. Select a variant (e.g., "Matte")
3. Set quantity to 2
4. Click "Add to Cart"
5. Check the database:

```sql
SELECT * FROM cart_items;
```

Expected: One row with your session_id, product_id, variant_id, quantity=2

### STEP 9: Test Cart (API)

Using PowerShell or curl:

```powershell
# Add item to cart
$body = @{
    sessionId = "test-session-123"
    productId = 1
    variantId = 1
    quantity = 2
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/cart" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

# Get cart
Invoke-WebRequest -Uri "http://localhost:3000/api/cart?sessionId=test-session-123"
```

Check database again:

```sql
SELECT * FROM cart_items WHERE session_id = 'test-session-123';
```

### STEP 10: Build Verification

```powershell
npm run typecheck
npm run lint
npm run build
```

All three should pass with no errors.

---

## Troubleshooting

### "Access denied for user 'root'"

- Check your password in `.env`
- Ensure MySQL is running

### "Unknown database 'app_db'"

- Run the CREATE DATABASE command from Step 1

### "No tables found"

- Run `npm run db:migrate`

### "No products found"

- Run `npm run db:seed`

### Images not loading

- The seed now uses Unsplash placeholder images
- They require internet connection

---

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `.env` is not tracked by git
- [ ] No passwords in any committed files
- [ ] Database URL uses localhost (not exposed)

Check with:

```powershell
# Verify .env is in .gitignore
Get-Content .gitignore | Select-String ".env"

# Verify .env is not tracked
git status .env
# Should say: "No commits yet" or "Untracked"
```

---

## Success Criteria

✅ MySQL 8.x running  
✅ Database `app_db` created  
✅ 10 tables migrated  
✅ 9 categories seeded  
✅ 19 products seeded  
✅ 43 variants seeded  
✅ Cart table working  
✅ `/api/health` returns 200  
✅ `/shop` lists products  
✅ Product pages load  
✅ Cart persists items  
✅ Build passes

---

**Next Step:** Once verification passes, the database is ready for development!
