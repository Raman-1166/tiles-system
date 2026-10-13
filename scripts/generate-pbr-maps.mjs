// One-off build script: derives normal + roughness maps from the generated
// albedo photos using a Sobel height-to-normal conversion, then downsizes
// everything to web-friendly dimensions. Run with `node scripts/generate-pbr-maps.mjs`.
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SIZE = 1024;
const TILE_DIR = path.join(process.cwd(), "public", "textures", "tiles");

async function processTile(dir) {
  const albedoPath = path.join(TILE_DIR, dir, "albedo.jpg");
  const exists = await fs
    .access(albedoPath)
    .then(() => true)
    .catch(() => false);
  if (!exists) return;

  // 1. Resize + re-save albedo as an optimized, tileable-friendly jpg.
  const albedoResized = sharp(albedoPath).resize(SIZE, SIZE).jpeg({ quality: 86 });
  await albedoResized.toFile(path.join(TILE_DIR, dir, "albedo-web.jpg"));

  // 2. Build a grayscale height buffer.
  const { data, info } = await sharp(albedoPath)
    .resize(SIZE, SIZE)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const height = (x, y) => {
    const cx = Math.min(w - 1, Math.max(0, x));
    const cy = Math.min(h - 1, Math.max(0, y));
    return data[cy * w + cx] / 255;
  };

  // 3. Sobel operator -> tangent-space normal map.
  const normalBuf = Buffer.alloc(w * h * 3);
  const strength = 2.2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = height(x - 1, y - 1);
      const t = height(x, y - 1);
      const tr = height(x + 1, y - 1);
      const l = height(x - 1, y);
      const r = height(x + 1, y);
      const bl = height(x - 1, y + 1);
      const b = height(x, y + 1);
      const br = height(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * w + x) * 3;
      normalBuf[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalBuf[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalBuf[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    }
  }

  await sharp(normalBuf, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality: 90 })
    .toFile(path.join(TILE_DIR, dir, "normal.jpg"));

  // 4. Roughness: glossy glaze overall (low roughness) with micro variation
  // sourced from the inverted luminance so highlights read as glossier.
  const roughBuf = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) {
    const lum = data[i] / 255;
    const variation = 1 - lum; // darker glaze flecks -> slightly rougher
    const roughness = 0.12 + variation * 0.22;
    roughBuf[i] = Math.round(roughness * 255);
  }
  await sharp(roughBuf, { raw: { width: w, height: h, channels: 1 } })
    .jpeg({ quality: 90 })
    .toFile(path.join(TILE_DIR, dir, "roughness.jpg"));

  console.log(`Generated PBR maps for ${dir}`);
}

async function main() {
  const dirs = await fs.readdir(TILE_DIR);
  for (const dir of dirs) {
    await processTile(dir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
