"use client";


export const TILE_COLORWAYS = [
  "chalk-white",
  "terracotta",
  "sage-green",
  "charcoal",
  "ink-blue",
  "warm-ivory",
] as const;

export type TileColorway = (typeof TILE_COLORWAYS)[number];

/** 
 * Loads the albedo/normal/roughness set for one tile colourway.
 * Currently returns empty object since texture files don't exist yet.
 * Material will use vertex colors only.
 * 
 * To enable textures:
 * 1. Add texture files to /public/textures/tiles/{colorway}/
 * 2. Uncomment the useTexture code below
 */
export function useTilePbrTextures(_colorway: TileColorway) {
  // Textures not available yet - return empty object
  // Material will fall back to vertex colors + clearcoat effect
  return {};
  
  /* Uncomment when textures are available:
  
  import { useTexture } from "@react-three/drei";
  import { useEffect } from "react";
  
  const base = `/textures/tiles/${colorway}`;
  const textures = useTexture({
    map: `${base}/albedo.jpg`,
    normalMap: `${base}/normal.jpg`,
    roughnessMap: `${base}/roughness.jpg`,
  });

  useEffect(() => {
    Object.values(textures).forEach((tex) => {
      if (!(tex instanceof THREE.Texture)) return;
      tex.colorSpace = tex === textures.map ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.needsUpdate = true;
    });
  }, [textures]);

  return textures;
  */
}
