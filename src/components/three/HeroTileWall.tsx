"use client";

import { ThreeEvent, useFrame } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useTilePbrTextures } from "./tileTextures";

const PALETTE = ["#f4f1ea", "#b5653a", "#8fa17e", "#2a2a28", "#2c3e63", "#e8ddc2"];

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function HeroTileWall({
  cols = 14,
  rows = 9,
  tileSize = 0.82,
  gap = 0.16,
}: {
  cols?: number;
  rows?: number;
  tileSize?: number;
  gap?: number;
}) {
  const count = cols * rows;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const started = useRef<number | null>(null);
  const pitch = tileSize + gap;

  const textures = useTilePbrTextures("chalk-white");

  const layout = useMemo(() => {
    const delays = new Float32Array(count);
    const cx = new Float32Array(count);
    const cy = new Float32Array(count);
    const colIdx = new Int16Array(count);
    const rowIdx = new Int16Array(count);
    let maxDist = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const dist = c + r; // diagonal distance from top-left corner
        maxDist = Math.max(maxDist, dist);
        delays[i] = dist;
        cx[i] = (c - (cols - 1) / 2) * pitch;
        cy[i] = ((rows - 1) / 2 - r) * pitch;
        colIdx[i] = c;
        rowIdx[i] = r;
      }
    }
    const waveDurationTotal = 1.7;
    for (let i = 0; i < count; i++) {
      delays[i] = (delays[i] / Math.max(1, maxDist)) * waveDurationTotal;
    }
    return { delays, cx, cy, colIdx, rowIdx };
  }, [cols, rows, count, pitch]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const hex = PALETTE[Math.floor(Math.abs(Math.sin(i * 12.9898)) * PALETTE.length) % PALETTE.length];
      c.set(hex);
      c.lerp(new THREE.Color("#ffffff"), 0.25);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [count]);

  const hoverCurrent = useRef(new Float32Array(count));
  const hoverTarget = useRef(new Float32Array(count));
  const flipCurrent = useRef(new Float32Array(count));
  const flipTarget = useRef(new Uint8Array(count));
  const hoveredCell = useRef<{ c: number; r: number } | null>(null);

  const geometry = useMemo(() => new RoundedBoxGeometry(tileSize, tileSize, 0.22, 3, 0.05), [tileSize]);

  const setHoverFromInstance = (instanceId: number | undefined) => {
    if (instanceId === undefined) return;
    const c = layout.colIdx[instanceId];
    const r = layout.rowIdx[instanceId];
    hoveredCell.current = { c, r };
    for (let i = 0; i < count; i++) {
      const dc = layout.colIdx[i] - c;
      const dr = layout.rowIdx[i] - r;
      const dist = Math.sqrt(dc * dc + dr * dr);
      hoverTarget.current[i] = Math.max(0, 1 - dist / 2.1);
    }
  };

  const clearHover = () => {
    hoveredCell.current = null;
    hoverTarget.current.fill(0);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoverFromInstance(e.instanceId);
  };

  const onTap = (e: ThreeEvent<PointerEvent>) => {
    if (e.pointerType !== "touch" || e.instanceId === undefined) return;
    e.stopPropagation();
    const id = e.instanceId;
    flipTarget.current[id] = flipTarget.current[id] ? 0 : 1;
    setHoverFromInstance(id);
  };

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (started.current === null) started.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - started.current;

    for (let i = 0; i < count; i++) {
      const waveProgress = THREE.MathUtils.clamp((elapsed - layout.delays[i]) / 0.65, 0, 1);
      const waveEased = waveProgress >= 1 ? 1 : easeOutBack(waveProgress);

      hoverCurrent.current[i] = THREE.MathUtils.damp(
        hoverCurrent.current[i],
        hoverTarget.current[i],
        6,
        0.016
      );
      flipCurrent.current[i] = THREE.MathUtils.damp(
        flipCurrent.current[i],
        flipTarget.current[i],
        5,
        0.016
      );

      const hv = hoverCurrent.current[i];
      const fv = flipCurrent.current[i];

      dummy.position.set(layout.cx[i], layout.cy[i], hv * 0.16);
      const waveRotX = THREE.MathUtils.lerp(-Math.PI / 2, 0, waveEased);
      dummy.rotation.set(
        waveRotX - hv * 0.18 * Math.sign(layout.cy[i] + 0.001 || 1),
        hv * 0.16 + fv * Math.PI,
        0
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      onPointerMove={onPointerMove}
      onPointerDown={onTap}
      onPointerLeave={clearHover}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        {...textures}
        clearcoat={1}
        clearcoatRoughness={0.18}
        roughness={0.35}
        metalness={0.04}
        envMapIntensity={1.1}
      />
    </instancedMesh>
  );
}
