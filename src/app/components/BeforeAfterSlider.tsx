"use client";

import { useState, useRef, useCallback } from "react";

export default function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto aspect-[16/10] select-none cursor-col-resize overflow-hidden rounded-2xl shadow-xl border border-line/30"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* After image (full, behind) */}
      <img
        src="/after.png"
        alt="With JumuaPlanner — organized sermon editor"
        className="absolute inset-0 w-full h-full object-cover object-top"
        draggable={false}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src="/before.png"
          alt="Without a plan — scattered notes and chaos"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100vw", maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary/30">
          <span className="material-symbols-outlined text-primary text-lg">drag_indicator</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full z-20 pointer-events-none">
        Without a plan
      </div>
      <div className="absolute top-4 right-4 bg-primary/90 text-white text-xs font-bold px-3 py-1.5 rounded-full z-20 pointer-events-none">
        With JumuaPlanner
      </div>
    </div>
  );
}
