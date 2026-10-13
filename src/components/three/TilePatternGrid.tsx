"use client";

import { TileSlab } from "./TileSlab";
import type { TileColorway } from "./tileTextures";

export type PatternLayout = "grid" | "alternating" | "herringbone";

function rotationFor(layout: PatternLayout, col: number, row: number, baseRotationSteps: number): number {
  const base = (baseRotationSteps * Math.PI) / 2;
  if (layout === "grid") return base;
  if (layout === "alternating") return base + ((col + row) % 2 === 0 ? 0 : Math.PI / 2);
  // herringbone preview: alternate 90 degree rotation in a brick-like zig-zag
  return base + (col % 2 === row % 2 ? Math.PI / 2 : 0);
}

export function TilePatternGrid({
  colorway,
  layout,
  rotationSteps,
  tileSize = 1,
  grout = 0.045,
}: {
  colorway: TileColorway;
  layout: PatternLayout;
  rotationSteps: number;
  tileSize?: number;
  grout?: number;
}) {
  const pitch = tileSize + grout;
  const cells: { x: number; y: number; col: number; row: number }[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push({
        x: (col - 1) * pitch,
        y: (1 - row) * pitch,
        col,
        row,
      });
    }
  }

  return (
    <group>
      {/* grout bed */}
      <mesh position={[0, 0, -0.16]} receiveShadow>
        <boxGeometry args={[pitch * 3 + 0.05, pitch * 3 + 0.05, 0.08]} />
        <meshStandardMaterial color="#9a958a" roughness={0.9} />
      </mesh>
      {cells.map((cell) => (
        <TileSlab
          key={`${cell.col}-${cell.row}`}
          colorway={colorway}
          size={tileSize}
          thickness={0.18}
          position={[cell.x, cell.y, 0]}
          rotationY={rotationFor(layout, cell.col, cell.row, rotationSteps)}
        />
      ))}
    </group>
  );
}
