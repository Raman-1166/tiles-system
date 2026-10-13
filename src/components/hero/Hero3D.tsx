"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { MutableRefObject, Suspense } from "react";
import { HeroTileWall } from "@/components/three/HeroTileWall";
import { HeroCameraRig } from "@/components/three/HeroCameraRig";

export function Hero3D({
  scrollProgressRef,
  frameloop,
  quality,
}: {
  scrollProgressRef: MutableRefObject<number>;
  frameloop: "always" | "never";
  quality: number;
}) {
  const cols = quality > 0.9 ? 14 : quality > 0.7 ? 11 : 8;
  const rows = quality > 0.9 ? 9 : quality > 0.7 ? 7 : 6;

  return (
    <Canvas
      dpr={[1, Math.min(2, quality > 0.9 ? 2 : 1.5)]}
      frameloop={frameloop}
      camera={{ position: [0, 0.3, 9], fov: 42 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#e7e2d6"]} />
      <fog attach="fog" args={["#e7e2d6", 14, 26]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 6]} intensity={1.5} castShadow={false} />
      <directionalLight position={[-5, 2, 4]} intensity={0.5} color="#fff4e0" />
      <pointLight position={[0, -3, 5]} intensity={0.3} color="#ffffff" />
      <Suspense fallback={null}>
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 4, -0.2, 0]}>
            <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[0, 5, -5]} scale={[12, 6, 1]} />
            <Lightformer form="rect" intensity={1.5} color="#fff3e0" position={[-6, 2, 2]} scale={[8, 4, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#e6f0fa" position={[6, 2, 2]} scale={[8, 4, 1]} />
            <Lightformer form="circle" intensity={2} color="#ffffff" position={[0, -2, 4]} scale={5} />
          </group>
        </Environment>
        <HeroTileWall cols={cols} rows={rows} />
      </Suspense>
      <HeroCameraRig scrollProgressRef={scrollProgressRef} />
    </Canvas>
  );
}
