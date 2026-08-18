"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { I18nProvider, useI18n } from "@/lib/i18n";

const navKeys = [
  { href: "/dashboard", key: "nav.dashboard", icon: "dashboard" },
  { href: "/sermons", key: "nav.sermons", icon: "description" },
  { href: "/themes", key: "nav.annualPlan", icon: "calendar_month" },
  { href: "/calendar", key: "nav.calendar", icon: "event" },
  { href: "/resources", key: "nav.resources", icon: "menu_book" },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang, isAr } = useI18n();
  const [user, setUser] = useState<{ name: string; account_type: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (r.status === 401) { router.push("/auth/login"); return null; }
        if (r.status === 403) return r.json().then((d: { onboarding?: boolean }) => { if (d.onboarding === false) router.push("/setup"); return null; });
        return r.json();
      })
      .then((d) => { if (d) setUser(d.user); })
      .catch(() => { router.push("/auth/login"); });
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-cream-bg flex" dir={isAr ? "rtl" : "ltr"}>
      {/* Mobile top bar */}
      <div data-app-topbar className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-line flex items-center justify-between px-4 py-3 lg:hidden`}>
        <button onClick={() => setSidebarOpen(true)} className="text-primary">
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-primary">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="11" height="11" rx="2" fill="currentColor" opacity="0.9"/>
            <rect x="16" y="1" width="11" height="11" rx="2" fill="currentColor" opacity="0.6"/>
            <rect x="1" y="16" width="11" height="11" rx="2" fill="currentColor" opacity="0.6"/>
            <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
          </svg>
          <span className="text-base font-bold tracking-tight">JumuaPlanner</span>
        </button>
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
          {user?.name?.[0] ?? "?"}
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside data-app-sidebar className={`
        fixed top-0 ${isAr ? "right-0" : "left-0"} h-full z-50 w-64 bg-white ${isAr ? "border-l" : "border-r"} border-line flex flex-col shrink-0
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : isAr ? "translate-x-full" : "-translate-x-full"}
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2.5 text-primary">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="11" height="11" rx="2" fill="currentColor" opacity="0.9"/>
              <rect x="16" y="1" width="11" height="11" rx="2" fill="currentColor" opacity="0.6"/>
              <rect x="1" y="16" width="11" height="11" rx="2" fill="currentColor" opacity="0.6"/>
              <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
            </svg>
            <span className="text-lg font-bold tracking-tight">JumuaPlanner</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-mute">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navKeys.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-mute hover:bg-surface hover:text-ink"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {t(item.key)}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <>
              <div className="h-px bg-line my-2" />
              <p className="px-4 text-[10px] font-bold text-mute uppercase tracking-wider mb-1">{t("nav.organization")}</p>
              {[
                { href: "/org/dashboard", key: "nav.orgDashboard", icon: "monitoring" },
                { href: "/org/khatibs", key: "nav.khatibs", icon: "group" },
              ].map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-mute hover:bg-surface hover:text-ink"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    {t(item.key)}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-line flex flex-col gap-1">
          {/* Language toggle */}
          <button
            onClick={() => setLang(isAr ? "en" : "ar")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-mute hover:bg-surface hover:text-ink transition-all w-full text-start"
          >
            <span className="material-symbols-outlined text-xl">translate</span>
            {isAr ? "English" : "العربية"}
          </button>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith("/settings")
                ? "bg-primary/10 text-primary"
                : "text-mute hover:bg-surface hover:text-ink"
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            {t("nav.settings")}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-mute hover:bg-surface hover:text-ink transition-all w-full text-start"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            {t("nav.signOut")}
          </button>
          <div className="flex items-center gap-3 px-4 py-3 mt-2">
            <div data-sidebar-avatar className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold overflow-hidden">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p data-sidebar-name className="text-sm font-semibold text-ink truncate">{user?.name ?? "Loading..."}</p>
              <p className="text-xs text-mute truncate capitalize">{user?.account_type ?? ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main data-app-main className={`flex-1 min-w-0 min-h-screen pt-14 lg:pt-0 ${isAr ? "font-[var(--font-arabic)]" : ""}`}>
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppShell>{children}</AppShell>
    </I18nProvider>
  );
}
