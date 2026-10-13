/**
 * Procedural tile texture generation with canvas drawing
 * Ported from room-visualizer.html prototype
 */

// Simple pseudo-random number generator for consistent patterns
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TilePattern = "plain" | "marble" | "speck" | "glaze" | "wood";

export interface TileDefinition {
  name: string;
  color: string; // hex color
  pattern: TilePattern;
  variation: number; // 0-1, brightness variation amount
  roughness: number; // 0-1, PBR roughness
  pricePerSqm: number;
}

/**
 * Paint a single tile onto a canvas context with pattern
 */
export function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tile: TileDefinition,
  random: () => number
) {
  // Base color fill
  ctx.fillStyle = tile.color;
  ctx.fillRect(0, 0, width, height);

  // Apply brightness variation
  const v = (random() - 0.5) * tile.variation * 2;
  ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
  ctx.fillRect(0, 0, width, height);

  const pattern = tile.pattern;

  // Marble veins
  if (pattern === "marble") {
    ctx.strokeStyle = "rgba(95,100,110,.4)";
    for (let i = 0; i < 3; i++) {
      ctx.lineWidth = 0.6 + random() * 1.4;
      ctx.beginPath();
      let x = random() * width;
      ctx.moveTo(x, 0);
      for (let k = 1; k <= 5; k++) {
        x += (random() - 0.5) * width * 0.5;
        ctx.quadraticCurveTo(
          x + (random() - 0.5) * width * 0.3,
          (k - 0.5) * (height / 5),
          x,
          k * (height / 5)
        );
      }
      ctx.stroke();
    }
  }

  // Speckled texture
  if (pattern === "speck") {
    for (let i = 0; i < (width * height) / 50; i++) {
      ctx.fillStyle = random() < 0.5 ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.2)";
      ctx.fillRect(random() * width, random() * height, 1.6, 1.6);
    }
  }

  // Glazed gradient
  if (pattern === "glaze") {
    const gradient = ctx.createRadialGradient(
      random() * width,
      random() * height,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
    );
    gradient.addColorStop(0, "rgba(255,255,255,.25)");
    gradient.addColorStop(1, "rgba(0,0,0,.22)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Wood grain
  if (pattern === "wood") {
    ctx.save();
    // Rotate if tile is taller than wide (portrait orientation)
    if (height > width) {
      ctx.translate(width, 0);
      ctx.rotate(Math.PI / 2);
      [width, height] = [height, width];
    }
    ctx.strokeStyle = "rgba(55,32,14,.28)";
    for (let i = 0; i < 12; i++) {
      const y = random() * height;
      ctx.lineWidth = 0.5 + random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        width * 0.3,
        y + (random() - 0.5) * 8,
        width * 0.65,
        y + (random() - 0.5) * 8,
        width,
        y + (random() - 0.5) * 5
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}

export interface SurfaceConfig {
  tile: TileDefinition;
  tileSizeCm: number;
  groutColor: string;
  layout: "straight" | "brick" | "herringbone";
  seed: number; // For consistent randomization
}

/**
 * Draw a tiled surface onto a canvas (albedo or bump map)
 */
export function drawSurface(
  canvas: HTMLCanvasElement,
  widthM: number,
  heightM: number,
  config: SurfaceConfig,
  isBumpMap: boolean,
  pixelsPerMeter: number = 300
) {
  canvas.width = Math.round(widthM * pixelsPerMeter);
  canvas.height = Math.round(heightM * pixelsPerMeter);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const tileSizeM = config.tileSizeCm / 100;
  const tileSizePx = tileSizeM * pixelsPerMeter;
  const groutWidthPx = Math.max(2, tileSizePx * 0.04);

  const random = rng(config.seed);

  // Fill with grout color (or black for bump map)
  ctx.fillStyle = isBumpMap ? "#000" : config.groutColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper to paint a single tile at position
  const paintTile = (x: number, y: number, tileWidth: number, tileHeight: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.rect(groutWidthPx / 2, groutWidthPx / 2, tileWidth - groutWidthPx, tileHeight - groutWidthPx);
    ctx.clip();

    if (isBumpMap) {
      // White tile body, black grout creates recessed effect
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, tileWidth, tileHeight);
    } else {
      paint(ctx, tileWidth, tileHeight, config.tile, random);
    }

    ctx.restore();
  };

  // Layout rendering
  if (config.layout === "herringbone") {
    // Herringbone: 1:3 ratio planks at 45° angle
    const plankWidth = tileSizePx / 3;
    const diagonal = Math.hypot(canvas.width, canvas.height);
    const numPlanks = Math.ceil(diagonal / plankWidth);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 4);
    ctx.translate(-diagonal / 2, -diagonal / 2);

    for (let n = -4; n <= numPlanks; n++) {
      for (let k = Math.floor((-3 - n) / 6); k <= Math.ceil((numPlanks - n) / 6); k++) {
        // Horizontal plank
        paintTile((n + 6 * k) * plankWidth, n * plankWidth, 3 * plankWidth, plankWidth);
        // Vertical plank
        paintTile((n + 6 * k) * plankWidth, (n + 1) * plankWidth, plankWidth, 3 * plankWidth);
      }
    }

    ctx.restore();
  } else {
    // Straight or brick bond
    for (let y = 0, row = 0; y < canvas.height; y += tileSizePx, row++) {
      const offsetX = config.layout === "brick" && row % 2 === 1 ? -tileSizePx / 2 : 0;
      for (let x = offsetX; x < canvas.width; x += tileSizePx) {
        paintTile(x, y, tileSizePx, tileSizePx);
      }
    }
  }
}
