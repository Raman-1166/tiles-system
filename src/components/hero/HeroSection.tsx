"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useDeviceTier, useQualityScale } from "@/hooks/useDeviceTier";
import { useVisibleFrameloop } from "@/hooks/useVisibleFrameloop";

const Hero3D = dynamic(() => import("./Hero3D").then((m) => m.Hero3D), { ssr: false });

function ChalkPanel({ panelRef }: { panelRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={panelRef}
      className="pointer-events-none absolute inset-0 z-20 flex items-center"
    >
      <div className="chalk-texture pointer-events-auto mx-6 w-full max-w-xl rounded-2xl border border-white/10 bg-[#2e2a26]/92 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:ml-14 sm:p-10">
        <p className="m-0 font-mono text-xs uppercase tracking-[0.35em] text-amber-100/70">
          Clay &amp; Co.
        </p>
        <h1
          className="mt-4 text-[2.6rem] leading-[1.05] text-[#faf6ee] sm:text-[3.6rem]"
          style={{ fontFamily: "var(--font-chalk)", textShadow: "0 0 18px rgba(255,255,255,0.12)" }}
        >
          Tiles you can turn.
        </h1>
        <p className="mt-4 max-w-sm text-base text-stone-200/90">
          Thick, glazed ceramic tiles that catch the light from every angle — flip
          through our studio wall, then bring the glaze home.
        </p>
        <Link
          href="/shop?category=tile"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-100 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-stone-900 transition hover:bg-white"
        >
          Shop tiles
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressRef = useRef(0);
  const tier = useDeviceTier();
  const quality = useQualityScale();
  const { ref: viewportRef, frameloop } = useVisibleFrameloop<HTMLDivElement>(0.01);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        scrollProgressRef.current = progress;
        if (panelRef.current) {
          panelRef.current.style.opacity = String(Math.max(0, 1 - progress * 1.6));
          panelRef.current.style.transform = `translateY(${progress * -40}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[220vh] bg-stone-200">
      <div ref={viewportRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {tier === "full" ? (
          <Hero3D scrollProgressRef={scrollProgressRef} frameloop={frameloop} quality={quality} />
        ) : (
          <div className="absolute inset-0">
            <Image
              src="/images/hero-fallback.jpg"
              alt="Wall of glossy ceramic tiles, some flipped open in a diagonal wave pattern"
              fill
              priority
              className="object-cover"
            />
          </div>
        )}
        <ChalkPanel panelRef={panelRef} />
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-stone-700/70">
          Scroll to pull back
        </div>
      </div>
    </section>
  );
}
