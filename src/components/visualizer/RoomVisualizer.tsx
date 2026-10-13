"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import type { Product } from "@/db/schema";
import {
  drawSurface,
  type TileDefinition,
  type TilePattern,
} from "@/components/three/proceduralTiles";

type RoomType = "living" | "kitchen" | "bath";
type Layout = "straight" | "brick" | "herringbone";
type Target = "floor" | "wall" | "both";

interface RoomDef {
  w: number;
  d: number;
  h: number;
  r: number;
  fl: string;
  wl: string;
  f: Array<[string, number, number, number, number, number, number, string]>;
}

const ROOMS: Record<RoomType, RoomDef> = {
  living: {
    w: 4,
    d: 3.6,
    h: 2.6,
    r: 7.4,
    fl: "#8d8982",
    wl: "#d8d2c6",
    f: [
      ["b", 2.1, 0.42, 0.95, 0.2, 0, -1.3, "#5b6f7a"],
      ["b", 2.1, 0.5, 0.22, 0.2, 0.42, -1.69, "#5b6f7a"],
      ["b", 0.22, 0.66, 0.95, -0.74, 0, -1.3, "#4d6069"],
      ["b", 0.22, 0.66, 0.95, 1.14, 0, -1.3, "#4d6069"],
      ["c", 2.2, 0.02, 0, 0.2, 0.005, 0.5, "#a38d6d"],
      ["b", 0.9, 0.36, 0.5, 0.2, 0, 0.5, "#7a5a3a"],
      ["b", 0.45, 0.55, 1.7, -1.77, 0, 0.1, "#6b4d33"],
      ["c", 0.3, 0.35, 0, 1.5, 0, 1.1, "#7a5a3a"],
      ["s", 0.55, 0.55, 0.55, 1.5, 0.3, 1.1, "#4f7a52"],
    ],
  },
  kitchen: {
    w: 3.6,
    d: 3,
    h: 2.6,
    r: 6.6,
    fl: "#8d8982",
    wl: "#ddd8cc",
    f: [
      ["b", 2.7, 0.88, 0.6, 0.45, 0, -1.2, "#e6e1d7"],
      ["b", 2.7, 0.04, 0.64, 0.45, 0.88, -1.2, "#2d2f31"],
      ["b", 0.72, 1.9, 0.72, -1.44, 0, -1.14, "#c9ccce"],
      ["b", 1.5, 0.88, 0.75, 0.4, 0, 0.35, "#3f5a4d"],
      ["b", 1.6, 0.04, 0.85, 0.4, 0.88, 0.35, "#e9e5dd"],
      ["c", 0.34, 0.62, 0, -0.1, 0, 1.05, "#7a5a3a"],
      ["c", 0.34, 0.62, 0, 0.9, 0, 1.05, "#7a5a3a"],
    ],
  },
  bath: {
    w: 2.4,
    d: 2.4,
    h: 2.5,
    r: 5.8,
    fl: "#8d8982",
    wl: "#ddd8cc",
    f: [
      ["b", 1.7, 0.55, 0.75, -0.3, 0, -0.8, "#f4f4f1"],
      ["b", 0.38, 0.4, 0.55, 0.9, 0, -0.92, "#f4f4f1"],
      ["b", 0.38, 0.38, 0.2, 0.9, 0.4, -1.1, "#f4f4f1"],
      ["b", 0.5, 0.82, 0.9, -0.95, 0, 0.5, "#8a6b4a"],
      ["b", 0.52, 0.04, 0.92, -0.95, 0.82, 0.5, "#efefec"],
      ["b", 0.03, 0.8, 0.7, -1.185, 1.2, 0.5, "#b9d0d8"],
      ["c", 0.8, 0.015, 0, 0.1, 0.005, 0.3, "#c9c1b3"],
    ],
  },
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Props {
  products: Product[];
  onAddToCart: (quantity: number, meta: Record<string, unknown>) => Promise<void>;
  initialTileIdx?: number;
  initialRoom?: RoomType;
}

export function RoomVisualizer({ products, onAddToCart, initialTileIdx = 0, initialRoom }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tileIdx, setTileIdx] = useState(initialTileIdx);
  const [roomType, setRoomType] = useState<RoomType>(
    initialRoom && ["living", "kitchen", "bath"].includes(initialRoom) ? initialRoom : "living"
  );
  const [target, setTarget] = useState<Target>("floor");
  const [size, setSize] = useState(() => products[initialTileIdx]?.tileSizeCm ?? 30);
  const [grout, setGrout] = useState("#d6d0c5");
  const [layout, setLayout] = useState<Layout>("straight");
  const [night, setNight] = useState(false);
  const [cmpOn, setCmpOn] = useState(true);
  const [splitPercent, setSplitPercent] = useState(98);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  // Comparison slider state - OUTSIDE React state to avoid re-renders on drag
  const cmpStateRef = useRef({
    split: 0.98,
    target: 0.98,
    dragging: false,
    raf: 0,
    sweepDone: false,
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const roomRef = useRef<THREE.Group | null>(null);
  const surfsRef = useRef<
    Array<{
      k: string;
      m: THREE.Mesh;
      w: number;
      h: number;
      bf: THREE.Material;
      af?: THREE.Material;
    }>
  >([]);
  const lightsRef = useRef<{
    hemi: THREE.HemisphereLight;
    sun: THREE.DirectionalLight;
    lamp: THREE.PointLight;
  } | null>(null);
  const [theta, setTheta] = useState(0.62);
  const [phi, setPhi] = useState(1.12);
  const [rad, setRad] = useState(7);
  const tgRef = useRef(new THREE.Vector3(0, 0.9, 0));
  const dragRef = useRef<[number, number] | null>(null);
  const cmpHandleRef = useRef<HTMLDivElement | null>(null);
  const needRef = useRef(1);

  // Convert products to tiles using useMemo (no cascading setState in effects)
  const tiles = useMemo<TileDefinition[]>(() => {
    return products.map((p) => {
      let color = p.visualizerColor || p.colorHex || "#cccccc";
      const pattern: TilePattern = (p.pattern as TilePattern) || "plain";
      const roughness = p.finish === "gloss" ? 0.18 : p.finish === "matte" ? 0.75 : 0.4;

      if (!p.visualizerColor) {
        const n = p.name.toLowerCase();
        if (n.includes("chalk") || n.includes("white")) color = "#f0eee8";
        else if (n.includes("charcoal")) color = "#3d4043";
        else if (n.includes("terracotta")) color = "#b8613b";
        else if (n.includes("sage")) color = "#8ea592";
        else if (n.includes("blue") || n.includes("ink")) color = "#20395c";
        else if (n.includes("ivory") || n.includes("sand")) color = "#cdb99b";
      }

      return {
        name: p.name,
        color,
        pattern,
        variation: 0.08,
        roughness,
        pricePerSqm: p.pricePerM2 ? p.pricePerM2 / 100 : p.priceCents / 100,
      };
    });
  }, [products]);

  const handleSelectTile = useCallback(
    (i: number) => {
      setTileIdx(i);
      if (products[i]?.tileSizeCm) {
        setSize(products[i].tileSizeCm);
      }
    },
    [products]
  );

  // Init Three.js - FIX 1, 2, 3: Proper canvas sizing, camera, transparent background
  useEffect(() => {
    if (!canvasRef.current || tiles.length === 0) return;

    const canvas = canvasRef.current;
    // FIX 3: alpha:true for transparent background
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // FIX 1: Set pixel ratio once
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // Performance: only update shadows in build()
    // FIX 3: Do NOT set scene.background or setClearColor
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // FIX 2: Camera params from reference exactly
    const camera = new THREE.PerspectiveCamera(38, 1.45, 0.1, 50);
    cameraRef.current = camera;

    const room = new THREE.Group();
    roomRef.current = room;
    scene.add(room);

    // Create lights and store in ref for night toggle
    // r155+ uses physical light units — intensities must be in candela/lux (×Math.PI for legacy parity)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8378, 0.6 * Math.PI);
    const sun = new THREE.DirectionalLight(0xfff1dc, 0.6 * Math.PI);
    sun.position.set(4, 6, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02; // prevent shadow acne on modern three
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 18 });

    // decay: 2 is physically correct in r155+; intensity 0 = off (day mode)
    const lamp = new THREE.PointLight(0xffc98a, 0, 14, 2);
    lamp.position.set(0, 2.2, 0.3);
    scene.add(hemi, sun, lamp);

    // Store light refs for night toggle (separate effect)
    lightsRef.current = { hemi, sun, lamp };

    return () => {
      renderer.dispose();
      surfsRef.current.forEach((s) => {
        s.bf.dispose();
        if (s.af && s.af !== s.bf) s.af.dispose();
      });
    };
  }, [tiles]); // Run once when tiles load, NOT on night toggle

  // Night/Day toggle - separate effect that only changes lights
  useEffect(() => {
    if (!lightsRef.current || !stageRef.current) return;

    const { hemi, sun, lamp } = lightsRef.current;

    // Imperative light updates — physical units (r155+)
    if (night) {
      hemi.intensity = 0.16 * Math.PI;
      sun.intensity = 0;
      lamp.intensity = 12; // warm glow; tune 8–20
      stageRef.current.style.backgroundColor = "#14171b";
    } else {
      hemi.intensity = 0.6 * Math.PI;
      sun.intensity = 0.6 * Math.PI;
      lamp.intensity = 0;
      stageRef.current.style.backgroundColor = "#e8e6e2";
    }

    needRef.current = 1; // Set dirty flag
  }, [night]); // Only dependency: night

  const refresh = useCallback(() => {
    surfsRef.current.forEach((s) => {
      // Dispose old textures before creating new ones
      if (s.af && s.af !== s.bf) {
        if ((s.af as THREE.MeshStandardMaterial).map) {
          (s.af as THREE.MeshStandardMaterial).map?.dispose();
        }
        if ((s.af as THREE.MeshStandardMaterial).bumpMap) {
          (s.af as THREE.MeshStandardMaterial).bumpMap?.dispose();
        }
        s.af.dispose();
      }

      const cfg =
        s.k === "floor"
          ? target === "floor" || target === "both"
            ? { tile: tileIdx, size, grout, layout }
            : null
          : target === "wall" || target === "both"
            ? { tile: tileIdx, size, grout, layout }
            : null;

      if (cfg && tiles[cfg.tile]) {
        const albedoCanvas = document.createElement("canvas");
        const bumpCanvas = document.createElement("canvas");

        drawSurface(
          albedoCanvas,
          s.w,
          s.h,
          {
            tile: tiles[cfg.tile],
            tileSizeCm: cfg.size,
            groutColor: cfg.grout,
            layout: cfg.layout,
            seed: cfg.tile * 97 + 11,
          },
          false,
          300
        );
        drawSurface(
          bumpCanvas,
          s.w,
          s.h,
          {
            tile: tiles[cfg.tile],
            tileSizeCm: cfg.size,
            groutColor: cfg.grout,
            layout: cfg.layout,
            seed: cfg.tile * 97 + 11,
          },
          true,
          300
        );

        const albedoTex = new THREE.CanvasTexture(albedoCanvas);
        albedoTex.colorSpace = THREE.SRGBColorSpace; // colour map must be sRGB in modern three
        albedoTex.anisotropy = 8;
        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        // bumpMap stays linear (default) — do NOT set colorSpace on it
        bumpTex.anisotropy = 8;

        s.af = new THREE.MeshStandardMaterial({
          map: albedoTex,
          bumpMap: bumpTex,
          bumpScale: 2,
          roughness: tiles[cfg.tile].roughness,
          metalness: 0,
        });
      } else {
        s.af = s.bf;
      }
    });

    needRef.current = 1;
  }, [tiles, tileIdx, target, size, grout, layout]);

  // Build room
  // Build room - FIX 2: Log bounding box for debug
  const buildRoom = useCallback(
    (rk: RoomType) => {
      if (!roomRef.current || tiles.length === 0) return;

      const R = ROOMS[rk];
      setRad(R.r); // FIX 2: Set radius per room

      const room = roomRef.current;
      room.children.slice().forEach((o) => {
        room.remove(o);
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      });

      surfsRef.current.forEach((s) => {
        s.bf.dispose();
        if (s.af && s.af !== s.bf) s.af.dispose();
      });
      surfsRef.current = [];

      const noiseTex = document.createElement("canvas");
      noiseTex.width = noiseTex.height = 128;
      const nCtx = noiseTex.getContext("2d")!;
      const imgData = nCtx.createImageData(128, 128);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = 225 + Math.random() * 30;
        imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
      }
      nCtx.putImageData(imgData, 0, 0);

      const noiseMat = (col: string, w: number, h: number) => {
        const t = new THREE.CanvasTexture(noiseTex);
        t.colorSpace = THREE.SRGBColorSpace; // modern three requires explicit colorSpace
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(w / 1.2, h / 1.2);
        return new THREE.MeshStandardMaterial({ color: col, map: t, roughness: 0.95 });
      };

      const plane = (
        pw: number,
        pH: number,
        x: number,
        y: number,
        z: number,
        ry: number,
        rx: number,
        k: string
      ) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, pH), new THREE.MeshStandardMaterial());
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, 0);
        m.receiveShadow = true;
        room.add(m);

        const s = { k, m, w: pw, h: pH, bf: noiseMat(k === "floor" ? R.fl : R.wl, pw, pH) };
        surfsRef.current.push(s);
      };

      // FIX 2: Dimensions in metres (living 4 x 3.6 x 2.6)
      plane(R.w, R.d, 0, 0, 0, 0, -Math.PI / 2, "floor");
      plane(R.w, R.h, 0, R.h / 2, -R.d / 2, 0, 0, "wall");
      plane(R.d, R.h, -R.w / 2, R.h / 2, 0, Math.PI / 2, 0, "wall");

      const sk = new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.6 });
      [
        [R.w, 0.08, 0.02, 0, 0.04, -R.d / 2 + 0.01],
        [0.02, 0.08, R.d, -R.w / 2 + 0.01, 0.04, 0],
      ].forEach(([a, b, c, x, y, z]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), sk);
        m.position.set(x, y, z);
        room.add(m);
      });

      R.f.forEach(([t, a, b, c, x, y, z, col]) => {
        const g =
          t === "b"
            ? new THREE.BoxGeometry(a, b, c)
            : t === "c"
              ? new THREE.CylinderGeometry(a / 2, a / 2, b, 40)
              : new THREE.SphereGeometry(a / 2, 24, 16);
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 }));
        m.position.set(x, y + (t === "s" ? a / 2 : b / 2), z);
        m.castShadow = m.receiveShadow = true;
        room.add(m);
      });

      // FIX 2: Debug bounding box
      const bbox = new THREE.Box3().setFromObject(room);
      console.log("Room bounding box center:", bbox.getCenter(new THREE.Vector3()).toArray());
      console.log("Room size:", bbox.getSize(new THREE.Vector3()).toArray());

      // Update shadows only on room rebuild
      if (rendererRef.current) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }

      refresh();
    },
    [tiles, refresh]
  );

  // FIX 2: placeCam from reference exactly - target Vector3(0, 0.9, 0)
  const placeCam = useCallback(() => {
    if (!cameraRef.current) return;
    const tg = tgRef.current;
    const cam = cameraRef.current;
    cam.position.set(
      tg.x + rad * Math.sin(phi) * Math.sin(theta),
      tg.y + rad * Math.cos(phi),
      tg.z + rad * Math.sin(phi) * Math.cos(theta)
    );
    cam.lookAt(tg);

    // Temporary debug logs per instructions
    console.log("Camera position:", cam.position.toArray());
    console.log("Radius:", rad, "Theta:", theta, "Phi:", phi);

    needRef.current = 1;
  }, [rad, theta, phi]);

  // FIX 1: ResizeObserver with proper sizing - AFTER layout using requestAnimationFrame
  useEffect(() => {
    if (!stageRef.current || !rendererRef.current || !cameraRef.current) return;

    const handleResize = () => {
      if (!stageRef.current || !rendererRef.current || !cameraRef.current) return;
      const W = stageRef.current.clientWidth;
      const H = stageRef.current.clientHeight;

      // FIX 1: renderer.setSize with false flag (don't update CSS)
      rendererRef.current.setSize(W, H, false);
      cameraRef.current.aspect = W / H;
      cameraRef.current.updateProjectionMatrix();

      console.log("Renderer size:", rendererRef.current.getSize(new THREE.Vector2()).toArray());

      needRef.current = 1;
    };

    // FIX 1: Initial size AFTER layout
    requestAnimationFrame(() => {
      handleResize();
      placeCam(); // FIX 2: Call placeCam after first resize
    });

    const observer = new ResizeObserver(handleResize);
    observer.observe(stageRef.current);

    return () => observer.disconnect();
  }, [placeCam]);

  // Render loop - FIX 1: Use renderer.getSize(), not clientWidth/clientHeight
  useEffect(() => {
    let frame: number;
    const draw = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !canvasRef.current) {
        frame = requestAnimationFrame(draw);
        return;
      }

      if (needRef.current) {
        needRef.current = 0;

        // FIX 1: Get size from renderer, not canvas CSS
        const size = new THREE.Vector2();
        rendererRef.current.getSize(size);
        const W = size.x;
        const H = size.y;

        const cmp = cmpStateRef.current;
        const sx = cmpOn ? Math.round(W * cmp.split) : 0;

        rendererRef.current.setScissorTest(true);
        // FIX 1: setViewport and setScissor take CSS pixels (already in buffer coords)
        rendererRef.current.setViewport(0, 0, W, H);

        if (sx > 0) {
          surfsRef.current.forEach((s) => (s.m.material = s.bf));
          rendererRef.current.setScissor(0, 0, sx, H);
          rendererRef.current.render(sceneRef.current!, cameraRef.current!);
        }

        if (sx < W) {
          surfsRef.current.forEach((s) => (s.m.material = s.af || s.bf));
          rendererRef.current.setScissor(sx, 0, W - sx, H);
          rendererRef.current.render(sceneRef.current!, cameraRef.current!);
        }
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [cmpOn]); // Only cmpOn, NOT split

  // setSplit: update split position without React re-render
  const setSplit = useCallback((v: number) => {
    const cmp = cmpStateRef.current;
    const clamped = Math.min(0.98, Math.max(0.02, v));
    cmp.target = clamped;
    setSplitPercent(Math.round(clamped * 100));
    if (!cmp.raf) {
      cmp.raf = requestAnimationFrame(() => {
        cmp.raf = 0;
        cmp.split = cmp.target;

        // Update handle position
        if (stageRef.current && cmpHandleRef.current) {
          const W = stageRef.current.clientWidth;
          cmpHandleRef.current.style.transform = `translateX(${Math.round(cmp.split * W)}px)`;
        }

        needRef.current = 1; // Mark scene as needing redraw
      });
    }
  }, []);

  // Cancel sweep animation
  const cancelSweep = useCallback(() => {
    cmpStateRef.current.sweepDone = true;
  }, []);

  // Sweep animation - runs ONCE on first mount only
  useEffect(() => {
    const cmp = cmpStateRef.current;
    if (cmp.sweepDone) return;

    const t0 = performance.now();
    const animate = (t: number) => {
      if (cmp.sweepDone) return;
      const k = Math.min(1, (t - t0) / 1500);
      setSplit(0.98 - 0.48 * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(animate);
      else cmp.sweepDone = true;
    };
    requestAnimationFrame(animate);
  }, [setSplit]);

  // Initialize handle position on mount
  useEffect(() => {
    if (stageRef.current && cmpHandleRef.current) {
      const W = stageRef.current.clientWidth;
      const cmp = cmpStateRef.current;
      cmpHandleRef.current.style.transform = `translateX(${Math.round(cmp.split * W)}px)`;
    }
  }, []); // Run once on mount

  // Rebuild on room change - FIX 2: Call placeCam() after build
  useEffect(() => {
    if (tiles.length > 0) {
      buildRoom(roomType);
      placeCam(); // FIX 2: Place camera after room switch
    }
  }, [roomType, buildRoom, tiles, placeCam]);

  // Refresh on config change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Update camera
  useEffect(() => {
    placeCam();
  }, [placeCam]);

  const coverage = () => {
    if (tiles.length === 0) return { area: 0, tiles: 0, total: 0, waste: 0 };
    const R = ROOMS[roomType];
    let a = 0;
    if (target === "floor" || target === "both") a += R.w * R.d;
    if (target === "wall" || target === "both") a += (R.w + R.d) * R.h;
    const wt = layout === "straight" ? 1.1 : layout === "brick" ? 1.12 : 1.15;
    const pa = (layout === "herringbone" ? (size * size) / 3 : size * size) / 10000;
    const n = Math.ceil((a * wt) / pa);
    const m = a * wt * tiles[tileIdx].pricePerSqm;
    return { area: a, tiles: n, total: m, waste: Math.round((wt - 1) * 100) };
  };

  const cov = coverage();

  const handleAddToCart = async () => {
    setStatus("loading");
    try {
      await onAddToCart(cov.tiles, {
        productId: products[tileIdx]?.id,
        room: roomType,
        surfaces: target,
        layout,
        size,
        grout,
        area: cov.area,
        waste: cov.waste,
      });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div
          ref={stageRef}
          className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl"
          style={{ backgroundColor: "#e8e6e2" }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
            className="outline-none cursor-grab active:cursor-grabbing"
            tabIndex={0}
            onPointerDown={(e) => {
              if (cmpStateRef.current.dragging) return; // Don't start camera drag if compare handle is being dragged
              dragRef.current = [e.clientX, e.clientY];
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              // Handle comparison drag at canvas level for better tracking
              if (cmpStateRef.current.dragging && stageRef.current) {
                const r = stageRef.current.getBoundingClientRect();
                setSplit(clamp((e.clientX - r.left) / r.width, 0.02, 0.98));
                return;
              }

              // Handle camera rotation drag
              if (!dragRef.current) return;
              setTheta(clamp(theta - (e.clientX - dragRef.current[0]) * 0.006, -0.15, 1.72));
              setPhi(clamp(phi - (e.clientY - dragRef.current[1]) * 0.005, 0.35, 1.5));
              dragRef.current = [e.clientX, e.clientY];
            }}
            onPointerUp={() => {
              dragRef.current = null;
              cmpStateRef.current.dragging = false;
            }}
            onWheel={(e) => {
              e.preventDefault();
              setRad(clamp(rad * (1 + e.deltaY * 0.001), 2.5, 12));
            }}
          />

          {cmpOn && (
            <>
              <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                Before
              </div>
              <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                After
              </div>

              <div
                ref={cmpHandleRef}
                className="absolute top-0 bottom-0 w-11 cursor-ew-resize flex items-center justify-center select-none"
                style={{
                  left: 0,
                  marginLeft: "-22px",
                  willChange: "transform",
                  touchAction: "none",
                }}
                tabIndex={0}
                role="slider"
                aria-label="Before and after"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={splitPercent}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cancelSweep();
                  cmpStateRef.current.dragging = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  document.body.classList.add("cmp-drag");
                }}
                onPointerMove={(e) => {
                  if (!cmpStateRef.current.dragging || !stageRef.current) return;
                  const r = stageRef.current.getBoundingClientRect();
                  setSplit((e.clientX - r.left) / r.width);
                }}
                onPointerUp={(e) => {
                  cmpStateRef.current.dragging = false;
                  document.body.classList.remove("cmp-drag");
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onPointerCancel={(e) => {
                  cmpStateRef.current.dragging = false;
                  document.body.classList.remove("cmp-drag");
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                }}
                onLostPointerCapture={() => {
                  cmpStateRef.current.dragging = false;
                  document.body.classList.remove("cmp-drag");
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    cancelSweep();
                    setSplit(Math.max(0.02, cmpStateRef.current.split - 0.02));
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    cancelSweep();
                    setSplit(Math.min(0.98, cmpStateRef.current.split + 0.02));
                  }
                }}
              >
                <div className="h-full w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)]" />
                <div
                  draggable="false"
                  className="absolute top-1/2 -mt-[18px] flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-900 shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-sm select-none"
                >
                  ⇄
                </div>
              </div>
            </>
          )}

          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
            Drag to rotate · scroll or +/− to zoom{cmpOn ? " · drag handle to compare" : ""}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(["living", "kitchen", "bath"] as RoomType[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoomType(r)}
              className={`rounded-full border px-4 py-1.5 capitalize ${roomType === r ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700"}`}
            >
              {r === "living" ? "Living room" : r === "kitchen" ? "Kitchen" : "Bathroom"}
            </button>
          ))}
          <button
            onClick={() => {
              setCmpOn(!cmpOn);
              cancelSweep();
              needRef.current = 1;
            }}
            className={`rounded-full border px-4 py-1.5 ${cmpOn ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700"}`}
          >
            ◐ Before / After
          </button>
          <button
            onClick={() => setNight(!night)}
            className="ml-auto rounded-full border border-stone-300 bg-white px-4 py-1.5"
          >
            {night ? "🌙 Night" : "☀️ Day"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">1. Pick a tile</p>
          <div className="grid grid-cols-4 gap-2">
            {products.map((p, i) => {
              const tile = tiles[i];
              if (!tile) return null;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectTile(i)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${tileIdx === i ? "border-stone-900" : "border-transparent"}`}
                  title={p.name}
                >
                  <SwatchCanvas tile={tile} size={p.tileSizeCm || 30} />
                </button>
              );
            })}
          </div>
          {products[tileIdx] && (
            <p className="mt-2 text-xs text-stone-500">
              {products[tileIdx].name} · ${tiles[tileIdx]?.pricePerSqm.toFixed(2)}/m² · {size}cm
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">2. Apply to</p>
          <div className="flex overflow-hidden rounded-full border border-stone-300 text-sm">
            {(["floor", "wall", "both"] as Target[]).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`flex-1 px-4 py-1.5 capitalize ${target === t ? "bg-stone-900 text-white" : "bg-white text-stone-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">3. Tile size: {size}cm</p>
          <input
            type="range"
            min={Math.min(10, ...products.map((p) => p.tileSizeCm || 30).filter(Boolean))}
            max={60}
            step={size < 10 ? 1 : 5}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-stone-900"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-stone-700">4. Grout colour</p>
            <input
              type="color"
              value={grout}
              onChange={(e) => setGrout(e.target.value)}
              className="h-8 w-14 cursor-pointer rounded border border-stone-300"
            />
          </div>
          <div className="flex gap-2">
            {["#f2efe9", "#d6d0c5", "#9a9890", "#4a4a48", "#1f1f1f"].map((c) => (
              <button
                key={c}
                onClick={() => setGrout(c)}
                className={`h-7 w-7 rounded-full border-2 ${grout === c ? "border-stone-900 ring-2 ring-stone-900 ring-offset-2" : "border-stone-300"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">5. Layout</p>
          <div className="flex overflow-hidden rounded-full border border-stone-300 text-sm">
            {(["straight", "brick", "herringbone"] as Layout[]).map((l) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={`flex-1 px-3 py-1.5 capitalize ${layout === l ? "bg-stone-900 text-white" : "bg-white text-stone-700"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {layout === "straight"
              ? "Square tiles in a grid"
              : layout === "brick"
                ? "Rows offset by half a tile"
                : "1:3 planks at 45° · extra cutting waste"}
          </p>
        </div>

        <div className="rounded-xl bg-stone-50 p-4 text-sm">
          <p className="flex justify-between">
            <span className="text-stone-500">Coverage needed</span>
            <span className="font-medium">{cov.area.toFixed(1)} m²</span>
          </p>
          <p className="flex justify-between">
            <span className="text-stone-500">Tiles required</span>
            <span className="font-medium">
              {cov.tiles} tiles <small className="text-stone-400">(+{cov.waste}% waste)</small>
            </span>
          </p>
          <p className="mt-1 flex justify-between text-base">
            <span className="text-stone-700">Estimated total</span>
            <span className="font-semibold">${cov.total.toFixed(2)}</span>
          </p>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={status === "loading"}
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-stone-700 disabled:opacity-60"
        >
          {status === "done"
            ? "Added to cart ✓"
            : status === "loading"
              ? "Adding…"
              : "Add these tiles to cart"}
        </button>
      </div>
    </div>
  );
}

function SwatchCanvas({ tile, size }: { tile: TileDefinition; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    drawSurface(
      canvas,
      0.6,
      0.6,
      {
        tile,
        tileSizeCm: size,
        groutColor: "#d6d0c5",
        layout: "straight",
        seed: tile.name.charCodeAt(0),
      },
      false,
      160
    );
  }, [tile, size]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
