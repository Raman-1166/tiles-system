"use client";

import { useEffect, useRef, useState } from "react";

type ModelViewerElement = HTMLElement & { activateAR: () => void; canActivateAR?: boolean };

export function ARButton({ modelUrl, label }: { modelUrl: string; label: string }) {
  const ref = useRef<ModelViewerElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    import("@google/model-viewer").then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      {/* model-viewer renders its own tiny canvas purely to power the AR session;
          our main viewer above handles the on-page 3D preview. */}
      {ready && (
        // @ts-expect-error -- custom element registered by @google/model-viewer
        <model-viewer
          ref={ref}
          src={modelUrl}
          alt={label}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls={false}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      )}
      <button
        onClick={() => ref.current?.activateAR()}
        disabled={!ready}
        className="inline-flex items-center gap-2 rounded-full border border-stone-400 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-900 disabled:opacity-50"
      >
        📱 View in your room (AR)
      </button>
    </div>
  );
}
