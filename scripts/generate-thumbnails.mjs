import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const OUTPUT_DIR = path.resolve(process.cwd(), "public/images/products");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateTileSvg({
  name,
  color,
  groutColor = "#dedad2",
  layout = "straight",
  gloss = true,
}) {
  const bg = groutColor || "#d8d3c5";
  const tileFill = color || "#e4ded4";

  if (layout === "herringbone") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="tileGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${gloss ? "0.35" : "0.08"}" />
      <stop offset="100%" stop-color="#000000" stop-opacity="${gloss ? "0.15" : "0.05"}" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="600" height="600" fill="${bg}" />
  <!-- Herringbone angled patterns -->
  <g filter="url(#shadow)">
    <rect x="60" y="40" width="120" height="240" rx="4" fill="${tileFill}" transform="rotate(45 120 160)" />
    <rect x="60" y="40" width="120" height="240" rx="4" fill="url(#tileGlow)" transform="rotate(45 120 160)" />
    
    <rect x="230" y="40" width="120" height="240" rx="4" fill="${tileFill}" transform="rotate(-45 290 160)" />
    <rect x="230" y="40" width="120" height="240" rx="4" fill="url(#tileGlow)" transform="rotate(-45 290 160)" />

    <rect x="60" y="320" width="120" height="240" rx="4" fill="${tileFill}" transform="rotate(-45 120 440)" />
    <rect x="60" y="320" width="120" height="240" rx="4" fill="url(#tileGlow)" transform="rotate(-45 120 440)" />

    <rect x="230" y="320" width="120" height="240" rx="4" fill="${tileFill}" transform="rotate(45 290 440)" />
    <rect x="230" y="320" width="120" height="240" rx="4" fill="url(#tileGlow)" transform="rotate(45 290 440)" />

    <rect x="400" y="180" width="120" height="240" rx="4" fill="${tileFill}" transform="rotate(45 460 300)" />
    <rect x="400" y="180" width="120" height="240" rx="4" fill="url(#tileGlow)" transform="rotate(45 460 300)" />
  </g>
  <!-- Subtle specular gloss sweep -->
  ${gloss ? '<rect x="0" y="0" width="600" height="600" fill="url(#tileGlow)" opacity="0.4" pointer-events="none" />' : ""}
</svg>`;
  }

  // Straight 3x3 Grid
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="tileGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${gloss ? "0.38" : "0.1"}" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="${gloss ? "0.18" : "0.06"}" />
    </linearGradient>
    <filter id="tileBevel" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="600" height="600" fill="${bg}" />
  <g filter="url(#tileBevel)">
    <!-- Row 1 -->
    <rect x="24" y="24" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="24" y="24" width="168" height="168" rx="6" fill="url(#tileGlow)" />
    <rect x="216" y="24" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="216" y="24" width="168" height="168" rx="6" fill="url(#tileGlow)" />
    <rect x="408" y="24" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="408" y="24" width="168" height="168" rx="6" fill="url(#tileGlow)" />

    <!-- Row 2 -->
    <rect x="24" y="216" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="24" y="216" width="168" height="168" rx="6" fill="url(#tileGlow)" />
    <rect x="216" y="216" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="216" y="216" width="168" height="168" rx="6" fill="url(#tileGlow)" />
    <rect x="408" y="216" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="408" y="216" width="168" height="168" rx="6" fill="url(#tileGlow)" />

    <!-- Row 3 -->
    <rect x="24" y="408" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="24" y="408" width="168" height="168" rx="6" fill="url(#tileGlow)" />
    <rect x="216" y="408" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="216" y="408" width="168" height="168" rx="6" fill="url(#tileGlow)" />
    <rect x="408" y="408" width="168" height="168" rx="6" fill="${tileFill}" />
    <rect x="408" y="408" width="168" height="168" rx="6" fill="url(#tileGlow)" />
  </g>
</svg>`;
}

function generateFurnitureSvg({ name, colorHex = "#8b5a2b" }) {
  const woodColor = colorHex || "#8b5a2b";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f2ea" />
      <stop offset="100%" stop-color="#e8e2d4" />
    </linearGradient>
    <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="0.8">
      <stop offset="0%" stop-color="#a47148" />
      <stop offset="50%" stop-color="${woodColor}" />
      <stop offset="100%" stop-color="#5c3818" />
    </linearGradient>
    <filter id="furnitureShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feOffset dx="0" dy="24"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Architectural Studio Background -->
  <rect width="600" height="600" fill="url(#bgGrad)" />
  <circle cx="300" cy="460" r="180" fill="#000000" opacity="0.08" />

  <!-- Furniture Silhouette (Handcrafted Table / Bench / Credenza) -->
  <g filter="url(#furnitureShadow)">
    <!-- Tabletop / Seat Slab -->
    <rect x="120" y="270" width="360" height="34" rx="6" fill="url(#woodGrad)" />
    <!-- Bevel highlight -->
    <rect x="120" y="270" width="360" height="4" rx="2" fill="#ffffff" opacity="0.35" />

    <!-- Left Leg -->
    <rect x="160" y="304" width="28" height="160" rx="4" fill="url(#woodGrad)" />
    <!-- Right Leg -->
    <rect x="412" y="304" width="28" height="160" rx="4" fill="url(#woodGrad)" />

    <!-- Crossbeam Stretcher -->
    <rect x="188" y="380" width="224" height="16" rx="2" fill="#4a2d13" />

    <!-- Sculptural Ceramic Accent Bowl on Top -->
    <ellipse cx="300" cy="254" rx="44" ry="14" fill="#faf7f0" stroke="#dcd6c8" stroke-width="2" />
    <path d="M256,254 C256,274 344,274 344,254 Z" fill="#faf7f0" />
  </g>
</svg>`;
}

async function main() {
  console.log("🎨 Starting catalog thumbnail generation...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not found in environment.");
    process.exit(1);
  }

  const connection = await mysql.createConnection(dbUrl);
  const [products] = await connection.execute(
    "SELECT id, slug, name, visualizer_color, pattern, grout_color, tile_layout, gloss, color_hex, category_id FROM products"
  );

  console.log(`Found ${products.length} products to generate static thumbnails for.`);

  for (const product of products) {
    const isFurniture =
      product.slug.includes("bench") ||
      product.slug.includes("chair") ||
      product.slug.includes("table") ||
      product.slug.includes("credenza");

    let svgContent = "";

    if (isFurniture) {
      svgContent = generateFurnitureSvg({
        name: product.name,
        colorHex: product.color_hex,
      });
    } else {
      svgContent = generateTileSvg({
        name: product.name,
        color: product.visualizer_color || product.color_hex,
        groutColor: product.grout_color,
        layout: product.tile_layout,
        gloss: Boolean(product.gloss),
      });
    }

    const filePath = path.join(OUTPUT_DIR, `${product.slug}.svg`);
    fs.writeFileSync(filePath, svgContent, "utf8");

    // Update DB with local relative image path
    const localImagePath = `/images/products/${product.slug}.svg`;
    await connection.execute("UPDATE products SET images = ? WHERE id = ?", [
      JSON.stringify([localImagePath]),
      product.id,
    ]);

    console.log(`  ✓ Generated ${product.slug}.svg -> ${localImagePath}`);
  }

  await connection.end();
  console.log("✨ All product thumbnails successfully generated and self-hosted!");
}

main().catch((err) => {
  console.error("Error generating thumbnails:", err);
  process.exit(1);
});
