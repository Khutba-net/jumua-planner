"use client";

import { useEffect, useRef } from "react";

/**
 * Reveals its children with a gentle rise + fade the first time they scroll
 * into view. Content is visible by default (SSR / no-JS / reduced-motion safe);
 * the effect only hides-then-reveals elements that start below the fold, driving
 * the animation directly on the DOM node so no re-render is triggered.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen at mount → leave visible, don't animate.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    // Below the fold: hide instantly (no transition), then reveal on scroll.
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    void el.offsetHeight; // force reflow so the reveal transitions
    el.style.transition = "";

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[800ms] ease-out ${className}`}
      style={{ transitionDelay: `${delay}ms`, willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
}
