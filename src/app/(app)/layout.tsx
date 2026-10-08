"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { I18nProvider, useI18n } from "@/lib/i18n";

const navKeys = [
  { href: "/dashboard", key: "nav.dashboard", icon: "dashboard" },
  { href: "/themes", key: "nav.annualPlan", icon: "calendar_month" },
  { href: "/sermons", key: "nav.sermons", icon: "description" },
  { href: "/calendar", key: "nav.calendar", icon: "event" },
  { href: "/resources", key: "nav.resources", icon: "menu_book" },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang, isAr } = useI18n();
  const [user, setUser] = useState<{ name: string; account_type: string; role: string; id?: string; is_platform_admin?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [subPlan, setSubPlan] = useState<string | null>(null);
  const [subIsOrgManaged, setSubIsOrgManaged] = useState(false);
  const [subOrgName, setSubOrgName] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; body: string; link: string | null; read: number; created_at: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [orgContext, setOrgContext] = useState<{ orgId: string; orgName: string; orgType: string; role: string; mosqueId: string | null; mosqueName: string | null } | null>(null);
  const [memberships, setMemberships] = useState<{ orgId: string; orgName: string; orgType: string; role: string; mosqueId: string | null; mosqueName: string | null }[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const planLabel = orgContext?.orgType === "institution" ? "Institution"
    : orgContext?.orgType === "organization" ? "Organization"
    : subPlan?.includes("institution") ? "Institution"
    : subPlan?.includes("organization") ? "Organization"
    : "Individual";

  const planColor = planLabel === "Institution" ? "bg-violet-100 text-violet-700"
    : planLabel === "Organization" ? "bg-blue-100 text-blue-700"
    : "bg-emerald-100 text-emerald-700";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { router.push("/auth/login"); return null; }
        if (r.status === 403) return r.json().then((d: { onboarding?: boolean }) => { if (d.onboarding === false) router.push("/setup"); return null; });
        return r.json();
      })
      .then((d) => {
        if (d) {
          setUser(d.user); setSubStatus(d.subscription?.status ?? "none"); setSubPlan(d.subscription?.plan ?? null); setSubIsOrgManaged(d.subscription?.isOrgManaged ?? false); setSubOrgName(d.subscription?.orgName ?? null); setOrgContext(d.orgContext ?? null); setMemberships(d.memberships ?? []);
          // Admin-only users without personal context: auto-switch to their first org
          const ms = d.memberships ?? [];
          const hasKhatibRole = ms.some((m: { role: string }) => m.role === "khatib");
          if (!d.orgContext && !hasKhatibRole && ms.length > 0 && ms.every((m: { role: string }) => m.role === "admin" || m.role === "mosque_admin")) {
            switchOrg(ms[0].orgId);
          }
        }
      })
      .catch(() => { router.push("/auth/login"); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/notifications?limit=15")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setNotifications(d.notifications); setUnreadCount(d.unreadCount); } })
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/notifications?limit=15")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) { setNotifications(d.notifications); setUnreadCount(d.unreadCount); } })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function switchOrg(orgId: string | null) {
    setSwitcherOpen(false);
    await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: orgId || "personal" }),
    });
    window.location.reload();
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    setUnreadCount(0);
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: 1 } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  useEffect(() => {
    if (!user) return;
    if (user.is_platform_admin === 1 && pathname === "/dashboard") {
      router.replace("/admin");
      return;
    }
    const isOrgAdmin = orgContext && (orgContext.role === "admin" || orgContext.role === "mosque_admin");
    const khatibOnlyRoutes = ["/sermons", "/themes", "/calendar", "/resources"];
    if (isOrgAdmin && khatibOnlyRoutes.some((r) => pathname.startsWith(r))) {
      router.push("/org/dashboard");
    }
    if (isOrgAdmin && pathname === "/dashboard") {
      router.replace("/org/dashboard");
    }
    if (orgContext?.role === "mosque_admin" && pathname.startsWith("/org/mosques")) {
      router.push("/org/dashboard");
    }
  }, [user, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center gap-4">
          <svg width="44" height="44" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="11" height="11" rx="2" fill="#1a5c57" opacity="0.9"/>
            <rect x="16" y="1" width="11" height="11" rx="2" fill="#1a5c57" opacity="0.6"/>
            <rect x="1" y="16" width="11" height="11" rx="2" fill="#1a5c57" opacity="0.6"/>
            <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
          </svg>
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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
          <span className="text-base font-bold tracking-tight">Khutba</span>
        </button>
        <div className="flex items-center gap-2">
          {user && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${planColor}`}>{planLabel}</span>
          )}
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative text-primary">
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {user?.name?.[0] ?? "?"}
          </div>
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
            <span className="text-lg font-bold tracking-tight">Khutba</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-mute">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Org Switcher */}
        {memberships.length > 0 && user?.is_platform_admin !== 1 && (
          <div ref={switcherRef} className="px-3 pt-3 relative">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-line/50 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base text-primary">
                {orgContext ? (orgContext.orgType === "institution" ? "account_balance" : "corporate_fare") : "person"}
              </span>
              <span className="flex-1 text-start font-medium text-ink truncate">
                {orgContext ? orgContext.orgName : (isAr ? "شخصي" : "Personal")}
              </span>
              <span className="material-symbols-outlined text-mute text-base">unfold_more</span>
            </button>
            {switcherOpen && (
              <div className={`absolute ${isAr ? "right-3" : "left-3"} top-full mt-1 w-[calc(100%-1.5rem)] bg-white border border-line rounded-xl shadow-lg z-50 py-1`}>
                <button
                  onClick={() => switchOrg(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface transition-colors ${!orgContext ? "text-primary font-semibold" : "text-ink"}`}
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  <span className="truncate">{isAr ? "شخصي" : "Personal"}</span>
                  {!orgContext && <span className="material-symbols-outlined text-primary text-sm ml-auto">check</span>}
                </button>
                {memberships.map((m) => (
                  <button
                    key={m.orgId}
                    onClick={() => switchOrg(m.orgId)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface transition-colors ${orgContext?.orgId === m.orgId ? "text-primary font-semibold" : "text-ink"}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {m.orgType === "institution" ? "account_balance" : "corporate_fare"}
                    </span>
                    <div className="flex-1 min-w-0 text-start">
                      <span className="truncate block">{m.orgName}</span>
                      {m.mosqueName && <span className="text-[10px] text-mute block truncate">{m.mosqueName}</span>}
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.role === "admin" ? "bg-blue-100 text-blue-700" : m.role === "mosque_admin" ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {m.role === "admin" ? "Admin" : m.role === "mosque_admin" ? "Mosque Admin" : "Khatib"}
                    </span>
                    {orgContext?.orgId === m.orgId && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {user?.is_platform_admin === 1 ? (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-mute hover:bg-surface hover:text-ink"
              }`}
            >
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              Admin Dashboard
            </Link>
          ) : orgContext && (orgContext.role === "admin" || orgContext.role === "mosque_admin") ? (
            // Org admin view — show org nav only
            <>
              <p className="px-4 text-[10px] font-bold text-mute uppercase tracking-wider mb-1">{orgContext.role === "mosque_admin" ? t("nav.mosque") || "Mosque" : t("nav.organization")}</p>
              {(orgContext.role === "admin" ? [
                { href: "/org/dashboard", key: "nav.orgDashboard", icon: "monitoring" },
                ...(orgContext.orgType === "institution" ? [{ href: "/org/mosques", key: "nav.mosques", icon: "mosque" }] : []),
                { href: "/org/schedule", key: "nav.schedule", icon: "date_range" },
                { href: "/org/khatibs", key: "nav.khatibs", icon: "group" },
              ] : [
                { href: "/org/dashboard", key: "nav.orgDashboard", icon: "monitoring" },
                { href: "/org/schedule", key: "nav.schedule", icon: "date_range" },
                { href: "/org/khatibs", key: "nav.khatibs", icon: "group" },
              ]).map((item) => {
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
          ) : (
            // Personal / khatib view — show khatib nav + org schedule if in org context
            <>
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
              {orgContext && orgContext.role === "khatib" && (
                <>
                  <div className="h-px bg-line my-2" />
                  <p className="px-4 text-[10px] font-bold text-mute uppercase tracking-wider mb-1">{orgContext.orgName}</p>
                  <Link
                    href="/org/schedule"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith("/org/schedule")
                        ? "bg-primary/10 text-primary"
                        : "text-mute hover:bg-surface hover:text-ink"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">date_range</span>
                    {t("nav.schedule")}
                  </Link>
                  {orgContext.mosqueName && (
                    <p className="px-4 text-[10px] text-mute mt-1">
                      <span className="material-symbols-outlined text-xs align-middle mr-1">mosque</span>
                      {orgContext.mosqueName}
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-line flex flex-col gap-1">
          {/* Notifications */}
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-mute hover:bg-surface hover:text-ink transition-all w-full text-start relative"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {isAr ? "الإشعارات" : "Notifications"}
            {unreadCount > 0 && (
              <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
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
              <div className="flex items-center gap-1.5">
                {user && user.is_platform_admin !== 1 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${planColor}`}>{planLabel}</span>
                )}
                {user?.is_platform_admin === 1 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Platform Admin</span>
                )}
                {subIsOrgManaged && user?.role !== "admin" && (
                  <span className="text-[9px] text-mute">via {subOrgName || "org"}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main data-app-main className={`relative flex-1 min-w-0 min-h-screen pt-14 lg:pt-0 ${isAr ? "font-[var(--font-arabic)]" : ""}`}>
        {subStatus && subStatus !== "active" && subStatus !== "trialing" && !pathname.startsWith("/settings") && !pathname.startsWith("/admin") && user?.is_platform_admin !== 1 && (
          <div className="absolute inset-0 z-40 bg-white flex items-center justify-center p-6">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-accent-gold text-3xl">lock</span>
              </div>
              {subIsOrgManaged && user?.role !== "admin" ? (
                <>
                  <h2 className="text-xl font-bold text-ink mb-2">
                    {isAr ? "الوصول محدود" : "Access Restricted"}
                  </h2>
                  <p className="text-ink/60 text-sm mb-6">
                    {isAr
                      ? `خطتك تدار بواسطة ${subOrgName || "مؤسستك"}. تواصل مع المسؤول لتجديد الاشتراك.`
                      : `Your plan is managed by ${subOrgName || "your organization"}. Contact your admin to renew the subscription.`}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-ink mb-2">
                    {isAr ? "اشترك للمتابعة" : "Subscribe to Continue"}
                  </h2>
                  <p className="text-ink/60 text-sm mb-6">
                    {isAr
                      ? "اشتراكك غير نشط. اشترك لاستعادة الوصول إلى جميع الميزات."
                      : "Your subscription is inactive. Subscribe to regain access to all features."}
                  </p>
                  <Link
                    href="/settings?tab=subscription"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-full hover:bg-secondary transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-lg">credit_card</span>
                    {isAr ? "إدارة الاشتراك" : "Manage Subscription"}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
        {(subStatus === "active" || subStatus === "trialing" || user?.is_platform_admin === 1 || pathname.startsWith("/settings") || pathname.startsWith("/admin")) && children}

        {/* Notification dropdown */}
        {notifOpen && (
          <div ref={notifRef} className={`fixed top-14 ${isAr ? "left-4" : "right-4"} lg:top-4 w-80 max-h-[28rem] bg-white border border-line shadow-xl z-50 flex flex-col`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <p className="text-sm font-bold text-ink">{isAr ? "الإشعارات" : "Notifications"}</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
                  {isAr ? "تحديد الكل كمقروء" : "Mark all read"}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <span className="material-symbols-outlined text-mute text-3xl mb-2 block">notifications_none</span>
                  <p className="text-xs text-mute">{isAr ? "لا توجد إشعارات" : "No notifications yet"}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markOneRead(n.id);
                      if (n.link) { setNotifOpen(false); router.push(n.link); }
                    }}
                    className={`w-full text-start px-4 py-3 border-b border-line/50 hover:bg-surface transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-mute mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[10px] text-mute/60 mt-1">{new Date(n.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
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
