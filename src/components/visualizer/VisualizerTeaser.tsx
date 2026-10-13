"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type RoomType = "living" | "bath" | "kitchen";

interface RoomOption {
  id: RoomType;
  label: string;
  image: string;
  tileName: string;
  tileFinish: string;
}

const ROOM_OPTIONS: RoomOption[] = [
  {
    id: "living",
    label: "Living Room",
    image: "/images/room-visualizer-preview.jpg",
    tileName: "Sandstone Glazed 20×20",
    tileFinish: "Satin Gloss",
  },
  {
    id: "bath",
    label: "Bathroom",
    image: "/images/room-bath-preview.jpg",
    tileName: "Sage Ceramic Zellige",
    tileFinish: "High Gloss Glaze",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    image: "/images/room-kitchen-preview.jpg",
    tileName: "Terracotta Brick Subway",
    tileFinish: "Handmade Matte",
  },
];

export function VisualizerTeaser() {
  const [activeRoom, setActiveRoom] = useState<RoomType>("living");
  const current = ROOM_OPTIONS.find((r) => r.id === activeRoom) || ROOM_OPTIONS[0];

  return (
    <div className="relative flex flex-col gap-3">
      {/* ── Room Selector Tabs ── */}
      <div className="flex items-center gap-2" role="tablist" aria-label="Visualizer rooms">
        {ROOM_OPTIONS.map((room) => {
          const isActive = activeRoom === room.id;
          return (
            <button
              key={room.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveRoom(room.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "bg-[#14262B] text-white shadow-sm"
                  : "bg-white/80 text-[#14262B]/80 hover:bg-white hover:text-[#14262B]"
              }`}
            >
              {room.label}
            </button>
          );
        })}
      </div>

      {/* ── Visualizer Preview Card ── */}
      <Link
        href={`/visualizer?room=${activeRoom}`}
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-200 shadow-md ring-1 ring-black/5 transition duration-300 hover:shadow-xl hover:ring-black/10"
      >
        {/* Render each image with smooth crossfade */}
        {ROOM_OPTIONS.map((room) => (
          <div
            key={room.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              activeRoom === room.id ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            }`}
          >
            <Image
              src={room.image}
              alt={`Clay & Co 3D Room Visualizer - ${room.label}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        ))}

        {/* Subtle glassmorphic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5 backdrop-blur-md text-white text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Interactive 3D Visualizer</span>
        </div>

        {/* Bottom Tile Info & Callout */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-wider text-white/80 font-medium">
              Featured Tile in Room
            </p>
            <p className="text-sm font-semibold tracking-wide drop-shadow-sm">
              {current.tileName}
            </p>
            <span className="inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
              {current.tileFinish}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#14262B] shadow-lg transition-transform duration-200 group-hover:translate-x-1">
            <span>Explore 3D</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
