import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

function maskPassword(url) {
  return url.replace(/:([^@]+)@/, ':*****@');
}

async function runStep(stepNum, title, fn) {
  console.log(`\n${BLUE}═══ STEP ${stepNum}: ${title} ═══${RESET}`);
  try {
    await fn();
    console.log(`${GREEN}✓ PASSED${RESET}`);
    return { step: stepNum, title, status: 'PASSED', error: null };
  } catch (error) {
    const maskedError = error.message.replace(/:([^@]+)@/, ':*****@');
    console.error(`${RED}✗ FAILED: ${maskedError}${RESET}`);
    return { step: stepNum, title, status: 'FAILED', error: maskedError };
  }
}

async function main() {
  const results = [];
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error(`${RED}ERROR: DATABASE_URL not found in .env${RESET}`);
    process.exit(1);
  }

  console.log(`${YELLOW}Database URL: ${maskPassword(dbUrl)}${RESET}`);

  // Step 1: Test Connection
  results.push(await runStep(1, 'Test MySQL Connection', async () => {
    const connection = await mysql.createConnection(dbUrl);
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`MySQL Version: ${rows[0].version}`);
    
    if (rows[0].version.toLowerCase().includes('mariadb')) {
      console.log(`${YELLOW}⚠️  WARNING: This is MariaDB, not MySQL${RESET}`);
    }
    
    await connection.end();
  }));

  // Step 2: Check Database Exists
  results.push(await runStep(2, 'Verify Database Exists', async () => {
    const connectionWithoutDb = dbUrl.replace(/\/[^\/]*$/, '');
    const dbName = dbUrl.split('/').pop().split('?')[0];
    
    const connection = await mysql.createConnection(connectionWithoutDb);
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );
    
    if (rows.length === 0) {
      throw new Error(`Database ${dbName} does not exist. Run: CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }
    
    console.log(`Database '${dbName}' exists`);
    await connection.end();
  }));

  // Step 3: Check Tables Exist
  results.push(await runStep(3, 'Check Migrated Tables', async () => {
    const connection = await mysql.createConnection(dbUrl);
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      throw new Error('No tables found. Run: npm run db:migrate');
    }
    
    console.log(`Found ${tables.length} tables`);
    const requiredTables = ['products', 'categories', 'product_variants', 'cart_items'];
    
    const tableNames = tables.map(t => Object.values(t)[0]);
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        throw new Error(`Required table '${table}' not found`);
      }
    }
    
    console.log('All required tables exist');
    await connection.end();
  }));

  // Step 4: Check Data
  results.push(await runStep(4, 'Verify Seeded Data', async () => {
    const connection = await mysql.createConnection(dbUrl);
    
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [variantCount] = await connection.execute('SELECT COUNT(*) as count FROM product_variants');
    
    console.log(`Products: ${productCount[0].count}`);
    console.log(`Variants: ${variantCount[0].count}`);
    
    if (productCount[0].count === 0) {
      throw new Error('No products found. Run: npm run db:seed');
    }
    
    // Check products per category
    const [categoryData] = await connection.execute(`
      SELECT c.name, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON p.category_id = c.id 
      GROUP BY c.name 
      ORDER BY c.name
    `);
    
    console.log('\nProducts per category:');
    for (const row of categoryData) {
      console.log(`  ${row.name}: ${row.product_count} products`);
    }
    
    await connection.end();
  }));

  // Step 5: Test Cart
  results.push(await runStep(5, 'Test Cart Functionality', async () => {
    const connection = await mysql.createConnection(dbUrl);
    
    const [cartItems] = await connection.execute('SELECT COUNT(*) as count FROM cart_items');
    console.log(`Cart items in database: ${cartItems[0].count}`);
    
    await connection.end();
    console.log('Cart table is accessible');
  }));

  // Print Summary
  console.log(`\n${BLUE}═══════════════════════════════════════${RESET}`);
  console.log(`${BLUE}VERIFICATION SUMMARY${RESET}`);
  console.log(`${BLUE}═══════════════════════════════════════${RESET}\n`);
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  results.forEach(r => {
    const symbol = r.status === 'PASSED' ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${symbol} Step ${r.step}: ${r.title}`);
    if (r.error) {
      console.log(`  Error: ${r.error}`);
    }
  });
  
  console.log(`\n${passed}/${results.length} steps passed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, maskPassword(error.message));
  process.exit(1);
});
