import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
  timestamp,
  boolean,
  decimal,
  index,
} from "drizzle-orm/mysql-core";

// -----------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    parentId: int("parent_id"),
    type: varchar("type", { length: 50 }).notNull(), // "tile" | "furniture"
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    slugIdx: index("categories_slug_idx").on(table.slug),
  })
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// -----------------------------------------------------------------------
// Products: both ceramic tiles and furniture live in one table so the shop,
// cart and visualizer can all query a single source of truth. Category
// specific data lives in loosely typed json columns (see docs below).
// -----------------------------------------------------------------------
export const products = mysqlTable(
  "products",
  {
    id: int("id").primaryKey().autoincrement(),
    categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 500 }).notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    material: varchar("material", { length: 255 }),
    soldBy: varchar("sold_by", { length: 50 }).notNull().default("piece"), // "box" | "square_metre" | "piece"
    coveragePerBoxSqm: decimal("coverage_per_box_sqm", { precision: 10, scale: 4 }),
    // Base price in cents (used if no variants, or as reference price)
    priceCents: int("price_cents").notNull(),
    // Legacy fields for backwards compatibility - will be replaced by variants
    colorHex: varchar("color_hex", { length: 20 }).notNull().default("#cccccc"),
    unit: varchar("unit", { length: 50 }).notNull().default("each"), // "per tile" | "per sqm" | "each"
    images: json("images").$type<string[]>().notNull(),
    specs: json("specs").$type<Record<string, string>>().notNull(),
    // Tile PBR texture set (relative public/ paths) - only used for tiles
    textureSet: json("texture_set")
      .$type<{ albedo: string; normal: string; roughness: string } | null>(),
    tileSizeCm: int("tile_size_cm"),
    // Visualizer-specific fields for procedural tile generation
    visualizerColor: varchar("visualizer_color", { length: 20 }), // hex color for procedural texture
    pattern: varchar("pattern", { length: 50 }), // "plain" | "speck" | "marble" | "glaze" | "wood"
    finish: varchar("finish", { length: 50 }), // "gloss" | "matte" (maps to roughness)
    pricePerM2: int("price_per_m2"), // price per square meter in cents
    textureImage: text("texture_image"), // optional: URL to use as texture instead of procedural
    // Shop tile card display fields
    gloss: boolean("gloss").notNull().default(false),            // true = Gloss finish tag
    groutColor: varchar("grout_color", { length: 20 }),          // hex grout colour for shot()
    tileLayout: varchar("tile_layout", { length: 20 }),          // "straight" | "herringbone"
    tilesAcross: int("tiles_across"),                            // tiles shown across card image
    tileType: varchar("tile_type", { length: 30 }),              // "Gloss" | "Matte" | "Natural" | "Mosaic"
    colourFamily: varchar("colour_family", { length: 30 }),      // "White" | "Beige" | "Grey" | "Charcoal" | "Blue" | "Green" | "Terracotta" | "Wood"
    sizeLabel: varchar("size_label", { length: 30 }),            // e.g. "20×20"
    showFromPrice: boolean("show_from_price").notNull().default(false), // show "from" prefix
    // 3D models
    modelUrl: text("model_url"), // GLB model for furniture or detailed tile preview
    arModelUrl: text("ar_model_url"), // iOS Quick Look compatible USDZ
    // Furniture dimensions in centimeters
    dimensions: json("dimensions")
      .$type<{ width: number; height: number; depth: number } | null>(),
    // Old variants field - kept for backwards compatibility, will migrate to product_variants
    variants: json("variants")
      .$type<{ name: string; colorHex: string; targetMesh: string }[]>().notNull(),
    featured: boolean("featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    slugIdx: index("products_slug_idx").on(table.slug),
    categoryIdx: index("products_category_idx").on(table.categoryId),
  })
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductWithDetails = Omit<Product, "variants"> & {
  category: Category | null;
  productVariants: ProductVariant[];
};

// -----------------------------------------------------------------------
// Product Variants (SKU-level inventory)
// -----------------------------------------------------------------------
export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int("id").primaryKey().autoincrement(),
    productId: int("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    size: varchar("size", { length: 100 }),
    colour: varchar("colour", { length: 100 }),
    finish: varchar("finish", { length: 100 }),
    priceCents: int("price_cents").notNull(),
    salePriceCents: int("sale_price_cents"),
    stockQuantity: int("stock_quantity").notNull().default(0),
    lowStockThreshold: int("low_stock_threshold").notNull().default(10),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    skuIdx: index("product_variants_sku_idx").on(table.sku),
    productIdx: index("product_variants_product_idx").on(table.productId),
  })
);

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

// -----------------------------------------------------------------------
// Product Images
// -----------------------------------------------------------------------
export const productImages = mysqlTable(
  "product_images",
  {
    id: int("id").primaryKey().autoincrement(),
    productId: int("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: int("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: text("alt_text").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("product_images_product_idx").on(table.productId),
    variantIdx: index("product_images_variant_idx").on(table.variantId),
  })
);

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

// -----------------------------------------------------------------------
// Customers
// -----------------------------------------------------------------------
export const customers = mysqlTable(
  "customers",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    passwordHash: text("password_hash"), // for future auth implementation
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    emailIdx: index("customers_email_idx").on(table.email),
  })
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// -----------------------------------------------------------------------
// Addresses
// -----------------------------------------------------------------------
export const addresses = mysqlTable(
  "addresses",
  {
    id: int("id").primaryKey().autoincrement(),
    customerId: int("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    line1: varchar("line1", { length: 500 }).notNull(),
    line2: varchar("line2", { length: 500 }),
    city: varchar("city", { length: 255 }).notNull(),
    region: varchar("region", { length: 255 }).notNull(), // state/province
    postalCode: varchar("postal_code", { length: 50 }).notNull(),
    country: varchar("country", { length: 100 }).notNull().default("US"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    customerIdx: index("addresses_customer_idx").on(table.customerId),
  })
);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

// -----------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").primaryKey().autoincrement(),
    orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
    customerId: int("customer_id").references(() => customers.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, packed, shipped, delivered, cancelled, refunded
    subtotalCents: int("subtotal_cents").notNull(),
    shippingCents: int("shipping_cents").notNull().default(0),
    taxCents: int("tax_cents").notNull().default(0),
    totalCents: int("total_cents").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    shippingAddress: json("shipping_address")
      .$type<{
        name: string;
        line1: string;
        line2?: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
      }>()
      .notNull(),
    stripeSessionId: varchar("stripe_session_id", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    orderNumberIdx: index("orders_order_number_idx").on(table.orderNumber),
    emailIdx: index("orders_email_idx").on(table.email),
    customerIdx: index("orders_customer_idx").on(table.customerId),
    statusIdx: index("orders_status_idx").on(table.status),
  })
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

// -----------------------------------------------------------------------
// Order Items
// -----------------------------------------------------------------------
export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").primaryKey().autoincrement(),
    orderId: int("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: int("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    // Snapshot fields to preserve order details even if product is deleted
    name: varchar("name", { length: 500 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    unitPriceCents: int("unit_price_cents").notNull(),
    quantity: int("quantity").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId),
  })
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// -----------------------------------------------------------------------
// Payments
// -----------------------------------------------------------------------
export const payments = mysqlTable(
  "payments",
  {
    id: int("id").primaryKey().autoincrement(),
    orderId: int("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 100 }).notNull().default("stripe"), // stripe, paypal, etc
    providerPaymentId: varchar("provider_payment_id", { length: 500 }).notNull(),
    amountCents: int("amount_cents").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, succeeded, failed, refunded
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index("payments_order_idx").on(table.orderId),
    providerIdx: index("payments_provider_payment_idx").on(table.providerPaymentId),
  })
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// -----------------------------------------------------------------------
// Cart: a lightweight, cookie-session based cart. No auth required.
// -----------------------------------------------------------------------
export const cartItems = mysqlTable("cart_items", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  productId: int("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: int("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull().default(1),
  variant: varchar("variant", { length: 255 }), // legacy field
  // Extra context e.g. room visualizer selections (layout, grout colour, area).
  meta: json("meta").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
