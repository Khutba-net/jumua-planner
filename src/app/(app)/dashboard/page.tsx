"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUpcomingHijriEvents, getHijriDateString, isEidDate, type ResolvedHijriEvent } from "@/lib/hijri-events";
import { useI18n } from "@/lib/i18n";

interface DashboardData {
  user: { name: string; account_type: string; email: string; role: string };
  stats: {
    total: number;
    drafts: number;
    ready: number;
    delivered: number;
    totalWords: number;
  };
  recentSermons: {
    id: string;
    title: string;
    status: string;
    content: string | null;
    scheduled_date: string | null;
    updated_at: string;
    theme_name: string | null;
    theme_color: string | null;
  }[];
  upcomingSermons: {
    id: string;
    title: string;
    scheduled_date: string | null;
    status: string;
    theme_name: string | null;
  }[];
  thisFriday: {
    date: string;
    sermon: {
      id: string;
      title: string;
      status: string;
      scheduled_date: string;
      content: string | null;
      theme_name: string | null;
      theme_color: string | null;
    } | null;
  };
  lastFriday: {
    date: string;
    sermon: { id: string; title: string; status: string; scheduled_date: string };
  } | null;
  backlogCount: number;
  backlogSermons: {
    id: string;
    title: string;
    status: string;
    scheduled_date: string;
    theme_name: string | null;
  }[];
  seasons: {
    label: string;
    themes: string[];
    totalSermons: number;
    deliveredSermons: number;
    progress: number;
    isCurrent: boolean;
  }[];
  checklist: {
    themes: { done: number; total: number };
    subTopics: { done: number; total: number };
    titles: { done: number; total: number };
    delivered: { done: number; total: number };
    reviewed: { done: number; total: number };
  };
  planningYear: number;
  orgName: string | null;
  myAssignments: { friday_date: string; notes: string | null }[];
  nextYearPrompt: { nextYear: number; hasThemes: boolean } | null;
}

const statusDot: Record<string, string> = {
  draft: "bg-mute/40",
  ready: "bg-green-500",
  delivered: "bg-primary",
  archived: "bg-mute/30",
  skipped: "bg-amber-400",
};

function wordCount(text: string | null) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const seasonIcon: Record<string, string> = {
  "Season 1": "looks_one",
  "Season 2": "looks_two",
  "Season 3": "looks_3",
  "Season 4": "looks_4",
};

export default function DashboardPage() {
  const router = useRouter();
  const { t, isAr, lang } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"friday" | "eid" | "talk" | "other">("friday");
  const [creating, setCreating] = useState(false);
  const [feedbackSermonId, setFeedbackSermonId] = useState<string | null>(null);
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackAttendance, setFeedbackAttendance] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const hijriEvents = useMemo(() => getUpcomingHijriEvents(5), []);

  const statusLabel: Record<string, string> = {
    draft: t("status.draft"),
    ready: t("status.ready"),
    delivered: t("status.delivered"),
    archived: t("status.archived"),
    skipped: t("status.skipped"),
  };

  useEffect(() => {
    function fetchDashboard() {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
    fetchDashboard();
    window.addEventListener("focus", fetchDashboard);
    return () => window.removeEventListener("focus", fetchDashboard);
  }, []);

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("dash.justNow");
    if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isAr ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isAr ? `منذ ${days} ي` : `${days}d ago`;
  }

  function getFridayLabel(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const friday = new Date(dateStr + "T00:00:00");
    const diffDays = Math.round((friday.getTime() - today.getTime()) / 86400000);
    if (diffDays === 0) return t("dash.today");
    if (diffDays === 1) return t("dash.tomorrow");
    return t("dash.thisFriday");
  }

  function getDayContext(): string | null {
    const day = new Date().getDay();
    if (day === 5) return t("dash.ctxFriday");
    if (day === 4) return t("dash.ctxThursday");
    if (day === 6) return t("dash.ctxSaturday");
    const daysUntil = (5 - day + 7) % 7;
    return `${daysUntil} ${t("dash.ctxMidWeek")}`;
  }

  function formatDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function formatShortDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
    });
  }

  async function handleCreateSermon() {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), type: newType }),
    });
    const sermon = await res.json();
    setCreating(false);
    setShowNewForm(false);
    setNewTitle("");
    setNewType("friday");
    router.push(`/sermons/${sermon.id}/edit`);
  }

  function openNewForm() {
    setShowNewForm(true);
    setNewTitle("");
    setNewType("friday");
  }

  async function handleEmergencySwap() {
    if (!data?.thisFriday.sermon) return;
    setSwapping(true);
    await fetch(`/api/sermons/${data.thisFriday.sermon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    const res = await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "",
        type: "friday",
        scheduledDate: data.thisFriday.date,
      }),
    });
    const newSermon = await res.json();
    setSwapping(false);
    setShowSwapConfirm(false);
    router.push(`/sermons/${newSermon.id}/edit`);
  }

  async function handleQuickLog(sermonId: string, status: "delivered" | "archived" | "skipped") {
    setLoggingId(sermonId);
    await fetch(`/api/sermons/${sermonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setData((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        backlogSermons: prev.backlogSermons.filter((s) => s.id !== sermonId),
        backlogCount: prev.backlogCount - 1,
        stats: {
          ...prev.stats,
          delivered: status === "delivered" ? prev.stats.delivered + 1 : prev.stats.delivered,
        },
      };
      if (prev.lastFriday?.sermon.id === sermonId) {
        updated.lastFriday = null;
      }
      return updated;
    });
    setLoggingId(null);
    if (status === "delivered") {
      setFeedbackSermonId(sermonId);
      setFeedbackRating(0);
      setFeedbackAttendance("");
      setFeedbackComment("");
    }
  }

  async function handleFeedbackSubmit() {
    if (!feedbackSermonId) return;
    setFeedbackSaving(true);
    await fetch(`/api/sermons/${feedbackSermonId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: feedbackRating || null,
        attendance: feedbackAttendance ? Number(feedbackAttendance) : null,
        comment: feedbackComment || null,
      }),
    });
    setFeedbackSaving(false);
    setFeedbackSermonId(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-mute">{t("dash.loading")}</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-full text-mute">{t("dash.failedToLoad")}</div>;
  }

  const { user, stats, recentSermons, upcomingSermons, thisFriday, lastFriday, backlogCount, backlogSermons, seasons, checklist, orgName, myAssignments, nextYearPrompt } = data;
  const isOrgAdmin = user.role === "admin" && user.account_type !== "individual";
  const eidOnFriday = isEidDate(thisFriday.date);

  const seasonLabelMap: Record<string, string> = {
    "Season 1": t("season.1"),
    "Season 2": t("season.2"),
    "Season 3": t("season.3"),
    "Season 4": t("season.4"),
  };

  const checklistSteps = [
    { key: "themes", label: t("dash.mainThemes"), ...checklist.themes, href: "/themes" },
    { key: "subTopics", label: t("dash.subBouquets"), ...checklist.subTopics, href: "/themes" },
    { key: "titles", label: t("dash.sermonTitles"), ...checklist.titles, href: "/sermons" },
    { key: "delivered", label: t("status.delivered"), ...checklist.delivered, href: null },
    { key: "reviewed", label: t("dash.feedbackLogged"), ...checklist.reviewed, href: null },
  ];
  const totalDone = checklistSteps.reduce((s, c) => s + c.done, 0);
  const totalTarget = checklistSteps.reduce((s, c) => s + c.total, 0);
  const overallPercent = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-lg text-ink">
              {t("dash.greeting")}{" "}
              <span className="text-primary font-semibold">{user.name}</span>
            </p>
            <p className="text-sm text-mute mt-0.5">
              {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            {getDayContext() && (
              <p className="text-xs text-accent-gold font-medium mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">mosque</span>
                {getDayContext()}
              </p>
            )}
          </div>
          {!isOrgAdmin && (
            <div className="flex gap-2">
              <Link
                href="/themes"
                className="px-4 py-2 border border-line bg-white text-ink text-sm font-medium hover:bg-surface transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                {t("dash.yearPlan")}
              </Link>
              <button
                onClick={openNewForm}
                className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors"
              >
                {t("dash.newSermon")}
              </button>
            </div>
          )}
        </div>

        {isOrgAdmin && (
          <div className="bg-white border border-line p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {data.user.account_type === "institution" ? t("org.institutionDashboard") : t("dash.adminDashboard")}
                </p>
                <p className="text-xs text-mute">
                  {data.user.account_type === "institution" ? t("org.institutionDesc") : t("dash.adminDesc")}
                </p>
              </div>
            </div>
            <div className={`grid grid-cols-1 ${data.user.account_type === "institution" ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-3`}>
              <Link href="/org/dashboard" className="bg-surface border border-line/50 p-4 hover:bg-primary/5 transition-colors flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">monitoring</span>
                <span className="text-sm font-medium text-ink">{t("nav.orgDashboard")}</span>
              </Link>
              {data.user.account_type === "institution" && (
                <Link href="/org/mosques" className="bg-surface border border-line/50 p-4 hover:bg-primary/5 transition-colors flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">mosque</span>
                  <span className="text-sm font-medium text-ink">{t("nav.mosques")}</span>
                </Link>
              )}
              <Link href="/org/schedule" className="bg-surface border border-line/50 p-4 hover:bg-primary/5 transition-colors flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">date_range</span>
                <span className="text-sm font-medium text-ink">{t("nav.schedule")}</span>
              </Link>
              <Link href="/org/khatibs" className="bg-surface border border-line/50 p-4 hover:bg-primary/5 transition-colors flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">group</span>
                <span className="text-sm font-medium text-ink">{t("nav.khatibs")}</span>
              </Link>
            </div>
          </div>
        )}

        {/* New Sermon Form */}
        {!isOrgAdmin && showNewForm && (
          <div className="bg-white border border-line p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink">{t("dash.newSermonTitle")}</p>
              <button onClick={() => setShowNewForm(false)} className="text-mute hover:text-ink transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <input
              type="text"
              placeholder={t("dash.sermonTitle")}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateSermon(); }}
              autoFocus
              className="w-full px-3 py-2 border border-line text-sm text-ink bg-white mb-4 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-mute mb-2">{t("dash.type")}</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {([
                { value: "friday" as const, label: t("dash.friday"), icon: "mosque" },
                { value: "eid" as const, label: t("dash.eid"), icon: "auto_awesome" },
                { value: "talk" as const, label: t("dash.talk"), icon: "mic" },
                { value: "other" as const, label: t("dash.other"), icon: "note" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNewType(opt.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 border text-xs font-medium transition-colors ${
                    newType === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-line text-mute hover:bg-surface hover:text-ink"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-mute mb-4">
              {newType === "friday" ? t("dash.fridayDesc") : t("dash.standaloneDesc")}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 border border-line text-sm text-mute hover:bg-surface transition-colors"
              >
                {t("dash.cancel")}
              </button>
              <button
                onClick={handleCreateSermon}
                disabled={!newTitle.trim() || creating}
                className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {creating ? t("dash.creating") : t("dash.createSermon")}
              </button>
            </div>
          </div>
        )}

        {!isOrgAdmin && (<>
        {/* This Friday Banner */}
        {thisFriday.sermon ? (
          <Link
            href={`/sermons/${thisFriday.sermon.id}/edit`}
            className="block bg-primary/5 border border-primary/15 p-5 mb-4 hover:bg-primary/8 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-primary text-lg">mosque</span>
                  <span className="text-xs font-semibold text-primary">{getFridayLabel(thisFriday.date)}</span>
                  <span className="text-xs text-mute">{formatDate(thisFriday.date)}</span>
                  {eidOnFriday && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 tracking-wide">
                      {t("dash.eidFriday")}
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-ink truncate">{thisFriday.sermon.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[thisFriday.sermon.status] ?? statusDot.draft}`} />
                    <span className="text-xs text-mute">{statusLabel[thisFriday.sermon.status] ?? thisFriday.sermon.status}</span>
                  </span>
                  {thisFriday.sermon.theme_name && (
                    <span className="text-xs text-accent-gold font-medium">{thisFriday.sermon.theme_name}</span>
                  )}
                  <span className="text-xs text-mute">{wordCount(thisFriday.sermon.content)} {t("dash.words")}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="material-symbols-outlined text-primary/40 group-hover:text-primary/60 transition-colors text-xl">arrow_forward</span>
                <button
                  onClick={(e) => { e.preventDefault(); setShowSwapConfirm(true); }}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-0.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                  {t("dash.swapSermon")}
                </button>
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-surface border border-line p-5 mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-mute text-lg">mosque</span>
              <span className="text-xs font-semibold text-mute">{getFridayLabel(thisFriday.date)}</span>
              <span className="text-xs text-mute">{formatDate(thisFriday.date)}</span>
            </div>
            <p className="text-sm text-mute mb-3">{t("dash.noSermonPlanned")}</p>
            <button
              onClick={openNewForm}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t("dash.planSermon")}
            </button>
          </div>
        )}

        {/* Eid Friday Banner */}
        {eidOnFriday && (
          <div className="bg-amber-50 border border-amber-200 p-4 mb-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5">celebration</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {t("dash.eidFriday")} — {isAr ? eidOnFriday.nameAr : eidOnFriday.name}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">{t("dash.eidFridayNote")}</p>
              <button
                onClick={() => { setNewType("eid"); openNewForm(); }}
                className="mt-2 text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                {t("dash.createEidSermon")}
              </button>
            </div>
          </div>
        )}

        {/* My Assigned Fridays (for org khatibs) */}
        {myAssignments && myAssignments.length > 0 && (
          <div className="bg-white border border-line p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">event</span>
              <p className="text-sm font-semibold text-ink">{t("org.myAssignments")}</p>
              {orgName && (
                <span className="text-[11px] text-mute font-medium bg-surface px-2 py-0.5 rounded">{orgName}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {myAssignments.map((a) => {
                const isThisWeek = a.friday_date === thisFriday.date;
                return (
                  <div
                    key={a.friday_date}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                      isThisWeek ? "border-primary/20 bg-primary/5" : "border-line"
                    }`}
                  >
                    <span className="text-xs font-semibold text-primary whitespace-nowrap min-w-[42px]">
                      {new Date(a.friday_date + "T00:00:00").toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "short" }).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink">
                        {new Date(a.friday_date + "T00:00:00").toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                      {a.notes && <p className="text-[11px] text-mute mt-0.5">{a.notes}</p>}
                    </div>
                    {isThisWeek && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t("org.thisWeekLabel")}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Last Friday Logging Prompt */}
        {lastFriday && (
          <div className="bg-accent-gold/5 border border-accent-gold/20 p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-accent-gold text-xl">pending_actions</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">
                  {t("dash.howDidItGo")} <span className="font-semibold">&quot;{lastFriday.sermon.title}&quot;</span> {t("dash.goLastFriday")}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 mt-3 ${isAr ? "pr-9" : "pl-9"}`}>
              <button
                onClick={() => handleQuickLog(lastFriday.sermon.id, "delivered")}
                disabled={loggingId === lastFriday.sermon.id}
                className="px-3 py-1.5 bg-primary text-white text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {t("dash.delivered")}
              </button>
              <button
                onClick={() => handleQuickLog(lastFriday.sermon.id, "skipped")}
                disabled={loggingId === lastFriday.sermon.id}
                className="px-3 py-1.5 border border-line text-mute text-xs font-medium hover:bg-surface transition-colors disabled:opacity-50"
              >
                {t("dash.skipped")}
              </button>
              <Link
                href={`/sermons/${lastFriday.sermon.id}/edit`}
                className={`px-3 py-1.5 text-xs text-primary font-medium hover:underline ${isAr ? "mr-auto" : "ml-auto"}`}
              >
                {t("dash.openSermon")}
              </Link>
            </div>
          </div>
        )}

        {/* Backlog Warning */}
        {backlogCount > 0 && (
          <div className="bg-red-50 border border-red-200 mb-4">
            <button
              onClick={() => setBacklogOpen(!backlogOpen)}
              className="flex items-center gap-3 p-4 w-full text-start hover:bg-red-100/40 transition-colors"
            >
              <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">
                  {backlogCount} {backlogCount === 1 ? t("dash.pastNotLoggedSingle") : t("dash.pastNotLogged")}
                </p>
              </div>
              <span className={`material-symbols-outlined text-red-300 text-lg transition-transform duration-200 ${backlogOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>
            {backlogOpen && (
              <div className="border-t border-red-200 divide-y divide-red-100">
                {data.backlogSermons.map((sermon) => (
                  <div key={sermon.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{sermon.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-mute">
                          {formatShortDate(sermon.scheduled_date)}
                        </span>
                        {sermon.theme_name && (
                          <>
                            <span className="text-mute/30">&middot;</span>
                            <span className="text-[11px] text-accent-gold">{sermon.theme_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleQuickLog(sermon.id, "delivered")}
                        disabled={loggingId === sermon.id}
                        className="px-2.5 py-1 bg-primary text-white text-[11px] font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        {t("dash.delivered")}
                      </button>
                      <button
                        onClick={() => handleQuickLog(sermon.id, "skipped")}
                        disabled={loggingId === sermon.id}
                        className="px-2.5 py-1 border border-line bg-white text-mute text-[11px] font-medium hover:bg-surface transition-colors disabled:opacity-50"
                      >
                        {t("dash.skipped")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: t("dash.totalSermons"), value: stats.total, icon: "description" },
            { label: t("dash.drafts"), value: stats.drafts, icon: "edit_note" },
            { label: t("dash.readyToDeliver"), value: stats.ready, icon: "check_circle" },
            { label: t("status.delivered"), value: stats.delivered, icon: "event_available" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-line px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-base">
                    {stat.icon}
                  </span>
                </div>
                <p className="text-xs text-mute">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold text-ink ${isAr ? "pr-9" : "pl-9"}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent sermons */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-ink">{t("dash.recentSermons")}</p>
          <Link href="/sermons" className="text-xs text-primary font-semibold hover:underline">
            {t("dash.viewAll")}
          </Link>
        </div>

        {recentSermons.length === 0 ? (
          <div className="bg-white border border-line p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-line mb-3 block">description</span>
            <p className="text-mute mb-4">{t("dash.noSermons")}</p>
            <button
              onClick={openNewForm}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
            >
              {t("dash.newSermon")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentSermons.map((sermon) => (
              <Link
                key={sermon.id}
                href={`/sermons/${sermon.id}/edit`}
                className="bg-white border border-line px-5 py-4 cursor-pointer hover:shadow-sm transition-shadow block group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[sermon.status] ?? statusDot.draft}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{sermon.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-mute">{statusLabel[sermon.status] ?? sermon.status}</span>
                        {sermon.theme_name && (
                          <>
                            <span className="text-mute/30">&middot;</span>
                            <span className="text-xs text-accent-gold">{sermon.theme_name}</span>
                          </>
                        )}
                        {sermon.scheduled_date && (
                          <>
                            <span className="text-mute/30">&middot;</span>
                            <span className="text-xs text-mute">
                              {formatShortDate(sermon.scheduled_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-mute shrink-0">{timeAgo(sermon.updated_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        </>
        )}
      </div>

      {/* Right sidebar — khatib only */}
      {!isOrgAdmin && (
      <div className={`lg:w-[280px] border-t lg:border-t-0 ${isAr ? "lg:border-r" : "lg:border-l"} border-line p-4 sm:p-5 shrink-0 overflow-y-auto`}>
        {/* Annual Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink">{data.planningYear} {t("dash.progress")}</p>
            <span className="text-xs text-mute">{overallPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-line rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            {checklistSteps.map((step) => {
              const pct = step.total > 0 ? Math.round((step.done / step.total) * 100) : 0;
              const complete = step.done >= step.total;
              const inner = (
                <div className="py-2 px-2 rounded-lg hover:bg-surface transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {complete ? (
                        <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-line text-base">radio_button_unchecked</span>
                      )}
                      <span className={`text-sm ${complete ? "text-mute" : "text-ink"}`}>
                        {step.label}
                      </span>
                    </div>
                    <span className="text-xs text-mute">{step.done}/{step.total}</span>
                  </div>
                  <div className={`w-full h-1 bg-line rounded-full overflow-hidden ${isAr ? "mr-6" : "ml-6"}`} style={{ width: "calc(100% - 1.5rem)" }}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-primary" : "bg-primary/40"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
              return step.href && !complete ? (
                <Link key={step.key} href={step.href}>{inner}</Link>
              ) : (
                <div key={step.key}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* Year Transition Prompt */}
        {nextYearPrompt && !nextYearPrompt.hasThemes && (
          <div className="bg-primary/5 border border-primary/15 p-5 mb-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">event_upcoming</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">
                {t("dash.nextYearTitle")} {nextYearPrompt.nextYear}?
              </p>
              <p className="text-xs text-mute mt-1">{t("dash.nextYearDesc")}</p>
              <button
                onClick={async () => {
                  await fetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ section: "profile", name: user.name }),
                  });
                  await fetch(`/api/settings`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ section: "sermon", default_language: "ar-first" }),
                  });
                  window.location.href = `/themes?year=${nextYearPrompt.nextYear}`;
                }}
                className="mt-3 text-xs font-semibold px-4 py-2 bg-primary text-white hover:bg-secondary transition-colors"
              >
                {t("dash.startPlanning")} {nextYearPrompt.nextYear}
              </button>
            </div>
          </div>
        )}
        {nextYearPrompt && nextYearPrompt.hasThemes && (
          <div className="bg-green-50 border border-green-200 p-3 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
            <p className="text-xs text-green-700 font-medium">
              {t("dash.nextYearStarted")} {nextYearPrompt.nextYear}
            </p>
          </div>
        )}

        {/* Season Progress */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-ink mb-3">{t("dash.seasonProgress")}</p>
          <div className="flex flex-col gap-3">
            {seasons.map((season) => (
              <div
                key={season.label}
                className={`p-3 rounded-lg border transition-colors ${
                  season.isCurrent
                    ? "border-primary/20 bg-primary/3"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-mute">
                      {seasonIcon[season.label]}
                    </span>
                    <span className="text-sm font-medium text-ink">{seasonLabelMap[season.label] ?? season.label}</span>
                    {season.isCurrent && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t("dash.now")}</span>
                    )}
                  </div>
                  <span className="text-xs text-mute">{season.progress}%</span>
                </div>
                <div className="w-full h-1 bg-line rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      season.isCurrent ? "bg-primary" : "bg-mute/30"
                    }`}
                    style={{ width: `${season.progress}%` }}
                  />
                </div>
                {season.themes.length > 0 && (
                  <p className="text-[11px] text-mute mt-1.5 truncate">
                    {season.themes.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hijri Events */}
        {hijriEvents.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-ink mb-3">{t("dash.hijriEvents")}</p>
            <div className="flex flex-col gap-1">
              {hijriEvents.map((event, i) => {
                const daysUntil = Math.ceil((event.gregorianDate.getTime() - Date.now()) / 86400000);
                return (
                  <div
                    key={`${event.name}-${i}`}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface transition-colors"
                  >
                    <div
                      className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                      style={{ backgroundColor: event.color + "18" }}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: event.color }}
                      >
                        {event.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink truncate">{isAr ? event.nameAr : event.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-mute">
                          {event.gregorianDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "short" })}
                        </span>
                        <span className="text-mute/30">&middot;</span>
                        <span className="text-[11px] text-primary font-medium">
                          {daysUntil === 0 ? t("dash.today") : daysUntil === 1 ? t("dash.tomorrow") : isAr ? `${daysUntil} ي` : `${daysUntil}d`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-ink mb-3">{t("dash.upcoming")}</p>
          {upcomingSermons.length === 0 ? (
            <p className="text-xs text-mute/50">{t("dash.noUpcoming")}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {upcomingSermons.map((sermon) => (
                <Link
                  key={sermon.id}
                  href={`/sermons/${sermon.id}/edit`}
                  className="flex items-center gap-3 py-2 px-2 hover:bg-surface transition-colors rounded-lg"
                >
                  <span className="text-[11px] font-semibold text-primary whitespace-nowrap min-w-[42px]">
                    {sermon.scheduled_date
                      ? new Date(sermon.scheduled_date + "T00:00:00").toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "short" }).toUpperCase()
                      : "TBD"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink truncate">{sermon.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[sermon.status] ?? statusDot.draft}`} />
                      <span className="text-[11px] text-mute">{statusLabel[sermon.status] ?? sermon.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-sm font-semibold text-ink mb-3">{t("dash.quickActions")}</p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors w-full text-start rounded-lg"
            >
              <span className="material-symbols-outlined text-primary text-lg">add</span>
              {t("dash.newSermonAction")}
            </button>
            <Link
              href="/sermons"
              className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors rounded-lg"
            >
              <span className="material-symbols-outlined text-primary text-lg">list</span>
              {t("dash.allSermons")}
            </Link>
            <Link
              href="/themes"
              className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors rounded-lg"
            >
              <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
              {t("dash.annualPlan")}
            </Link>
          </div>
        </div>
      </div>
      )}

      {/* Emergency Swap Confirm Modal */}
      {showSwapConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-red-500 text-xl">swap_horiz</span>
              <h3 className="text-lg font-bold text-ink">{t("dash.swapSermon")}</h3>
            </div>
            <p className="text-sm text-mute mb-5">{t("dash.swapDesc")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSwapConfirm(false)}
                className="flex-1 px-4 py-2 border border-line text-sm text-mute hover:bg-surface transition-colors"
              >
                {t("dash.cancel")}
              </button>
              <button
                onClick={handleEmergencySwap}
                disabled={swapping}
                className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {swapping ? t("settings.saving") : t("dash.swapConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackSermonId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-ink mb-1">{t("dash.feedbackTitle")}</h3>
            <p className="text-xs text-mute mb-5">{t("dash.feedbackDesc")}</p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-ink/50 block mb-2">{t("dash.rating")}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${feedbackRating >= star ? "bg-accent-gold text-white" : "bg-surface text-mute hover:bg-accent-gold/20"}`}
                  >
                    <span className="material-symbols-outlined text-lg">star</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-ink/50 block mb-2">{t("dash.attendance")}</label>
              <input
                type="number"
                min="0"
                value={feedbackAttendance}
                onChange={(e) => setFeedbackAttendance(e.target.value)}
                placeholder={t("dash.attendancePlaceholder")}
                className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-ink/50 block mb-2">{t("dash.feedbackNote")}</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder={t("dash.feedbackNotePlaceholder")}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackSaving}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {feedbackSaving ? "..." : t("dash.saveFeedback")}
              </button>
              <button
                onClick={() => setFeedbackSermonId(null)}
                className="px-4 py-2.5 rounded-lg text-sm text-mute hover:text-ink transition-colors"
              >
                {t("dash.skipFeedback")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
