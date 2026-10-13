"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "checking" | "full" | "reduced";

type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function subscribe() {
  // Device tier doesn't change during a session, so we never need to notify subscribers
  return () => {};
}

function getDeviceTierSnapshot(): DeviceTier {
  if (typeof window === "undefined") return "checking";
  
  const nav = navigator as NavigatorExtras;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const saveData = !!nav.connection?.saveData;
  const lowCores = (nav.hardwareConcurrency ?? 8) < 4;
  const lowMemory = (nav.deviceMemory ?? 8) < 4;
  const hasWebGL = detectWebGL();

  const reduced = prefersReducedMotion || saveData || !hasWebGL || (lowCores && lowMemory);
  return reduced ? "reduced" : "full";
}

function getDeviceTierServerSnapshot(): DeviceTier {
  return "checking";
}

/**
 * Decides whether the visitor should get the full real-time 3D experience
 * ("full"), or a lightweight static fallback ("reduced") because they asked
 * for reduced motion, are on a low-powered device, or have no WebGL.
 */
export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(
    subscribe,
    getDeviceTierSnapshot,
    getDeviceTierServerSnapshot
  );
}

function getQualityScaleSnapshot(): number {
  if (typeof window === "undefined") return 1;
  
  const nav = navigator as NavigatorExtras;
  const cores = nav.hardwareConcurrency ?? 8;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (cores <= 4 || isCoarsePointer) return 0.55;
  else if (cores <= 6) return 0.8;
  else return 1;
}

function getQualityScaleServerSnapshot(): number {
  return 1;
}

/** Lower the instance/geometry budget for mid/low powered full-3D devices. */
export function useQualityScale(): number {
  return useSyncExternalStore(
    subscribe,
    getQualityScaleSnapshot,
    getQualityScaleServerSnapshot
  );
}
