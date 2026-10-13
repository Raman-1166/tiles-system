import * as THREE from "three";

// ── Types ──────────────────────────────────────────────────────────────────
export type FurnitureModelType =
  | "sofa"
  | "chair"
  | "stool"
  | "arm"
  | "dining"
  | "coffee"
  | "side"
  | "shelf"
  | "bed"
  | "lamp";

export interface FurnitureColourOption {
  name: string;
  hex: string;
}

export interface FurnitureMeta {
  modelType: FurnitureModelType;
  optionKind: "Fabric" | "Finish";
  colourOptions: FurnitureColourOption[];
  defaultColour: string;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Palettes ───────────────────────────────────────────────────────────────
export const REFERENCE_FABRICS: FurnitureColourOption[] = [
  { name: "Clay", hex: "#c08a5c" },
  { name: "Moss", hex: "#5e6b54" },
  { name: "Charcoal", hex: "#383635" },
  { name: "Natural Linen", hex: "#e8ded2" },
  { name: "Terracotta", hex: "#b35c3b" },
  { name: "Soft Grey", hex: "#9e9e9e" },
];

export const REFERENCE_FINISHES: FurnitureColourOption[] = [
  { name: "Walnut", hex: "#6e472a" },
  { name: "Natural Oak", hex: "#c8aa7a" },
  { name: "Ash", hex: "#d5c6aa" },
  { name: "Ebony", hex: "#2b2725" },
  { name: "Terracotta Back", hex: "#b85c38" },
  { name: "Weathered Teak", hex: "#a67c52" },
];

const WOOD_DEFAULT = "#523722";
const METAL_DEFAULT = "#262626";

// Warning tracker to warn only once per product
const warnedProducts = new Set<string>();

export interface FurnitureProductInput {
  id?: number | string;
  slug?: string;
  name?: string;
  category?: { name?: string; slug?: string } | null;
  categorySlug?: string;
  dimensions?: { width?: number; depth?: number; height?: number } | null;
}

// ── Meta Derivation ────────────────────────────────────────────────────────
export function getFurnitureMeta(product?: FurnitureProductInput | null): FurnitureMeta {
  const prodKey = product?.slug || product?.id || product?.name || "unknown";
  const name = String(product?.name || "").toLowerCase();
  const categoryName = String(
    product?.category?.name || product?.categorySlug || product?.category?.slug || ""
  ).toLowerCase();

  if (!warnedProducts.has(prodKey)) {
    if (!product?.name || (!product?.category && !product?.categorySlug)) {
      console.warn(`[furniture3d] Incomplete metadata for product: "${prodKey}"`);
    }
    warnedProducts.add(prodKey);
  }

  // Derive modelType per rules:
  // Sofas -> sofa
  // Chairs -> chair (name has "stool" -> stool, "arm" or "lounge" -> arm)
  // Tables -> dining ("coffee" -> coffee)
  // Storage -> side ("book" or "shelf" -> shelf)
  // Beds -> bed
  // Lighting -> lamp
  let modelType: FurnitureModelType = "chair";

  if (categoryName.includes("sofa") || name.includes("sofa") || name.includes("couch")) {
    modelType = "sofa";
  } else if (categoryName.includes("bed") || name.includes("bed")) {
    modelType = "bed";
  } else if (
    categoryName.includes("light") ||
    categoryName.includes("lamp") ||
    name.includes("lamp") ||
    name.includes("light")
  ) {
    modelType = "lamp";
  } else if (
    categoryName.includes("table") ||
    name.includes("table") ||
    name.includes("desk")
  ) {
    if (name.includes("coffee")) {
      modelType = "coffee";
    } else {
      modelType = "dining";
    }
  } else if (
    categoryName.includes("storage") ||
    name.includes("shelf") ||
    name.includes("book") ||
    name.includes("cabinet") ||
    name.includes("cupboard")
  ) {
    if (name.includes("book") || name.includes("shelf")) {
      modelType = "shelf";
    } else {
      modelType = "side";
    }
  } else if (
    categoryName.includes("chair") ||
    categoryName.includes("seating") ||
    name.includes("chair") ||
    name.includes("bench") ||
    name.includes("stool")
  ) {
    if (name.includes("stool")) {
      modelType = "stool";
    } else if (name.includes("arm") || name.includes("lounge")) {
      modelType = "arm";
    } else {
      modelType = "chair";
    }
  } else if (categoryName.includes("living-room")) {
    if (name.includes("armchair") || name.includes("chair")) modelType = "arm";
    else if (name.includes("coffee")) modelType = "coffee";
    else if (name.includes("lamp")) modelType = "lamp";
    else modelType = "sofa";
  } else if (categoryName.includes("dining-room")) {
    if (name.includes("book") || name.includes("shelf")) modelType = "shelf";
    else if (name.includes("table")) modelType = "dining";
    else modelType = "chair";
  } else if (categoryName.includes("outdoor")) {
    if (name.includes("bench") || name.includes("chair")) modelType = "chair";
    else modelType = "dining";
  }

  // optionKind is Finish for Tables and Storage, otherwise Fabric
  const isFinish =
    modelType === "dining" ||
    modelType === "coffee" ||
    modelType === "side" ||
    modelType === "shelf";
  const optionKind: "Fabric" | "Finish" = isFinish ? "Finish" : "Fabric";

  // Derive colour options
  const colourOptions: FurnitureColourOption[] = [];
  const rawVariants = Array.isArray(product?.variants)
    ? product.variants
    : Array.isArray(product?.productVariants)
    ? product.productVariants
    : [];

  const seenColours = new Set<string>();

  for (const v of rawVariants) {
    const rawColour = v.colour || v.color || v.name;
    if (rawColour && typeof rawColour === "string" && !seenColours.has(rawColour.toLowerCase())) {
      seenColours.add(rawColour.toLowerCase());
      // Check if reference palette has exact match or matching name
      const palette = optionKind === "Finish" ? REFERENCE_FINISHES : REFERENCE_FABRICS;
      const matched = palette.find(
        (p) =>
          p.name.toLowerCase() === rawColour.toLowerCase() ||
          rawColour.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(rawColour.toLowerCase())
      );

      const hex =
        v.colorHex ||
        matched?.hex ||
        (rawColour.startsWith("#") ? rawColour : null);

      if (hex) {
        colourOptions.push({ name: rawColour, hex });
      }
    }
  }

  // If no variants with colours found, use reference palette
  if (colourOptions.length === 0) {
    const palette = optionKind === "Finish" ? REFERENCE_FINISHES : REFERENCE_FABRICS;
    palette.slice(0, 4).forEach((p) => colourOptions.push({ ...p }));
  }

  // Default colour from product or first option
  const defaultColour =
    product?.colorHex && product.colorHex.startsWith("#")
      ? product.colorHex
      : colourOptions[0]?.hex || (isFinish ? "#6e472a" : "#c08a5c");

  return {
    modelType,
    optionKind,
    colourOptions,
    defaultColour,
  };
}

// ── Three.js Helpers ───────────────────────────────────────────────────────
function matStandard(
  color: string,
  options: { roughness?: number; metalness?: number } = {}
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.7,
    metalness: options.metalness ?? 0.05,
  });
}

function addMesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position?: [number, number, number],
  rotation?: [number, number, number]
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

// ── Procedural F Models ────────────────────────────────────────────────────
export const F: Record<FurnitureModelType, (colour: string) => THREE.Group> = {
  // 1. Sofa
  sofa: (colour: string) => {
    const root = new THREE.Group();
    root.name = "Sofa";
    const primaryMat = matStandard(colour, { roughness: 0.85, metalness: 0.02 });
    const woodMat = matStandard(WOOD_DEFAULT, { roughness: 0.7 });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.018, 0.14, 16);
    [
      [-0.88, 0.07, -0.38],
      [0.88, 0.07, -0.38],
      [-0.88, 0.07, 0.38],
      [0.88, 0.07, 0.38],
    ].forEach((pos) => addMesh(root, legGeo, woodMat, pos as [number, number, number]));

    // Base frame
    addMesh(root, new THREE.BoxGeometry(1.9, 0.16, 0.86), primaryMat, [0, 0.22, 0]);

    // Seat cushions (left and right)
    const seatGeo = new THREE.BoxGeometry(0.88, 0.14, 0.72);
    addMesh(root, seatGeo, primaryMat, [-0.46, 0.37, 0.04]);
    addMesh(root, seatGeo, primaryMat, [0.46, 0.37, 0.04]);

    // Backrest
    addMesh(root, new THREE.BoxGeometry(1.9, 0.44, 0.18), primaryMat, [0, 0.58, -0.34]);

    // Back cushions
    const backCushGeo = new THREE.BoxGeometry(0.88, 0.34, 0.12);
    addMesh(root, backCushGeo, primaryMat, [-0.46, 0.58, -0.21], [-0.08, 0, 0]);
    addMesh(root, backCushGeo, primaryMat, [0.46, 0.58, -0.21], [-0.08, 0, 0]);

    // Armrests
    const armGeo = new THREE.BoxGeometry(0.14, 0.34, 0.84);
    addMesh(root, armGeo, primaryMat, [-0.94, 0.45, 0]);
    addMesh(root, armGeo, primaryMat, [0.94, 0.45, 0]);

    return root;
  },

  // 2. Chair (Dining chair)
  chair: (colour: string) => {
    const root = new THREE.Group();
    root.name = "Chair";
    const primaryMat = matStandard(colour, { roughness: 0.8, metalness: 0.02 });
    const woodMat = matStandard(WOOD_DEFAULT, { roughness: 0.65 });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.44, 16);
    [
      [-0.2, 0.22, -0.19],
      [0.2, 0.22, -0.19],
      [-0.2, 0.22, 0.19],
      [0.2, 0.22, 0.19],
    ].forEach((pos) => addMesh(root, legGeo, woodMat, pos as [number, number, number]));

    // Seat base
    addMesh(root, new THREE.BoxGeometry(0.48, 0.05, 0.46), primaryMat, [0, 0.46, 0]);

    // Backrest uprights
    const postGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 16);
    addMesh(root, postGeo, woodMat, [-0.19, 0.68, -0.2]);
    addMesh(root, postGeo, woodMat, [0.19, 0.68, -0.2]);

    // Curved backrest panel
    addMesh(root, new THREE.BoxGeometry(0.44, 0.24, 0.03), primaryMat, [0, 0.76, -0.2]);

    return root;
  },

  // 3. Stool
  stool: (colour: string) => {
    const root = new THREE.Group();
    root.name = "Stool";
    const primaryMat = matStandard(colour, { roughness: 0.85, metalness: 0.02 });
    const woodMat = matStandard(WOOD_DEFAULT, { roughness: 0.65 });

    // Round seat
    addMesh(root, new THREE.CylinderGeometry(0.19, 0.19, 0.06, 32), primaryMat, [0, 0.62, 0]);

    // 4 Splayed legs
    const legGeo = new THREE.CylinderGeometry(0.016, 0.012, 0.6, 16);
    addMesh(root, legGeo, woodMat, [-0.12, 0.3, -0.12], [-0.08, 0, 0.08]);
    addMesh(root, legGeo, woodMat, [0.12, 0.3, -0.12], [-0.08, 0, -0.08]);
    addMesh(root, legGeo, woodMat, [-0.12, 0.3, 0.12], [0.08, 0, 0.08]);
    addMesh(root, legGeo, woodMat, [0.12, 0.3, 0.12], [0.08, 0, -0.08]);

    // Footrest ring
    const ringGeo = new THREE.TorusGeometry(0.14, 0.008, 12, 32);
    addMesh(root, ringGeo, woodMat, [0, 0.24, 0], [Math.PI / 2, 0, 0]);

    return root;
  },

  // 4. Armchair
  arm: (colour: string) => {
    const root = new THREE.Group();
    root.name = "Armchair";
    const frameMat = matStandard(WOOD_DEFAULT, { roughness: 0.75 });
    const cushionMat = matStandard(colour, { roughness: 0.88, metalness: 0.02 });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.06, 0.32, 0.06);
    [
      [-0.32, 0.16, -0.28],
      [0.32, 0.16, -0.28],
      [-0.32, 0.16, 0.28],
      [0.32, 0.16, 0.28],
    ].forEach((p) => addMesh(root, legGeo, frameMat, p as [number, number, number]));

    // Seat cushion
    addMesh(root, new THREE.BoxGeometry(0.72, 0.16, 0.62), cushionMat, [0, 0.4, 0]);

    // Backrest
    addMesh(
      root,
      new THREE.BoxGeometry(0.72, 0.62, 0.14),
      cushionMat,
      [0, 0.72, -0.26],
      [-0.08, 0, 0]
    );

    // Arms
    [-0.34, 0.34].forEach((x) =>
      addMesh(root, new THREE.BoxGeometry(0.1, 0.3, 0.6), frameMat, [x, 0.55, 0])
    );

    return root;
  },

  // 5. Dining Table
  dining: (colour: string) => {
    const root = new THREE.Group();
    root.name = "DiningTable";
    const topMat = matStandard(colour, { roughness: 0.55, metalness: 0.05 });
    const legMat = matStandard(WOOD_DEFAULT, { roughness: 0.7 });

    // Solid tabletop
    addMesh(root, new THREE.BoxGeometry(1.8, 0.06, 0.9), topMat, [0, 0.74, 0]);

    // Apron under tabletop
    addMesh(root, new THREE.BoxGeometry(1.64, 0.07, 0.02), legMat, [0, 0.68, -0.38]);
    addMesh(root, new THREE.BoxGeometry(1.64, 0.07, 0.02), legMat, [0, 0.68, 0.38]);
    addMesh(root, new THREE.BoxGeometry(0.02, 0.07, 0.76), legMat, [-0.8, 0.68, 0]);
    addMesh(root, new THREE.BoxGeometry(0.02, 0.07, 0.76), legMat, [0.8, 0.68, 0]);

    // 4 Sturdy legs
    const legGeo = new THREE.BoxGeometry(0.08, 0.71, 0.08);
    [
      [-0.8, 0.355, -0.38],
      [0.8, 0.355, -0.38],
      [-0.8, 0.355, 0.38],
      [0.8, 0.355, 0.38],
    ].forEach((p) => addMesh(root, legGeo, legMat, p as [number, number, number]));

    return root;
  },

  // 6. Coffee Table
  coffee: (colour: string) => {
    const root = new THREE.Group();
    root.name = "CoffeeTable";
    const topMat = matStandard(colour, { roughness: 0.5, metalness: 0.05 });
    const legMat = matStandard(METAL_DEFAULT, { roughness: 0.35, metalness: 0.6 });

    // Wooden top
    addMesh(root, new THREE.BoxGeometry(1.1, 0.05, 0.6), topMat, [0, 0.4, 0]);

    // Slim steel legs
    const legGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.38, 16);
    [
      [-0.48, 0.2, -0.24],
      [0.48, 0.2, -0.24],
      [-0.48, 0.2, 0.24],
      [0.48, 0.2, 0.24],
    ].forEach((p) => addMesh(root, legGeo, legMat, p as [number, number, number]));

    return root;
  },

  // 7. Side table / Nightstand
  side: (colour: string) => {
    const root = new THREE.Group();
    root.name = "SideTable";
    const topMat = matStandard(colour, { roughness: 0.6, metalness: 0.05 });
    const frameMat = matStandard(WOOD_DEFAULT, { roughness: 0.7 });

    // Carcass box
    addMesh(root, new THREE.BoxGeometry(0.5, 0.28, 0.45), topMat, [0, 0.42, 0]);

    // Drawer front accent
    addMesh(root, new THREE.BoxGeometry(0.44, 0.22, 0.02), frameMat, [0, 0.42, 0.228]);

    // Small handle
    addMesh(
      root,
      new THREE.CylinderGeometry(0.008, 0.008, 0.08, 16),
      matStandard(METAL_DEFAULT, { roughness: 0.3, metalness: 0.7 }),
      [0, 0.42, 0.245],
      [0, 0, Math.PI / 2]
    );

    // 4 Legs
    const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.28, 16);
    [
      [-0.2, 0.14, -0.18],
      [0.2, 0.14, -0.18],
      [-0.2, 0.14, 0.18],
      [0.2, 0.14, 0.18],
    ].forEach((p) => addMesh(root, legGeo, frameMat, p as [number, number, number]));

    return root;
  },

  // 8. Bookshelf
  shelf: (colour: string) => {
    const root = new THREE.Group();
    root.name = "Bookshelf";
    const frameMat = matStandard(WOOD_DEFAULT, { roughness: 0.7 });
    const accentMat = matStandard(colour, { roughness: 0.75, metalness: 0.05 });

    // Side panels
    const sideGeo = new THREE.BoxGeometry(0.04, 1.6, 0.32);
    addMesh(root, sideGeo, frameMat, [-0.44, 0.8, 0]);
    addMesh(root, sideGeo, frameMat, [0.44, 0.8, 0]);

    // 5 Shelves
    const shelfGeo = new THREE.BoxGeometry(0.88, 0.03, 0.32);
    [0.04, 0.44, 0.84, 1.24, 1.56].forEach((y) =>
      addMesh(root, shelfGeo, frameMat, [0, y, 0])
    );

    // Coloured back panel
    addMesh(root, new THREE.BoxGeometry(0.84, 1.56, 0.02), accentMat, [0, 0.8, -0.15]);

    return root;
  },

  // 9. Bed
  bed: (colour: string) => {
    const root = new THREE.Group();
    root.name = "Bed";
    const fabricMat = matStandard(colour, { roughness: 0.9, metalness: 0.02 });
    const frameMat = matStandard(WOOD_DEFAULT, { roughness: 0.7 });
    const linenMat = matStandard("#f3ede2", { roughness: 0.95 });

    // Bed frame
    addMesh(root, new THREE.BoxGeometry(1.68, 0.22, 2.15), frameMat, [0, 0.15, 0]);

    // Mattress
    addMesh(root, new THREE.BoxGeometry(1.56, 0.26, 2.02), linenMat, [0, 0.37, 0.02]);

    // Headboard
    addMesh(root, new THREE.BoxGeometry(1.72, 0.88, 0.12), fabricMat, [0, 0.68, -1.02]);

    // 2 Pillows
    const pillowGeo = new THREE.BoxGeometry(0.56, 0.12, 0.38);
    addMesh(root, pillowGeo, linenMat, [-0.36, 0.54, -0.72], [-0.12, 0, 0]);
    addMesh(root, pillowGeo, linenMat, [0.36, 0.54, -0.72], [-0.12, 0, 0]);

    return root;
  },

  // 10. Floor Lamp
  lamp: (colour: string) => {
    const root = new THREE.Group();
    root.name = "FloorLamp";
    const poleMat = matStandard(METAL_DEFAULT, { roughness: 0.4, metalness: 0.7 });
    const shadeMat = matStandard(colour, { roughness: 0.85, metalness: 0 });

    // Base
    addMesh(root, new THREE.CylinderGeometry(0.16, 0.18, 0.02, 32), poleMat, [0, 0.01, 0]);

    // Vertical pole
    addMesh(root, new THREE.CylinderGeometry(0.015, 0.015, 1.3, 16), poleMat, [0, 0.66, 0]);

    // Drum lampshade
    addMesh(
      root,
      new THREE.CylinderGeometry(0.22, 0.26, 0.32, 32, 1, true),
      shadeMat,
      [0, 1.42, 0]
    );

    return root;
  },
};

// ── Stage & Fit ────────────────────────────────────────────────────────────
export function createStage(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ground: THREE.Mesh;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
} {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  // If THREE.REVISION >= 155, use hemisphere and sun intensity 0.75 * Math.PI, otherwise 0.75
  const isModern = parseInt(THREE.REVISION, 10) >= 155;
  const intensity = isModern ? 0.75 * Math.PI : 0.75;

  const hemi = new THREE.HemisphereLight("#ffffff", "#d5cfc4", intensity);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight("#ffffff", intensity);
  sun.position.set(2.5, 4, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Ground shadow receiver
  const groundGeo = new THREE.PlaneGeometry(10, 10);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  return { scene, camera, ground, sun, hemi };
}

export function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  angle: number,
  elevation: number,
  distance: number
) {
  const cosElev = Math.cos(elevation);
  camera.position.set(
    target.x + distance * cosElev * Math.sin(angle),
    target.y + distance * Math.sin(elevation),
    target.z + distance * cosElev * Math.cos(angle)
  );
  camera.lookAt(target);
}

export function fitModel(
  model: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  angle = -0.65,
  elevation = 0.38,
  zoom = 1.0
): { target: THREE.Vector3; distance: number; size: THREE.Vector3 } {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Center horizontally and place bottom on ground (y = 0)
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;

  const target = new THREE.Vector3(0, size.y * 0.45, 0);

  const maxDim = Math.max(size.x, size.y, size.z, 0.6);
  const fovRad = (camera.fov * Math.PI) / 180;
  const baseDistance = ((maxDim / 2) / Math.tan(fovRad / 2)) * 1.55;
  const distance = baseDistance / zoom;

  updateCameraPosition(camera, target, angle, elevation, distance);

  return { target, distance: baseDistance, size };
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
}

// ── Shared Offscreen WebGLRenderer ─────────────────────────────────────────
let sharedRenderer: THREE.WebGLRenderer | null = null;
let sharedRefCount = 0;

export function acquireSharedRenderer(): THREE.WebGLRenderer | null {
  if (typeof document === "undefined") return null;

  if (!sharedRenderer) {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 480;
    sharedRenderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    sharedRenderer.setSize(480, 480, false);
    sharedRenderer.shadowMap.enabled = true;
    sharedRenderer.shadowMap.type = THREE.PCFShadowMap;
  }
  sharedRefCount++;
  return sharedRenderer;
}

export function releaseSharedRenderer() {
  sharedRefCount--;
  if (sharedRefCount <= 0 && sharedRenderer) {
    sharedRenderer.dispose();
    sharedRenderer = null;
    sharedRefCount = 0;
  }
}
