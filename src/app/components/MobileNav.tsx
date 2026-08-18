"use client";

import { useState } from "react";

const links = {
  en: [
    { href: "#framework", label: "Plan" },
    { href: "#objectives", label: "Prepare" },
    { href: "#pricing", label: "Pricing" },
  ],
  ar: [
    { href: "#framework", label: "الخطة" },
    { href: "#objectives", label: "الإعداد" },
    { href: "#pricing", label: "الأسعار" },
  ],
};

export default function MobileNav({ lang = "en" }: { lang?: "en" | "ar" }) {
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
            {(links[lang] || links.en).map((l) => (
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
