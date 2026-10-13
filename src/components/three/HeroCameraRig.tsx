"use client";

import { useFrame } from "@react-three/fiber";
import { MutableRefObject } from "react";
import * as THREE from "three";

export function HeroCameraRig({ scrollProgressRef }: { scrollProgressRef: MutableRefObject<number> }) {
  useFrame((state) => {
    const sp = scrollProgressRef.current;
    const targetX = state.pointer.x * 0.9;
    const targetY = 0.3 + state.pointer.y * 0.5 + sp * 1.6;
    const targetZ = THREE.MathUtils.lerp(9, 16, sp);

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 4, 0.016);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 4, 0.016);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 4, 0.016);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}
