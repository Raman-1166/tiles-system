"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  target?: [number, number, number];
  initialRadius: number;
  minRadius: number;
  maxRadius: number;
  initialAzimuth?: number;
  initialPolar?: number;
  minPolar?: number;
  maxPolar?: number;
  /** When false, keyboard rotate/zoom is ignored (e.g. viewer not focused). */
  keyboardEnabled?: boolean;
  autoRotate?: boolean;
};

/**
 * A compact, dependency-free orbit control: drag to rotate, wheel/pinch to
 * zoom, and arrow keys + "+"/"-" to rotate & zoom too (full keyboard support
 * for every 3D viewer, as drei's OrbitControls does not expose a public API
 * for keyboard-driven rotation).
 */
export function SimpleOrbitControls({
  target = [0, 0, 0],
  initialRadius,
  minRadius,
  maxRadius,
  initialAzimuth = 0.6,
  initialPolar = 1.2,
  minPolar = 0.35,
  maxPolar = Math.PI - 0.35,
  keyboardEnabled = true,
  autoRotate = false,
}: Props) {
  const { camera, gl } = useThree();
  const azimuth = useRef(initialAzimuth);
  const polar = useRef(initialPolar);
  const radius = useRef(initialRadius);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const targetVec = useRef(new THREE.Vector3(...target));

  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      azimuth.current -= dx * 0.006;
      polar.current = THREE.MathUtils.clamp(
        polar.current - dy * 0.006,
        minPolar,
        maxPolar
      );
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* no-op */
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius.current = THREE.MathUtils.clamp(
        radius.current + e.deltaY * 0.0025 * radius.current,
        minRadius,
        maxRadius
      );
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, minPolar, maxPolar, minRadius, maxRadius]);

  useEffect(() => {
    if (!keyboardEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const step = 0.08;
      switch (e.key) {
        case "ArrowLeft":
          azimuth.current -= step;
          e.preventDefault();
          break;
        case "ArrowRight":
          azimuth.current += step;
          e.preventDefault();
          break;
        case "ArrowUp":
          polar.current = THREE.MathUtils.clamp(polar.current - step, minPolar, maxPolar);
          e.preventDefault();
          break;
        case "ArrowDown":
          polar.current = THREE.MathUtils.clamp(polar.current + step, minPolar, maxPolar);
          e.preventDefault();
          break;
        case "+":
        case "=":
          radius.current = THREE.MathUtils.clamp(radius.current * 0.92, minRadius, maxRadius);
          e.preventDefault();
          break;
        case "-":
        case "_":
          radius.current = THREE.MathUtils.clamp(radius.current * 1.08, minRadius, maxRadius);
          e.preventDefault();
          break;
      }
    };
    const el = gl.domElement;
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [gl, keyboardEnabled, minPolar, maxPolar, minRadius, maxRadius]);

  useFrame((_, delta) => {
    if (autoRotate && !dragging.current) {
      azimuth.current += delta * 0.12;
    }
    const sinPolar = Math.sin(polar.current);
    const x = targetVec.current.x + radius.current * sinPolar * Math.sin(azimuth.current);
    const y = targetVec.current.y + radius.current * Math.cos(polar.current);
    const z = targetVec.current.z + radius.current * sinPolar * Math.cos(azimuth.current);
    camera.position.set(x, y, z);
    camera.lookAt(targetVec.current);
  });

  return null;
}
