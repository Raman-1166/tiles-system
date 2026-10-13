"use client";

import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { ReactNode, Suspense } from "react";
import { useVisibleFrameloop } from "@/hooks/useVisibleFrameloop";

function LoaderOverlay() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-stone-100/80 backdrop-blur-sm">
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-stone-300">
        <div
          className="h-full rounded-full bg-stone-800 transition-[width] duration-150"
          style={{ width: `${Math.max(6, progress)}%` }}
        />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-stone-600">
        Loading 3D scene — {Math.round(progress)}%
      </p>
    </div>
  );
}

export function LazyScene({
  children,
  className,
  cameraPosition = [0, 0, 5],
  fov = 45,
  dpr = [1, 2],
  background,
  tabIndex,
  onFocusHint,
}: {
  children: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  dpr?: [number, number];
  background?: string;
  tabIndex?: number;
  onFocusHint?: boolean;
}) {
  const { ref, hasBeenVisible, frameloop } = useVisibleFrameloop<HTMLDivElement>(0.05);

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ""}`}
      style={background ? { background } : undefined}
      tabIndex={tabIndex}
    >
      {hasBeenVisible ? (
        <Canvas
          dpr={dpr}
          frameloop={frameloop}
          camera={{ position: cameraPosition, fov }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-stone-200 to-stone-300" />
      )}
      {hasBeenVisible && <LoaderOverlay />}
      {onFocusHint && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] text-white opacity-80">
          Click, then use arrow keys to rotate · +/- to zoom
        </div>
      )}
    </div>
  );
}
