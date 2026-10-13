"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a container is scrolled into view AND whether the browser
 * tab is currently visible, so a <Canvas frameloop={...}> can stop rendering
 * entirely when neither is true (saves battery + keeps other tabs smooth).
 */
export function useVisibleFrameloop<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenVisible(true);
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const frameloop: "always" | "never" = inView && tabVisible ? "always" : "never";

  return { ref, inView, hasBeenVisible, tabVisible, frameloop };
}
