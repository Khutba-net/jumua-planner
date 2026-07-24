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
  }[];
}

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  in_review: "PLANNED",
  ready: "READY",
  delivered: "DELIVERED",
  archived: "ARCHIVED",
};

const statusStyle: Record<string, string> = {
  draft: "bg-surface text-mute",
  in_review: "bg-accent-gold/10 text-accent-gold",
  ready: "bg-green-50 text-green-700",
  delivered: "bg-primary/10 text-primary",
  archived: "bg-surface text-mute",
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

function formatFriday(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" }).toUpperCase();
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleNewSermon() {
    const res = await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Sermon" }),
    });
    const sermon = await res.json();
    router.push(`/sermons/${sermon.id}/edit`);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-mute">Loading...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-full text-mute">Failed to load dashboard</div>;
  }

  const { user, stats, recentSermons, upcomingSermons } = data;

  const statCards = [
    { label: "Total sermons", value: stats.total, icon: "description" },
    { label: "Drafts", value: stats.drafts, icon: "edit_note" },
    { label: "Ready to deliver", value: stats.ready, icon: "check_circle" },
    { label: "Delivered", value: stats.delivered, icon: "event_available" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <p className="text-lg text-ink">
              Asalamu alaykom,{" "}
              <span className="text-primary font-semibold">{user.name}</span>{" "}
              <span className="hidden sm:inline font-[var(--font-arabic)] text-mute text-base">
                — السلام عليكم ورحمة الله وبركاته
              </span>
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
              onClick={handleNewSermon}
              className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors"
            >
              + New sermon
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {statCards.map((stat) => (
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

        {/* Total words badge */}
        <div className="bg-accent-gold/5 border border-accent-gold/20 p-4 mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-accent-gold text-2xl">trending_up</span>
          <div>
            <p className="text-sm font-semibold text-ink">{stats.totalWords.toLocaleString()} total words written</p>
            <p className="text-xs text-mute">Across all your sermons</p>
          </div>
        </div>

        {/* Recent sermons */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] font-bold text-mute tracking-[2px] uppercase">
            Recent Sermons
          </p>
          <Link href="/sermons" className="text-xs text-primary font-semibold hover:underline">
            View all →
          </Link>
        </div>

        {recentSermons.length === 0 ? (
          <div className="bg-white border border-line p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-line mb-3 block">description</span>
            <p className="text-mute mb-4">No sermons yet. Start writing your first khutbah.</p>
            <button
              onClick={handleNewSermon}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
            >
              + New Sermon
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSermons.map((sermon) => (
              <Link
                key={sermon.id}
                href={`/sermons/${sermon.id}/edit`}
                className="bg-white border border-line p-5 cursor-pointer hover:shadow-md transition-shadow block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {sermon.scheduled_date && (
                      <p className="text-[10px] text-mute mb-1">
                        {new Date(sermon.scheduled_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).toUpperCase()}
                      </p>
                    )}
                    <p className="text-base font-semibold text-ink truncate">{sermon.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 tracking-wide ${statusStyle[sermon.status] ?? statusStyle.draft}`}>
                        {statusLabel[sermon.status] ?? sermon.status.toUpperCase()}
                      </span>
                      {sermon.theme_name && (
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-accent-gold/10 text-accent-gold">
                          {sermon.theme_name.toUpperCase()}
                        </span>
                      )}
                      <span className="text-[10px] text-mute">{wordCount(sermon.content)} words</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-mute shrink-0">Edited {timeAgo(sermon.updated_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="lg:w-[260px] border-t lg:border-t-0 lg:border-l border-line p-4 sm:p-5 shrink-0 overflow-y-auto">
        {/* Quick stats */}
        <p className="text-[9px] font-bold text-mute tracking-[2px] uppercase mb-3">This Week</p>
        <div className="bg-primary/5 p-4 mb-6">
          <p className="text-xs text-mute mb-1">Next Friday</p>
          <p className="text-sm font-semibold text-primary">
            {new Date(Date.now() + ((5 - new Date().getDay() + 7) % 7 || 7) * 86400000).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          {upcomingSermons.length > 0 && upcomingSermons[0].scheduled_date && (
            <p className="text-xs text-mute mt-2">
              {upcomingSermons[0].title} — <span className={`font-bold ${upcomingSermons[0].status === "ready" ? "text-green-600" : "text-accent-gold"}`}>
                {statusLabel[upcomingSermons[0].status] ?? upcomingSermons[0].status.toUpperCase()}
              </span>
            </p>
          )}
        </div>

        {/* Upcoming */}
        <p className="text-[9px] font-bold text-mute tracking-[2px] uppercase mb-3">
          Upcoming Sermons
        </p>

        {upcomingSermons.length === 0 ? (
          <p className="text-xs text-mute/50 mb-6">No upcoming sermons scheduled</p>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {upcomingSermons.map((sermon) => (
              <Link
                key={sermon.id}
                href={`/sermons/${sermon.id}/edit`}
                className="flex items-start gap-3 py-2 hover:bg-surface transition-colors px-1"
              >
                <span className="text-[10px] font-bold text-primary whitespace-nowrap min-w-[42px]">
                  {sermon.scheduled_date ? formatFriday(sermon.scheduled_date) : "TBD"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{sermon.title}</p>
                  <span className={`text-[9px] font-bold ${statusStyle[sermon.status] ?? statusStyle.draft} px-1.5 py-0.5`}>
                    {statusLabel[sermon.status] ?? sermon.status.toUpperCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <p className="text-[9px] font-bold text-mute tracking-[2px] uppercase mb-3">Quick Actions</p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleNewSermon}
            className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined text-primary text-lg">add</span>
            New sermon
          </button>
          <Link
            href="/sermons"
            className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-lg">list</span>
            All sermons
          </Link>
          <Link
            href="/themes"
            className="flex items-center gap-2 text-sm text-ink px-3 py-2 bg-white border border-line hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
            Annual plan
          </Link>
        </div>
      </div>
    </div>
  );
}
