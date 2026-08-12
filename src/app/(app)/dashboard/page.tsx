"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  user: { name: string; account_type: string; email: string };
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
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  delivered: "Delivered",
  archived: "Archived",
};

const statusDot: Record<string, string> = {
  draft: "bg-mute/40",
  ready: "bg-green-500",
  delivered: "bg-primary",
  archived: "bg-mute/30",
};

function wordCount(text: string | null) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getFridayLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const friday = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((friday.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return "This Friday";
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const seasonIcon: Record<string, string> = {
  "Season 1": "looks_one",
  "Season 2": "looks_two",
  "Season 3": "looks_3",
  "Season 4": "looks_4",
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"friday" | "eid" | "talk" | "other">("friday");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

  async function handleQuickLog(sermonId: string, status: "delivered" | "archived") {
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
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-mute">Loading...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-full text-mute">Failed to load dashboard</div>;
  }

  const { user, stats, recentSermons, upcomingSermons, thisFriday, lastFriday, backlogCount, backlogSermons, seasons, checklist } = data;

  const checklistSteps = [
    { key: "themes", label: "Main themes", ...checklist.themes, href: "/themes" },
    { key: "subTopics", label: "Sub-bouquets", ...checklist.subTopics, href: "/themes" },
    { key: "titles", label: "Sermon titles", ...checklist.titles, href: "/sermons" },
    { key: "delivered", label: "Delivered", ...checklist.delivered, href: null },
    { key: "reviewed", label: "Feedback logged", ...checklist.reviewed, href: null },
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
              Asalamu alaykom,{" "}
              <span className="text-primary font-semibold">{user.name}</span>
            </p>
            <p className="text-sm text-mute mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/themes"
              className="px-4 py-2 border border-line bg-white text-ink text-sm font-medium hover:bg-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              Year plan
            </Link>
            <button
              onClick={openNewForm}
              className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors"
            >
              + New sermon
            </button>
          </div>
        </div>

        {/* New Sermon Form */}
        {showNewForm && (
          <div className="bg-white border border-line p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink">New sermon</p>
              <button onClick={() => setShowNewForm(false)} className="text-mute hover:text-ink transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="Sermon title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateSermon(); }}
              autoFocus
              className="w-full px-3 py-2 border border-line text-sm text-ink bg-white mb-4 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-mute mb-2">Type</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {([
                { value: "friday" as const, label: "Friday", icon: "mosque" },
                { value: "eid" as const, label: "Eid", icon: "auto_awesome" },
                { value: "talk" as const, label: "Talk", icon: "mic" },
                { value: "other" as const, label: "Other", icon: "note" },
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
              {newType === "friday"
                ? "Tracked weekly with backlog prompts and season progress."
                : "Standalone — not part of the weekly Friday cycle."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 border border-line text-sm text-mute hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSermon}
                disabled={!newTitle.trim() || creating}
                className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create sermon"}
              </button>
            </div>
          </div>
        )}

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
                  <span className="text-xs text-mute">{wordCount(thisFriday.sermon.content)} words</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary/40 group-hover:text-primary/60 transition-colors text-xl mt-1">arrow_forward</span>
            </div>
          </Link>
        ) : (
          <div className="bg-surface border border-line p-5 mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-mute text-lg">mosque</span>
              <span className="text-xs font-semibold text-mute">{getFridayLabel(thisFriday.date)}</span>
              <span className="text-xs text-mute">{formatDate(thisFriday.date)}</span>
            </div>
            <p className="text-sm text-mute mb-3">No sermon planned for this Friday yet.</p>
            <button
              onClick={openNewForm}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Plan a sermon
            </button>
          </div>
        )}

        {/* Last Friday Logging Prompt */}
        {lastFriday && (
          <div className="bg-accent-gold/5 border border-accent-gold/20 p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-accent-gold text-xl">pending_actions</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">
                  How did <span className="font-semibold">"{lastFriday.sermon.title}"</span> go last Friday?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pl-9">
              <button
                onClick={() => handleQuickLog(lastFriday.sermon.id, "delivered")}
                disabled={loggingId === lastFriday.sermon.id}
                className="px-3 py-1.5 bg-primary text-white text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Delivered
              </button>
              <button
                onClick={() => handleQuickLog(lastFriday.sermon.id, "archived")}
                disabled={loggingId === lastFriday.sermon.id}
                className="px-3 py-1.5 border border-line text-mute text-xs font-medium hover:bg-surface transition-colors disabled:opacity-50"
              >
                Skipped
              </button>
              <Link
                href={`/sermons/${lastFriday.sermon.id}/edit`}
                className="px-3 py-1.5 text-xs text-primary font-medium hover:underline ml-auto"
              >
                Open sermon
              </Link>
            </div>
          </div>
        )}

        {/* Backlog Warning */}
        {backlogCount > 0 && (
          <div className="bg-red-50 border border-red-200 mb-4">
            <button
              onClick={() => setBacklogOpen(!backlogOpen)}
              className="flex items-center gap-3 p-4 w-full text-left hover:bg-red-100/40 transition-colors"
            >
              <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">
                  {backlogCount} past {backlogCount === 1 ? "sermon" : "sermons"} not yet logged
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
                          {new Date(sermon.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                        </span>
                        {sermon.theme_name && (
                          <>
                            <span className="text-mute/30">·</span>
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
                        Delivered
                      </button>
                      <button
                        onClick={() => handleQuickLog(sermon.id, "archived")}
                        disabled={loggingId === sermon.id}
                        className="px-2.5 py-1 border border-line bg-white text-mute text-[11px] font-medium hover:bg-surface transition-colors disabled:opacity-50"
                      >
                        Skipped
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
            { label: "Total sermons", value: stats.total, icon: "description" },
            { label: "Drafts", value: stats.drafts, icon: "edit_note" },
            { label: "Ready to deliver", value: stats.ready, icon: "check_circle" },
            { label: "Delivered", value: stats.delivered, icon: "event_available" },
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
              <p className="text-2xl font-bold text-ink pl-9">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent sermons */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-ink">Recent sermons</p>
          <Link href="/sermons" className="text-xs text-primary font-semibold hover:underline">
            View all
          </Link>
        </div>

        {recentSermons.length === 0 ? (
          <div className="bg-white border border-line p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-line mb-3 block">description</span>
            <p className="text-mute mb-4">No sermons yet. Start writing your first khutbah.</p>
            <button
              onClick={openNewForm}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
            >
              + New Sermon
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
                            <span className="text-mute/30">·</span>
                            <span className="text-xs text-accent-gold">{sermon.theme_name}</span>
                          </>
                        )}
                        {sermon.scheduled_date && (
                          <>
                            <span className="text-mute/30">·</span>
                            <span className="text-xs text-mute">
                              {new Date(sermon.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" })}
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
      </div>

      {/* Right sidebar */}
      <div className="lg:w-[280px] border-t lg:border-t-0 lg:border-l border-line p-4 sm:p-5 shrink-0 overflow-y-auto">
        {/* Annual Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink">{data.planningYear} progress</p>
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
                  <div className="w-full h-1 bg-line rounded-full overflow-hidden ml-6" style={{ width: "calc(100% - 1.5rem)" }}>
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

        {/* Season Progress */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-ink mb-3">Season progress</p>
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
                    <span className="text-sm font-medium text-ink">{season.label}</span>
                    {season.isCurrent && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Now</span>
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

        {/* Upcoming */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-ink mb-3">Upcoming</p>
          {upcomingSermons.length === 0 ? (
            <p className="text-xs text-mute/50">No upcoming sermons scheduled</p>
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
                      ? new Date(sermon.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }).toUpperCase()
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
          <p className="text-sm font-semibold text-ink mb-3">Quick actions</p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors w-full text-left rounded-lg"
            >
              <span className="material-symbols-outlined text-primary text-lg">add</span>
              New sermon
            </button>
            <Link
              href="/sermons"
              className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors rounded-lg"
            >
              <span className="material-symbols-outlined text-primary text-lg">list</span>
              All sermons
            </Link>
            <Link
              href="/themes"
              className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors rounded-lg"
            >
              <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
              Annual plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
