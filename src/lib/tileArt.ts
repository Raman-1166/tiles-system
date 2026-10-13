/**
 * tileArt.ts — procedural tile image generation
 * Ported from docs/reference/shop-tiles.html
 * Pure canvas/2D — no three.js, no DOM at module scope.
 */

// ── types ──────────────────────────────────────────────────────────────────
export type TilePattern = "plain" | "speck" | "marble" | "glaze" | "wood";
export type TileLayout  = "straight" | "herringbone";

export interface TileSpec {
  color:       string;       // hex, e.g. "#f0eee8"
  pattern:     TilePattern;
  gloss:       boolean;
  groutColor:  string;       // hex, e.g. "#c8c0b0"
  layout:      TileLayout;
  tilesAcross: number;       // tiles visible across the image width (2–5)
}

// ── rng ────────────────────────────────────────────────────────────────────
/** Deterministic PRNG; returns a function that yields floats in [0, 1). */
export function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── paint ──────────────────────────────────────────────────────────────────
/**
 * Paint one tile face onto `ctx` at the current transform origin.
 * The tile occupies [0,0]→[w,h] in local coords.
 */
export function paint(
  ctx:    CanvasRenderingContext2D,
  w:      number,
  h:      number,
  spec:   TileSpec,
  rand:   () => number,
): void {
  // Base fill
  ctx.fillStyle = spec.color;
  ctx.fillRect(0, 0, w, h);

  // Brightness variation ±8 %
  const v = (rand() - 0.5) * 0.16;
  ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v.toFixed(3)})` : `rgba(0,0,0,${(-v).toFixed(3)})`;
  ctx.fillRect(0, 0, w, h);

  // Pattern overlays
  if (spec.pattern === "marble") {
    ctx.strokeStyle = "rgba(95,100,110,.38)";
    for (let i = 0; i < 3; i++) {
      ctx.lineWidth = 0.6 + rand() * 1.4;
      ctx.beginPath();
      let x = rand() * w;
      ctx.moveTo(x, 0);
      for (let k = 1; k <= 5; k++) {
        x += (rand() - 0.5) * w * 0.5;
        ctx.quadraticCurveTo(
          x + (rand() - 0.5) * w * 0.3,
          (k - 0.5) * (h / 5),
          x,
          k * (h / 5),
        );
      }
      ctx.stroke();
    }
  }

  if (spec.pattern === "speck") {
    const n = Math.floor((w * h) / 50);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = rand() < 0.5 ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.18)";
      ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
    }
  }

  if (spec.pattern === "glaze") {
    const grd = ctx.createRadialGradient(
      rand() * w, rand() * h, 0,
      w / 2, h / 2, Math.max(w, h),
    );
    grd.addColorStop(0, "rgba(255,255,255,.22)");
    grd.addColorStop(1, "rgba(0,0,0,.20)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }

  if (spec.pattern === "wood") {
    ctx.save();
    if (h > w) {
      ctx.translate(w, 0);
      ctx.rotate(Math.PI / 2);
      [w, h] = [h, w];
    }
    ctx.strokeStyle = "rgba(55,32,14,.26)";
    for (let i = 0; i < 12; i++) {
      const y = rand() * h;
      ctx.lineWidth = 0.5 + rand() * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        w * 0.3, y + (rand() - 0.5) * 8,
        w * 0.65, y + (rand() - 0.5) * 8,
        w,        y + (rand() - 0.5) * 5,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  // Gloss highlight — thin diagonal sheen
  if (spec.gloss) {
    const grd = ctx.createLinearGradient(0, 0, w * 0.6, h * 0.6);
    grd.addColorStop(0,    "rgba(255,255,255,.14)");
    grd.addColorStop(0.45, "rgba(255,255,255,.04)");
    grd.addColorStop(1,    "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }
}

// ── surf ───────────────────────────────────────────────────────────────────
/**
 * Draw a full tiled surface onto `canvas`.
 * @param canvas  must already be sized (set width/height before calling)
 * @param spec    tile spec
 * @param seed    integer seed for determinism
 */
export function surf(
  canvas: HTMLCanvasElement,
  spec:   TileSpec,
  seed:   number,
): void {
  const W   = canvas.width;
  const H   = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rand = rng(seed);

  // Number of full+partial tiles across the shorter dimension
  const n   = spec.tilesAcross;
  const tpx = W / n;               // tile size in pixels (square tiles)
  const gw  = Math.max(2, tpx * 0.035); // grout width

  // Grout background
  ctx.fillStyle = spec.groutColor;
  ctx.fillRect(0, 0, W, H);

  const drawTile = (tx: number, ty: number) => {
    const inset = gw / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(tx + inset, ty + inset, tpx - gw, tpx - gw);
    ctx.clip();
    ctx.translate(tx, ty);
    paint(ctx, tpx - gw, tpx - gw, spec, rand);
    ctx.restore();
  };

  if (spec.layout === "herringbone") {
    // 1:2 plank herringbone at 45°
    const pw  = tpx;
    const ph  = tpx / 2;
    const diag = Math.hypot(W, H) * 1.5;
    const num  = Math.ceil(diag / pw) + 4;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.PI / 4);
    ctx.translate(-diag / 2, -diag / 2);

    for (let row = -4; row < num; row++) {
      for (let col = -4; col < num; col++) {
        // Horizontal plank
        ctx.save();
        ctx.translate(col * pw * 2, row * pw + 0);
        ctx.beginPath();
        ctx.rect(gw / 2, gw / 2, pw * 2 - gw, ph - gw);
        ctx.clip();
        ctx.translate(0, 0);
        ctx.fillStyle = spec.groutColor;
        ctx.fillRect(-2, -2, pw * 2 + 4, ph + 4);
        paint(ctx, pw * 2 - gw, ph - gw, spec, rand);
        ctx.restore();

        // Vertical plank (rotated 90°)
        ctx.save();
        ctx.translate(col * pw * 2 + pw, row * pw + ph);
        ctx.beginPath();
        ctx.rect(gw / 2, gw / 2, ph - gw, pw * 2 - gw);
        ctx.clip();
        ctx.fillStyle = spec.groutColor;
        ctx.fillRect(-2, -2, ph + 4, pw * 2 + 4);
        paint(ctx, ph - gw, pw * 2 - gw, spec, rand);
        ctx.restore();
      }
    }
    ctx.restore();
  } else {
    // Straight grid
    const colsNeeded = Math.ceil(W / tpx) + 1;
    const rowsNeeded = Math.ceil(H / tpx) + 1;
    for (let row = 0; row < rowsNeeded; row++) {
      for (let col = 0; col < colsNeeded; col++) {
        drawTile(col * tpx, row * tpx);
      }
    }
  }
}

// ── light ──────────────────────────────────────────────────────────────────
/**
 * Apply a directional light-and-shadow vignette over the surface.
 * Simulates overhead-left studio lighting.
 */
export function light(
  ctx:   CanvasRenderingContext2D,
  W:     number,
  H:     number,
  gloss: boolean,
): void {
  // Soft vignette
  const vig = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, W * 0.72);
  vig.addColorStop(0,   "rgba(0,0,0,0)");
  vig.addColorStop(1,   "rgba(0,0,0,.22)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Top-left highlight
  const hi = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.55);
  hi.addColorStop(0,   "rgba(255,255,255,.15)");
  hi.addColorStop(0.5, "rgba(255,255,255,.03)");
  hi.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  ctx.fillRect(0, 0, W, H);

  // Gloss specular flash
  if (gloss) {
    const sp = ctx.createRadialGradient(W * 0.28, H * 0.22, 0, W * 0.28, H * 0.22, W * 0.38);
    sp.addColorStop(0,   "rgba(255,255,255,.32)");
    sp.addColorStop(0.4, "rgba(255,255,255,.06)");
    sp.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.fillStyle = sp;
    ctx.fillRect(0, 0, W, H);
  }
}

// ── shot ───────────────────────────────────────────────────────────────────
/**
 * Render a 480×480 product shot onto `canvas`.
 * Safe to call in useEffect (needs real HTMLCanvasElement).
 *
 * @param canvas   480×480 canvas element
 * @param spec     tile spec
 * @param seed     integer seed (use product index or id)
 */
export function shot(
  canvas: HTMLCanvasElement,
  spec:   TileSpec,
  seed:   number,
): void {
  const S   = 480;
  canvas.width  = S;
  canvas.height = S;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Draw tiled surface
  surf(canvas, spec, seed);

  // 2. Lighting pass
  light(ctx, S, S, spec.gloss);
}

// ── deriveSpec ─────────────────────────────────────────────────────────────
/**
 * Derive a TileSpec from partial product data, filling in sensible defaults
 * when fields are missing (for legacy rows in the DB).
 * Logs a console warning once per product if defaults are applied.
 */
export function deriveSpec(product: {
  name:            string;
  visualizerColor?: string | null;
  pattern?:        string | null;
  finish?:         string | null;
  groutColor?:     string | null;
  tileLayout?:     string | null;
  tilesAcross?:    number | null;
}): TileSpec {
  const missing: string[] = [];

  let color = product.visualizerColor ?? null;
  if (!color) {
    missing.push("visualizerColor");
    const n = product.name.toLowerCase();
    if      (n.includes("chalk") || n.includes("white"))      color = "#f0eee8";
    else if (n.includes("charcoal") || n.includes("edge"))    color = "#3d4043";
    else if (n.includes("terracotta"))                         color = "#b8613b";
    else if (n.includes("sage"))                               color = "#8ea592";
    else if (n.includes("ink") || n.includes("blue"))         color = "#20395c";
    else if (n.includes("ivory") || n.includes("warm"))       color = "#cdb99b";
    else if (n.includes("slate") || n.includes("grey"))       color = "#6b7280";
    else if (n.includes("marble") || n.includes("carrara"))   color = "#f5f4f0";
    else if (n.includes("glass") || n.includes("mosaic"))     color = "#e5e3df";
    else                                                        color = "#c8c4bc";
  }

  let pattern: TilePattern = "plain";
  if (product.pattern && ["plain","speck","marble","glaze","wood"].includes(product.pattern)) {
    pattern = product.pattern as TilePattern;
  } else {
    missing.push("pattern");
    const n = product.name.toLowerCase();
    if      (n.includes("marble") || n.includes("carrara")) pattern = "marble";
    else if (n.includes("speck"))                            pattern = "speck";
    else if (n.includes("glaze") || n.includes("terracotta")) pattern = "glaze";
    else if (n.includes("wood") || n.includes("teak"))       pattern = "wood";
    else if (n.includes("charcoal") || n.includes("slate"))  pattern = "speck";
    else if (n.includes("glass"))                             pattern = "glaze";
  }

  const gloss = product.finish === "gloss" || product.finish === "Gloss";

  const groutColor = product.groutColor ?? "#c8c0b0";

  let layout: TileLayout = "straight";
  if (product.tileLayout === "herringbone") layout = "herringbone";

  const tilesAcross = product.tilesAcross ?? 3;

  if (missing.length > 0) {
    console.warn(
      `[tileArt] Product "${product.name}" missing fields: ${missing.join(", ")}. Using defaults.`
    );
  }

  return { color, pattern, gloss, groutColor, layout, tilesAcross };
}
