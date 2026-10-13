"use client";

import { useGLTF, Html } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

export type FurnitureVariant = { name: string; colorHex: string; targetMesh: string };

export function FurnitureModel({
  modelUrl,
  variant,
  showDimensions,
  dimensions,
}: {
  modelUrl: string;
  variant: FurnitureVariant | null;
  showDimensions: boolean;
  dimensions: { width: number; height: number; depth: number } | null;
}) {
  const gltf = useGLTF(modelUrl, "/draco/");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = (obj.material as THREE.Material).clone();
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!variant) return;
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name.startsWith(variant.targetMesh)) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        mat.color.set(variant.colorHex);
      }
    });
  }, [scene, variant]);

  const box = useMemo(() => new THREE.Box3().setFromObject(scene), [scene]);
  const size = useMemo(() => box.getSize(new THREE.Vector3()), [box]);
  const center = useMemo(() => box.getCenter(new THREE.Vector3()), [box]);

  return (
    <group>
      <primitive object={scene} />
      {showDimensions && dimensions && (
        <group>
          <lineSegments position={center.toArray()}>
            <edgesGeometry args={[new THREE.BoxGeometry(size.x, size.y, size.z)]} />
            <lineBasicMaterial color="#e8734a" />
          </lineSegments>
          <Html position={[center.x, box.min.y - 0.04, box.max.z]} center distanceFactor={6}>
            <span className="whitespace-nowrap rounded bg-stone-900/85 px-1.5 py-0.5 text-[10px] text-white">
              W {dimensions.width} cm
            </span>
          </Html>
          <Html position={[box.max.x + 0.04, center.y, box.max.z]} center distanceFactor={6}>
            <span className="whitespace-nowrap rounded bg-stone-900/85 px-1.5 py-0.5 text-[10px] text-white">
              H {dimensions.height} cm
            </span>
          </Html>
          <Html position={[box.min.x, box.min.y - 0.04, center.z]} center distanceFactor={6}>
            <span className="whitespace-nowrap rounded bg-stone-900/85 px-1.5 py-0.5 text-[10px] text-white">
              D {dimensions.depth} cm
            </span>
          </Html>
        </group>
      )}
    </group>
  );
}
