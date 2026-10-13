# Quick Start - Database Setup

Run these commands in order:

```powershell
# 1. Create database (in MySQL)
mysql -uroot -p
CREATE DATABASE IF NOT EXISTS app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 2. Install and migrate
npm install
npm run db:migrate

# 3. Seed database (twice to test)
npm run db:seed
npm run db:seed

# 4. Verify automatically
node verify-database.mjs

# 5. Start dev server
npm run dev
```

Then test in browser:
- http://localhost:3000/api/health
- http://localhost:3000/shop

Full instructions: See `DATABASE_SETUP.md`
