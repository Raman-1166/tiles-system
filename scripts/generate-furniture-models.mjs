// One-off build script: procedurally models a small furniture catalogue and
// exports each as a compact, self-contained GLB file (no external textures),
// so the furniture product pages have real glTF models to view/orbit/AR.
// Run with: node scripts/generate-furniture-models.mjs
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import fs from "node:fs/promises";
import path from "node:path";

// GLTFExporter's binary path uses the browser FileReader API to turn the
// merged Blob into an ArrayBuffer. Provide a tiny Node polyfill.
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          if (this.onloadend) this.onloadend();
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err);
        });
    }
  };
}

const OUT_DIR = path.join(process.cwd(), "public", "models", "furniture");

function mat(color, { roughness = 0.6, metalness = 0.05 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMesh(group, geometry, material, name, position, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// Armchair: wooden frame (Frame) + upholstered seat/back/arms (Cushion)
// ---------------------------------------------------------------------------
function buildArmchair() {
  const root = new THREE.Group();
  root.name = "Armchair";
  const frameMat = mat("#6b4a33", { roughness: 0.75 });
  const cushionMat = mat("#c08a5c", { roughness: 0.9, metalness: 0 });

  // Legs
  const legGeo = new RoundedBoxGeometry(0.06, 0.32, 0.06, 2, 0.015);
  [
    [-0.32, 0.16, -0.28],
    [0.32, 0.16, -0.28],
    [-0.32, 0.16, 0.28],
    [0.32, 0.16, 0.28],
  ].forEach((p, i) => addMesh(root, legGeo, frameMat, `Frame_Leg_${i}`, p));

  // Seat cushion
  addMesh(
    root,
    new RoundedBoxGeometry(0.72, 0.16, 0.62, 3, 0.05),
    cushionMat,
    "Cushion_Seat",
    [0, 0.4, 0]
  );

  // Backrest
  addMesh(
    root,
    new RoundedBoxGeometry(0.72, 0.62, 0.14, 3, 0.05),
    cushionMat,
    "Cushion_Back",
    [0, 0.72, -0.26],
    [-0.08, 0, 0]
  );

  // Arms
  [-0.34, 0.34].forEach((x, i) =>
    addMesh(
      root,
      new RoundedBoxGeometry(0.1, 0.3, 0.6, 2, 0.04),
      frameMat,
      `Frame_Arm_${i}`,
      [x, 0.55, 0]
    )
  );

  root.scale.setScalar(1);
  return { root, dimensions: { width: 82, height: 95, depth: 80 } };
}

// ---------------------------------------------------------------------------
// Coffee table: wooden top (Frame) + metal legs (Accent)
// ---------------------------------------------------------------------------
function buildCoffeeTable() {
  const root = new THREE.Group();
  root.name = "CoffeeTable";
  const topMat = mat("#8a5a34", { roughness: 0.5 });
  const legMat = mat("#2b2b2b", { roughness: 0.35, metalness: 0.6 });

  addMesh(
    root,
    new RoundedBoxGeometry(1.1, 0.05, 0.6, 3, 0.02),
    topMat,
    "Frame_Top",
    [0, 0.4, 0]
  );

  const legGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.38, 16);
  [
    [-0.48, 0.2, -0.24],
    [0.48, 0.2, -0.24],
    [-0.48, 0.2, 0.24],
    [0.48, 0.2, 0.24],
  ].forEach((p, i) => addMesh(root, legGeo, legMat, `Accent_Leg_${i}`, p));

  return { root, dimensions: { width: 110, height: 42, depth: 60 } };
}

// ---------------------------------------------------------------------------
// Floor lamp: metal pole (Frame) + fabric shade (Cushion used as shade colour)
// ---------------------------------------------------------------------------
function buildFloorLamp() {
  const root = new THREE.Group();
  root.name = "FloorLamp";
  const poleMat = mat("#333333", { roughness: 0.4, metalness: 0.7 });
  const shadeMat = mat("#f2e4c9", { roughness: 0.8, metalness: 0 });

  addMesh(
    root,
    new THREE.CylinderGeometry(0.16, 0.18, 0.02, 32),
    poleMat,
    "Frame_Base",
    [0, 0.01, 0]
  );
  addMesh(
    root,
    new THREE.CylinderGeometry(0.015, 0.015, 1.3, 16),
    poleMat,
    "Frame_Pole",
    [0, 0.66, 0]
  );
  addMesh(
    root,
    new THREE.CylinderGeometry(0.22, 0.26, 0.32, 32, 1, true),
    shadeMat,
    "Cushion_Shade",
    [0, 1.42, 0]
  );

  return { root, dimensions: { width: 36, height: 148, depth: 36 } };
}

// ---------------------------------------------------------------------------
// Bookshelf: wooden carcass (Frame) + coloured back panel (Accent)
// ---------------------------------------------------------------------------
function buildBookshelf() {
  const root = new THREE.Group();
  root.name = "Bookshelf";
  const frameMat = mat("#5b3c28", { roughness: 0.7 });
  const accentMat = mat("#b85c38", { roughness: 0.85 });

  const sideGeo = new RoundedBoxGeometry(0.04, 1.6, 0.32, 2, 0.01);
  [-0.44, 0.44].forEach((x, i) => addMesh(root, sideGeo, frameMat, `Frame_Side_${i}`, [x, 0.8, 0]));

  const shelfGeo = new RoundedBoxGeometry(0.88, 0.03, 0.32, 2, 0.01);
  [0.04, 0.44, 0.84, 1.24, 1.56].forEach((y, i) =>
    addMesh(root, shelfGeo, frameMat, `Frame_Shelf_${i}`, [0, y, 0])
  );

  addMesh(
    root,
    new THREE.BoxGeometry(0.84, 1.56, 0.02),
    accentMat,
    "Accent_Back",
    [0, 0.8, -0.15]
  );

  return { root, dimensions: { width: 92, height: 164, depth: 34 } };
}

const CATALOGUE = {
  armchair: buildArmchair,
  "coffee-table": buildCoffeeTable,
  "floor-lamp": buildFloorLamp,
  bookshelf: buildBookshelf,
};

const exporter = new GLTFExporter();

function exportGLB(root) {
  return new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (result) => resolve(Buffer.from(result)),
      (err) => reject(err),
      { binary: true, forceIndices: true }
    );
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const manifest = {};
  for (const [slug, build] of Object.entries(CATALOGUE)) {
    const { root, dimensions } = build();
    const buffer = await exportGLB(root);
    const outPath = path.join(OUT_DIR, `${slug}.glb`);
    await fs.writeFile(outPath, buffer);
    manifest[slug] = { dimensions, sizeKb: Math.round(buffer.length / 1024) };
    console.log(`Exported ${slug}.glb (${manifest[slug].sizeKb} KB)`);
  }
  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
