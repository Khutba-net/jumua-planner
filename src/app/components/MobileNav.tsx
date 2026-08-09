"use client";

import { useState } from "react";

const links = [
  { href: "#annual-plan", label: "Annual Plan" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center text-primary"
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-2xl">
          {open ? "close" : "menu"}
        </span>
      </button>

      {open && (
        <div className="fixed top-[52px] left-0 right-0 z-[100] border-b border-line shadow-lg" style={{ background: "#FAF7F2" }}>
          <nav className="flex flex-col px-6 py-4 gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-primary/70 font-medium text-base py-3 border-b border-line/50 last:border-0 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
