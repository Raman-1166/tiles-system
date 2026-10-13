"use client";

import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useMemo } from "react";
import { useTilePbrTextures, type TileColorway } from "./tileTextures";

/** A single thick, glazed ceramic tile slab with a visible clay-body edge. */
export function TileSlab({
  colorway,
  size = 1.6,
  thickness = 0.26,
  position = [0, 0, 0],
  rotationY = 0,
}: {
  colorway: TileColorway;
  size?: number;
  thickness?: number;
  position?: [number, number, number];
  rotationY?: number;
}) {
  const textures = useTilePbrTextures(colorway);
  const glazeGeo = useMemo(
    () => new RoundedBoxGeometry(size, size, thickness, 4, size * 0.035),
    [size, thickness]
  );
  const biscuitGeo = useMemo(
    () => new RoundedBoxGeometry(size * 0.985, size * 0.985, thickness * 0.5, 2, size * 0.02),
    [size, thickness]
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={glazeGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          {...textures}
          clearcoat={1}
          clearcoatRoughness={0.12}
          roughness={0.3}
          metalness={0.03}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Unglazed clay body peeking out at the base, so the edge detail reads under zoom. */}
      <mesh geometry={biscuitGeo} position={[0, 0, -thickness * 0.28]} receiveShadow>
        <meshStandardMaterial color="#c9a37c" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}
