import "dotenv/config";
import { getDb } from "@/db";
import {
  categories,
  products,
  productVariants,
  type NewCategory,
} from "@/db/schema";
import { sql, eq } from "drizzle-orm";

const categoriesData: NewCategory[] = [
  // Tiles
  { name: "Floor Tiles", slug: "floor-tiles", type: "tile", sortOrder: 1 },
  { name: "Wall Tiles", slug: "wall-tiles", type: "tile", sortOrder: 2 },
  { name: "Outdoor Tiles", slug: "outdoor-tiles", type: "tile", sortOrder: 3 },
  { name: "Mosaic Tiles", slug: "mosaic-tiles", type: "tile", sortOrder: 4 },
  { name: "Tile Accessories", slug: "tile-accessories", type: "tile", sortOrder: 5 },
  // Furniture
  { name: "Living Room", slug: "living-room", type: "furniture", sortOrder: 6 },
  { name: "Dining Room", slug: "dining-room", type: "furniture", sortOrder: 7 },
  { name: "Bedroom", slug: "bedroom", type: "furniture", sortOrder: 8 },
  { name: "Outdoor Furniture", slug: "outdoor-furniture", type: "furniture", sortOrder: 9 },
];

type ProductSeed = {
  slug: string;
  categorySlug: string;
  name: string;
  tagline: string;
  description: string;
  material: string;
  soldBy: "box" | "square_metre" | "piece";
  coveragePerBoxSqm?: string;
  priceCents: number;
  colorHex: string;
  images: string[];
  specs: Record<string, string>;
  textureSet?: { albedo: string; normal: string; roughness: string } | null;
  tileSizeCm?: number | null;
  visualizerColor?: string | null;
  pattern?: string | null;
  finish?: string | null;
  pricePerM2?: number | null;
  textureImage?: string | null;
  modelUrl?: string | null;
  arModelUrl?: string | null;
  dimensions?: { width: number; height: number; depth: number } | null;
  variants: Array<{
    sku: string;
    size?: string;
    colour?: string;
    finish?: string;
    priceCents: number;
    stockQuantity: number;
  }>;
  featured?: boolean;
  // New shop tile card fields
  gloss?: boolean;
  groutColor?: string | null;
  tileLayout?: string | null;
  tilesAcross?: number | null;
  tileType?: string | null;
  colourFamily?: string | null;
  sizeLabel?: string | null;
  showFromPrice?: boolean;
};

const productsData: ProductSeed[] = [
  // Floor Tiles
  {
    slug: "chalk-white-20",
    categorySlug: "floor-tiles",
    name: "Chalk White Gloss 20x20",
    tagline: "Bright, reflective glaze that bounces studio light around any room.",
    description:
      "Our best seller. A bright white porcelain body finished with a thick, glossy glaze that keeps its shine for decades. Rounded edges and a deep clay body mean it looks as good on the wall as it does underfoot.",
    material: "Glazed Porcelain",
    soldBy: "box",
    coveragePerBoxSqm: "1.2",
    priceCents: 4200,
    colorHex: "#f4f1ea",
    visualizerColor: "#f0eee8",
    pattern: "plain",
    finish: "gloss",
    pricePerM2: 3800,
    tileSizeCm: 20,
    gloss: true,
    groutColor: "#dedad2",
    tileLayout: "straight",
    tilesAcross: 3,
    tileType: "Gloss",
    colourFamily: "White",
    sizeLabel: "20×20",
    showFromPrice: true,
    images: ["https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800&q=80"],
    specs: {
      Size: "20cm x 20cm",
      Material: "Glazed porcelain",
      Finish: "Gloss clearcoat",
      Edge: "Rounded, rectified",
      "Tiles per box": "30",
      "Coverage per box": "1.2 sqm",
    },
    textureSet: null,
    variants: [
      { sku: "TILE-CW20-GLOSS", finish: "Gloss", priceCents: 4200, stockQuantity: 500 },
      { sku: "TILE-CW20-MATTE", finish: "Matte", priceCents: 4400, stockQuantity: 300 },
    ],
    featured: true,
  },
  {
    slug: "terracotta-warmth-20",
    categorySlug: "floor-tiles",
    name: "Terracotta Warmth 20x20",
    tagline: "Sun-baked clay tones with a glassy, hand-finished glaze.",
    description:
      "Inspired by reclaimed Mediterranean clay roofs, this glaze is poured thick over a warm red-brown body so every tile catches the light a little differently.",
    material: "Glazed Terracotta",
    soldBy: "box",
    coveragePerBoxSqm: "1.2",
    priceCents: 5600,
    colorHex: "#b5653a",
    visualizerColor: "#b8613b",
    pattern: "glaze",
    finish: "gloss",
    pricePerM2: 5200,
    tileSizeCm: 20,
    gloss: true,
    groutColor: "#c4a882",
    tileLayout: "herringbone",
    tilesAcross: 3,
    tileType: "Gloss",
    colourFamily: "Terracotta",
    sizeLabel: "20×20",
    showFromPrice: false,
    images: ["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80"],
    specs: {
      Size: "20cm x 20cm",
      Material: "Glazed terracotta",
      Finish: "Gloss",
      "Tiles per box": "30",
    },
    textureSet: null,
    variants: [{ sku: "TILE-TC20", priceCents: 5600, stockQuantity: 250 }],
    featured: true,
  },
  {
    slug: "charcoal-edge-30",
    categorySlug: "floor-tiles",
    name: "Charcoal Edge 30x30",
    tagline: "Deep, dramatic glaze with a glassy clearcoat finish.",
    description:
      "A large-format charcoal tile with a near-black glaze and a glassy clearcoat that throws sharp studio highlights. Dramatic on feature walls and shower niches.",
    material: "Glazed Porcelain",
    soldBy: "box",
    coveragePerBoxSqm: "1.8",
    priceCents: 6100,
    colorHex: "#2a2a28",
    visualizerColor: "#3d4043",
    pattern: "speck",
    finish: "gloss",
    pricePerM2: 4600,
    tileSizeCm: 30,
    gloss: true,
    groutColor: "#2a2826",
    tileLayout: "straight",
    tilesAcross: 2,
    tileType: "Gloss",
    colourFamily: "Charcoal",
    sizeLabel: "30×30",
    showFromPrice: false,
    images: ["https://images.unsplash.com/photo-1634104373136-22d0752d0743?w=800&q=80"],
    specs: {
      Size: "30cm x 30cm",
      Material: "Glazed porcelain",
      Finish: "Gloss clearcoat",
      "Tiles per box": "20",
    },
    textureSet: null,
    variants: [{ sku: "TILE-CH30", finish: "Gloss", priceCents: 6100, stockQuantity: 180 }],
    featured: true,
  },

  {
    slug: "sage-green-15",
    categorySlug: "wall-tiles",
    name: "Sage Green Gloss 15x15",
    tagline: "A soft, muted green glaze for calm kitchens and baths.",
    description:
      "A small-format tile with a soft sage glaze that reads differently in daylight versus lamp light. Pairs beautifully with brass fittings and warm timber.",
    material: "Glazed Porcelain",
    soldBy: "box",
    coveragePerBoxSqm: "0.9",
    priceCents: 5400,
    colorHex: "#8fa17e",
    visualizerColor: "#8ea592",
    pattern: "glaze",
    finish: "gloss",
    pricePerM2: 6400,
    tileSizeCm: 15,
    gloss: true,
    groutColor: "#b0b8a8",
    tileLayout: "straight",
    tilesAcross: 4,
    tileType: "Gloss",
    colourFamily: "Green",
    sizeLabel: "15×15",
    showFromPrice: false,
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],
    specs: {
      Size: "15cm x 15cm",
      Material: "Glazed porcelain",
      Finish: "Gloss",
      "Tiles per box": "40",
    },
    textureSet: null,
    variants: [{ sku: "TILE-SG15", priceCents: 5400, stockQuantity: 400 }],
    featured: true,
  },
  {
    slug: "ink-blue-20",
    categorySlug: "wall-tiles",
    name: "Ink Blue Gloss 20x20",
    tagline: "Rich cobalt glaze with real depth under light.",
    description:
      "A saturated cobalt blue glaze that pools slightly thicker at the rounded edges, giving every tile a one-of-a-kind depth of colour.",
    material: "Glazed Porcelain",
    soldBy: "box",
    coveragePerBoxSqm: "1.2",
    priceCents: 5900,
    colorHex: "#2c3e63",
    visualizerColor: "#20395c",
    pattern: "plain",
    finish: "gloss",
    pricePerM2: 5400,
    tileSizeCm: 20,
    gloss: true,
    groutColor: "#1a2840",
    tileLayout: "straight",
    tilesAcross: 3,
    tileType: "Gloss",
    colourFamily: "Blue",
    sizeLabel: "20×20",
    showFromPrice: false,
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"],
    specs: {
      Size: "20cm x 20cm",
      Material: "Glazed porcelain",
      Finish: "Gloss",
      "Tiles per box": "30",
    },
    textureSet: null,
    variants: [{ sku: "TILE-IB20", priceCents: 5900, stockQuantity: 350 }],
    featured: true,
  },
  {
    slug: "warm-ivory-25",
    categorySlug: "wall-tiles",
    name: "Warm Ivory Gloss 25x25",
    tagline: "A buttery, warm neutral that still throws a glassy highlight.",
    description:
      "Sits between white and beige, this warm ivory glaze is a favourite for large floor areas that need to stay bright without feeling clinical.",
    material: "Glazed Porcelain",
    soldBy: "box",
    coveragePerBoxSqm: "1.5",
    priceCents: 4600,
    colorHex: "#e8ddc2",
    visualizerColor: "#cdb99b",
    pattern: "speck",
    finish: "matte",
    pricePerM2: 4100,
    tileSizeCm: 25,
    gloss: false,
    groutColor: "#c8bfaa",
    tileLayout: "straight",
    tilesAcross: 2,
    tileType: "Matte",
    colourFamily: "Beige",
    sizeLabel: "25×25",
    showFromPrice: false,
    images: ["https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80"],
    specs: {
      Size: "25cm x 25cm",
      Material: "Glazed porcelain",
      Finish: "Gloss",
      "Tiles per box": "24",
    },
    textureSet: null,
    variants: [{ sku: "TILE-WI25", priceCents: 4600, stockQuantity: 450 }],
    featured: true,
  },
  {
    slug: "slate-grey-outdoor-60",
    categorySlug: "outdoor-tiles",
    name: "Slate Grey Outdoor 60x60",
    tagline: "Non-slip outdoor porcelain for patios and pool decks.",
    description:
      "Large-format outdoor tile with textured anti-slip surface. Frost-resistant and fade-proof for all weather conditions.",
    material: "Porcelain Stoneware",
    soldBy: "box",
    coveragePerBoxSqm: "1.8",
    priceCents: 7800,
    colorHex: "#6b7280",
    visualizerColor: "#6b7280",
    pattern: "speck",
    finish: "matte",
    pricePerM2: 4800,
    tileSizeCm: 60,
    gloss: false,
    groutColor: "#52555c",
    tileLayout: "straight",
    tilesAcross: 2,
    tileType: "Natural",
    colourFamily: "Grey",
    sizeLabel: "60×60",
    showFromPrice: false,
    images: ["https://images.pexels.com/photos/1122865/pexels-photo-1122865.jpeg"],
    specs: {
      Size: "60cm x 60cm",
      Material: "Porcelain stoneware",
      Finish: "Anti-slip textured",
      "R rating": "R11",
      "Tiles per box": "5",
    },
    variants: [{ sku: "TILE-SG60-OUT", priceCents: 7800, stockQuantity: 120 }],
    featured: false,
  },
  {
    slug: "marble-hex-mosaic",
    categorySlug: "mosaic-tiles",
    name: "Carrara Marble Hexagon Mosaic",
    tagline: "Classic hexagonal marble mosaic for feature walls.",
    description:
      "Natural Carrara marble cut into 5cm hexagons and mounted on mesh backing for easy installation. Perfect for bathroom feature walls.",
    material: "Natural Marble",
    soldBy: "box",
    coveragePerBoxSqm: "0.5",
    priceCents: 12900,
    colorHex: "#f5f5f5",
    visualizerColor: "#f5f4f0",
    pattern: "marble",
    finish: "gloss",
    pricePerM2: 27800,
    tileSizeCm: 5,
    gloss: true,
    groutColor: "#e8e4dc",
    tileLayout: "straight",
    tilesAcross: 5,
    tileType: "Mosaic",
    colourFamily: "White",
    sizeLabel: "5×5 hex",
    showFromPrice: false,
    images: ["https://images.pexels.com/photos/6969866/pexels-photo-6969866.jpeg"],
    specs: {
      Size: "5cm hexagons on 30x30cm sheets",
      Material: "Carrara marble",
      Finish: "Polished",
      "Sheets per box": "10",
    },
    variants: [{ sku: "MOS-CARR-HEX", priceCents: 12900, stockQuantity: 80 }],
    featured: false,
  },
  {
    slug: "glass-subway-mosaic",
    categorySlug: "mosaic-tiles",
    name: "Glass Subway Mosaic Mix",
    tagline: "Iridescent glass mosaic in mixed neutral tones.",
    description:
      "Hand-poured glass tiles in subtle cream and grey tones with an iridescent finish. Mounted on mesh for easy installation.",
    material: "Glass",
    soldBy: "box",
    coveragePerBoxSqm: "0.45",
    priceCents: 14500,
    colorHex: "#e5e4e0",
    visualizerColor: "#e5e3df",
    pattern: "glaze",
    finish: "gloss",
    pricePerM2: 34000,
    tileSizeCm: 3,
    gloss: true,
    groutColor: "#d8d4cc",
    tileLayout: "straight",
    tilesAcross: 4,
    tileType: "Mosaic",
    colourFamily: "Grey",
    sizeLabel: "2.5×5",
    showFromPrice: false,
    images: ["https://images.pexels.com/photos/6045273/pexels-photo-6045273.jpeg"],
    specs: {
      Size: "2.5cm x 5cm on 30x30cm sheets",
      Material: "Iridescent glass",
      Finish: "Glossy",
      "Sheets per box": "11",
    },
    variants: [{ sku: "MOS-GLASS-SUB", priceCents: 14500, stockQuantity: 60 }],
    featured: false,
  },

  // Tile Accessories
  {
    slug: "premium-tile-adhesive",
    categorySlug: "tile-accessories",
    name: "Premium Tile Adhesive",
    tagline: "Professional-grade adhesive for floor and wall tiles.",
    description:
      "Flexible, rapid-setting tile adhesive suitable for all tile types. Excellent adhesion on concrete, cement, and plasterboard. Coverage: 3-5 sqm per bag depending on trowel size.",
    material: "Cement-based adhesive",
    soldBy: "piece",
    priceCents: 3200,
    colorHex: "#9ca3af",
    images: ["https://images.pexels.com/photos/8961186/pexels-photo-8961186.jpeg"],
    specs: {
      Weight: "20kg bag",
      Coverage: "3-5 sqm per bag",
      "Setting time": "Rapid set - 3 hours",
      "Suitable for": "Internal and external use",
    },
    variants: [
      { sku: "ACC-ADH-20KG", size: "20kg", priceCents: 3200, stockQuantity: 150 },
      { sku: "ACC-ADH-10KG", size: "10kg", priceCents: 1800, stockQuantity: 200 },
    ],
    featured: false,
  },
  {
    slug: "epoxy-tile-grout",
    categorySlug: "tile-accessories",
    name: "Epoxy Tile Grout",
    tagline: "Stain-resistant epoxy grout in 12 colours.",
    description:
      "Two-part epoxy grout that's waterproof, stain-resistant and never needs sealing. Ideal for kitchens, bathrooms and high-traffic areas. Available in 12 colours.",
    material: "Epoxy resin grout",
    soldBy: "piece",
    priceCents: 5900,
    colorHex: "#ffffff",
    images: ["https://images.pexels.com/photos/6419120/pexels-photo-6419120.jpeg"],
    specs: {
      Weight: "5kg kit",
      Coverage: "Approx 10-15 sqm (3mm joint)",
      "Cure time": "24 hours",
      Colours: "12 colours available",
    },
    variants: [
      { sku: "ACC-GROUT-WHT", colour: "White", priceCents: 5900, stockQuantity: 100 },
      { sku: "ACC-GROUT-GRY", colour: "Light Grey", priceCents: 5900, stockQuantity: 80 },
      { sku: "ACC-GROUT-BLK", colour: "Black", priceCents: 5900, stockQuantity: 60 },
    ],
    featured: false,
  },
  {
    slug: "tile-leveling-spacers",
    categorySlug: "tile-accessories",
    name: "Tile Leveling System Spacers",
    tagline: "Professional leveling clips and wedges for perfect tile installation.",
    description:
      "Reusable tile leveling system prevents tile lippage and ensures a flat surface. Includes 100 clips, 100 wedges and installation pliers. Suitable for tiles 3-16mm thick.",
    material: "High-strength plastic",
    soldBy: "piece",
    priceCents: 4200,
    colorHex: "#ef4444",
    images: ["https://images.pexels.com/photos/5691621/pexels-photo-5691621.jpeg"],
    specs: {
      Contents: "100 clips + 100 wedges + pliers",
      "Tile thickness": "3-16mm",
      "Joint width": "1.5-3mm",
      Reusable: "Clips single-use, wedges reusable",
    },
    variants: [{ sku: "ACC-LEVEL-KIT", priceCents: 4200, stockQuantity: 75 }],
    featured: false,
  },

  // Living Room Furniture
  {
    slug: "harbor-armchair",
    categorySlug: "living-room",
    name: "Harbor Armchair",
    tagline: "A deep, upholstered armchair on a solid wood frame.",
    description:
      "Generously padded and built on a solid timber frame, the Harbor Armchair is upholstered in a brushed cotton-blend fabric available in three colourways. Finished with turned wooden legs.",
    material: "Solid Oak Frame",
    soldBy: "piece",
    priceCents: 68900,
    colorHex: "#c08a5c",
    images: [
      "https://images.pexels.com/photos/13806257/pexels-photo-13806257.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/39351124/pexels-photo-39351124.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    specs: {
      Frame: "Solid oak",
      Seat: "High-resilience foam",
      Fabric: "Brushed cotton blend",
      Assembly: "Legs attach with 4 bolts",
    },
    modelUrl: "/models/furniture/armchair.glb",
    dimensions: { width: 82, height: 95, depth: 80 },
    variants: [
      { sku: "ARM-HARBOR-CLAY", colour: "Clay", priceCents: 68900, stockQuantity: 15 },
      { sku: "ARM-HARBOR-MOSS", colour: "Moss", priceCents: 68900, stockQuantity: 12 },
      { sku: "ARM-HARBOR-CHAR", colour: "Charcoal", priceCents: 68900, stockQuantity: 18 },
    ],
    featured: true,
  },
  {
    slug: "kiln-coffee-table",
    categorySlug: "living-room",
    name: "Kiln Coffee Table",
    tagline: "A low wooden table top on slim blackened steel legs.",
    description:
      "A solid wood tabletop, hand-finished and sealed, balanced on slim powder-coated steel legs. Available in three tabletop finishes.",
    material: "Solid Acacia Wood",
    soldBy: "piece",
    priceCents: 42900,
    colorHex: "#8a5a34",
    images: [
      "https://images.pexels.com/photos/1647662/pexels-photo-1647662.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/14784251/pexels-photo-14784251.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    specs: {
      Top: "Solid acacia wood",
      Legs: "Powder-coated steel",
      Assembly: "Legs attach with 4 bolts",
    },
    modelUrl: "/models/furniture/coffee-table.glb",
    dimensions: { width: 110, height: 42, depth: 60 },
    variants: [
      { sku: "TABLE-KILN-WALNUT", colour: "Walnut", priceCents: 42900, stockQuantity: 22 },
      { sku: "TABLE-KILN-ASH", colour: "Ash", priceCents: 44900, stockQuantity: 18 },
      { sku: "TABLE-KILN-EBONY", colour: "Ebony", priceCents: 46900, stockQuantity: 14 },
    ],
    featured: true,
  },
  {
    slug: "studio-floor-lamp",
    categorySlug: "living-room",
    name: "Studio Floor Lamp",
    tagline: "A slim blackened-steel floor lamp with a linen drum shade.",
    description:
      "A slim steel pole on a weighted base, topped with a linen drum shade that casts a soft, even glow. Three shade colours available.",
    material: "Blackened Steel",
    soldBy: "piece",
    priceCents: 21900,
    colorHex: "#f2e4c9",
    images: [
      "https://images.pexels.com/photos/26546549/pexels-photo-26546549.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/7722151/pexels-photo-7722151.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    specs: {
      Pole: "Blackened steel",
      Shade: "Linen blend",
      Bulb: "E26, not included",
      Switch: "In-line foot switch",
    },
    modelUrl: "/models/furniture/floor-lamp.glb",
    dimensions: { width: 36, height: 148, depth: 36 },
    variants: [
      { sku: "LAMP-STUDIO-NAT", colour: "Natural Linen", priceCents: 21900, stockQuantity: 35 },
      { sku: "LAMP-STUDIO-GREY", colour: "Soft Grey", priceCents: 21900, stockQuantity: 28 },
      { sku: "LAMP-STUDIO-TERRA", colour: "Terracotta", priceCents: 23900, stockQuantity: 20 },
    ],
    featured: true,
  },

  // Dining Room Furniture
  {
    slug: "atelier-bookshelf",
    categorySlug: "dining-room",
    name: "Atelier Bookshelf",
    tagline: "A tall open bookshelf with a coloured back panel.",
    description:
      "Five fixed shelves on a solid timber carcass with a painted MDF back panel that adds a hit of colour to any reading nook.",
    material: "Solid Pine",
    soldBy: "piece",
    priceCents: 54900,
    colorHex: "#b85c38",
    images: [
      "https://images.pexels.com/photos/7587290/pexels-photo-7587290.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/7060813/pexels-photo-7060813.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    specs: {
      Carcass: "Solid pine",
      Back_panel: "Painted MDF",
      Shelves: "5 fixed shelves",
      Assembly: "Flat-pack, 2 person assembly recommended",
    },
    modelUrl: "/models/furniture/bookshelf.glb",
    dimensions: { width: 92, height: 164, depth: 34 },
    variants: [
      { sku: "BOOK-ATEL-TERRA", colour: "Terracotta Back", priceCents: 54900, stockQuantity: 10 },
      { sku: "BOOK-ATEL-INK", colour: "Ink Back", priceCents: 54900, stockQuantity: 8 },
      { sku: "BOOK-ATEL-SAGE", colour: "Sage Back", priceCents: 54900, stockQuantity: 12 },
    ],
    featured: true,
  },
  {
    slug: "oak-dining-table",
    categorySlug: "dining-room",
    name: "Solid Oak Dining Table",
    tagline: "A timeless six-seater dining table in solid oak.",
    description:
      "Crafted from sustainably sourced European oak with a natural oil finish. Seats six comfortably with room for place settings and centerpieces.",
    material: "Solid European Oak",
    soldBy: "piece",
    priceCents: 129900,
    colorHex: "#b5904d",
    images: ["https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg"],
    specs: {
      Material: "Solid European oak",
      Finish: "Natural oil",
      Seating: "6 people",
      Assembly: "Legs attach with bolts",
    },
    dimensions: { width: 180, height: 75, depth: 90 },
    variants: [
      { sku: "TABLE-OAK-180", size: "180cm", priceCents: 129900, stockQuantity: 6 },
      { sku: "TABLE-OAK-220", size: "220cm", priceCents: 159900, stockQuantity: 4 },
    ],
    featured: false,
  },

  // Bedroom Furniture
  {
    slug: "linen-upholstered-bed",
    categorySlug: "bedroom",
    name: "Linen Upholstered Bed Frame",
    tagline: "A soft, upholstered bed frame in natural linen.",
    description:
      "Deep button-tufted headboard upholstered in natural linen with a solid wood frame. Available in Queen and King sizes.",
    material: "Linen & Solid Wood",
    soldBy: "piece",
    priceCents: 89900,
    colorHex: "#e8dcc8",
    images: ["https://images.pexels.com/photos/6312380/pexels-photo-6312380.jpeg"],
    specs: {
      Frame: "Solid pine",
      Upholstery: "Natural linen",
      Headboard: "Button-tufted",
      "Mattress support": "Slat system included",
    },
    dimensions: { width: 168, height: 120, depth: 215 },
    variants: [
      { sku: "BED-LINEN-Q", size: "Queen", priceCents: 89900, stockQuantity: 8 },
      { sku: "BED-LINEN-K", size: "King", priceCents: 99900, stockQuantity: 5 },
    ],
    featured: false,
  },

  // Outdoor Furniture
  {
    slug: "teak-outdoor-bench",
    categorySlug: "outdoor-furniture",
    name: "Weathered Teak Garden Bench",
    tagline: "A classic two-seater garden bench in solid teak.",
    description:
      "Solid teak construction that weathers beautifully to a silvery patina. No treatment required. Seats two adults comfortably.",
    material: "Solid Teak",
    soldBy: "piece",
    priceCents: 67900,
    colorHex: "#a67c52",
    images: ["https://images.pexels.com/photos/2255441/pexels-photo-2255441.jpeg"],
    specs: {
      Material: "Solid teak",
      Finish: "Natural, weathers to grey",
      Seating: "2 people",
      Weather_resistance: "Fully weatherproof",
    },
    dimensions: { width: 120, height: 90, depth: 60 },
    variants: [{ sku: "BENCH-TEAK-2S", priceCents: 67900, stockQuantity: 14 }],
    featured: false,
  },
];

async function main() {
  console.log("🌱 Starting seed...\n");

  const { db, pool } = getDb();

  // 1. Seed categories
  console.log("📁 Seeding categories...");
  const categoryMap = new Map<string, number>();

  for (const cat of categoriesData) {
    // MySQL: Insert or update on duplicate key
    await db
      .insert(categories)
      .values(cat)
      .onDuplicateKeyUpdate({
        set: {
          name: cat.name,
          type: cat.type,
          sortOrder: cat.sortOrder,
          updatedAt: new Date(),
        },
      });

    // Get the ID by querying after insert
    const [inserted] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, cat.slug))
      .limit(1);

    categoryMap.set(cat.slug, inserted.id);
    console.log(`  ✓ ${cat.name} (${cat.slug})`);
  }

  console.log(`\n✅ ${categoriesData.length} categories seeded\n`);

  // 2. Seed products and variants
  console.log("🛍️  Seeding products and variants...");

  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) {
      console.warn(`  ⚠️  Category ${prod.categorySlug} not found, skipping ${prod.name}`);
      continue;
    }

    // Insert/update product
    await db
      .insert(products)
      .values({
        categoryId,
        slug: prod.slug,
        name: prod.name,
        tagline: prod.tagline,
        description: prod.description,
        material: prod.material,
        soldBy: prod.soldBy,
        coveragePerBoxSqm: prod.coveragePerBoxSqm || null,
        priceCents: prod.priceCents,
        colorHex: prod.colorHex,
        unit: prod.soldBy === "box" ? "per box" : prod.soldBy === "square_metre" ? "per sqm" : "each",
        images: prod.images,
        specs: prod.specs,
        textureSet: prod.textureSet || null,
        tileSizeCm: prod.tileSizeCm || null,
        visualizerColor: prod.visualizerColor || null,
        pattern: prod.pattern || null,
        finish: prod.finish || null,
        pricePerM2: prod.pricePerM2 || null,
        textureImage: prod.textureImage || null,
        gloss: prod.gloss ?? false,
        groutColor: prod.groutColor || null,
        tileLayout: prod.tileLayout || null,
        tilesAcross: prod.tilesAcross || null,
        tileType: prod.tileType || null,
        colourFamily: prod.colourFamily || null,
        sizeLabel: prod.sizeLabel || null,
        showFromPrice: prod.showFromPrice ?? false,
        modelUrl: prod.modelUrl || null,
        arModelUrl: prod.arModelUrl || null,
        dimensions: prod.dimensions || null,
        variants: [], // Legacy field
        featured: prod.featured || false,
        isActive: true,
        updatedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          categoryId,
          name: prod.name,
          tagline: prod.tagline,
          description: prod.description,
          material: prod.material,
          priceCents: prod.priceCents,
          images: prod.images && prod.images.length > 0 ? prod.images : ["/images/placeholder.svg"],
          textureSet: prod.textureSet || null,
          colorHex: prod.colorHex,
          specs: prod.specs,
          tileSizeCm: prod.tileSizeCm || null,
          visualizerColor: prod.visualizerColor || null,
          pattern: prod.pattern || null,
          finish: prod.finish || null,
          pricePerM2: prod.pricePerM2 || null,
          textureImage: prod.textureImage || null,
          gloss: prod.gloss ?? false,
          groutColor: prod.groutColor || null,
          tileLayout: prod.tileLayout || null,
          tilesAcross: prod.tilesAcross || null,
          tileType: prod.tileType || null,
          colourFamily: prod.colourFamily || null,
          sizeLabel: prod.sizeLabel || null,
          showFromPrice: prod.showFromPrice ?? false,
          modelUrl: prod.modelUrl || null,
          arModelUrl: prod.arModelUrl || null,
          dimensions: prod.dimensions || null,
          featured: prod.featured || false,
          unit: prod.soldBy === "box" ? "per box" : prod.soldBy === "square_metre" ? "per sqm" : "each",
          soldBy: prod.soldBy,
          coveragePerBoxSqm: prod.coveragePerBoxSqm || null,
          updatedAt: new Date(),
        },
      });

    // Get the product ID
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, prod.slug))
      .limit(1);

    console.log(`  ✓ ${prod.name}`);

    // Insert/update variants
    for (const variant of prod.variants) {
      await db
        .insert(productVariants)
        .values({
          productId: product.id,
          sku: variant.sku,
          size: variant.size || null,
          colour: variant.colour || null,
          finish: variant.finish || null,
          priceCents: variant.priceCents,
          stockQuantity: variant.stockQuantity,
          lowStockThreshold: 10,
          updatedAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: {
            priceCents: variant.priceCents,
            stockQuantity: variant.stockQuantity,
            updatedAt: new Date(),
          },
        });
      console.log(`    → ${variant.sku} (stock: ${variant.stockQuantity})`);
    }
  }

  console.log(`\n✅ ${productsData.length} products seeded with variants\n`);

  // 3. Summary
  const [categoriesCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
  const [variantsCount] = await db.select({ count: sql<number>`count(*)` }).from(productVariants);

  console.log("📊 Database summary:");
  console.log(`   Categories: ${Number(categoriesCount.count)}`);
  console.log(`   Products: ${Number(productsCount.count)}`);
  console.log(`   Variants: ${Number(variantsCount.count)}`);

  await pool.end();
  console.log("\n✨ Seed complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
