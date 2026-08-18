"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type KhatibStat = {
  member_id: string;
  name: string;
  user_id: string;
  total_sermons: number;
  ready_sermons: number;
  delivered_sermons: number;
  this_week_sermon: { id: string; title: string; status: string; scheduled_date: string } | null;
};

type DashboardData = {
  organization: { id: string; name: string; type: string; city: string; country: string };
  stats: { totalKhatibs: number; activeKhatibs: number; pendingInvites: number };
  khatibStats: KhatibStat[];
  thisFriday: { date: string; khatib: string | null; isGuest: boolean; notes: string | null };
};

export default function OrgDashboardPage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/org/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.organization) {
    return (
      <div className="text-center py-20">
        <p className="text-mute">{t("org.notAdmin")}</p>
      </div>
    );
  }

  const { organization, stats, khatibStats, thisFriday } = data;
  const totalSermons = khatibStats.reduce((s, k) => s + k.total_sermons, 0);
  const deliveredSermons = khatibStats.reduce((s, k) => s + k.delivered_sermons, 0);

  const fridayFormatted = new Date(thisFriday.date + "T00:00:00").toLocaleDateString(
    isAr ? "ar-SA" : "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{organization.name}</h1>
          <p className="text-sm text-mute mt-0.5">
            {organization.city}{organization.city && organization.country ? ", " : ""}{organization.country}
          </p>
        </div>
        <Link
          href="/org/khatibs"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line bg-white text-sm font-semibold text-ink hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">group</span>
          {t("org.manageKhatibs")}
        </Link>
      </div>

      {/* This Friday's Schedule */}
      <div className={`border p-5 rounded-xl mb-6 ${thisFriday.khatib ? "bg-primary/5 border-primary/15" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`material-symbols-outlined text-lg ${thisFriday.khatib ? "text-primary" : "text-amber-500"}`}>mosque</span>
          <span className="text-xs font-semibold text-primary">{t("org.thisWeekSchedule")}</span>
          <span className="text-xs text-mute">{fridayFormatted}</span>
        </div>
        {thisFriday.khatib ? (
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-ink">{thisFriday.khatib}</p>
            {thisFriday.isGuest && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">({t("org.guest")})</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-mute">{t("org.noSchedule")}</p>
            <Link href="/org/schedule" className="text-xs font-semibold text-primary hover:underline">{t("org.assignKhatib")}</Link>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: t("org.totalKhatibs"), value: stats.totalKhatibs, icon: "group", color: "text-primary" },
          { label: t("org.activeKhatibs"), value: stats.activeKhatibs, icon: "check_circle", color: "text-emerald-600" },
          { label: t("org.pendingInvites"), value: stats.pendingInvites, icon: "schedule", color: "text-amber-600" },
          { label: t("org.totalSermons"), value: totalSermons, icon: "description", color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-line rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
              <span className="text-xs text-mute font-semibold">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Khatib cards */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-ink/50 uppercase tracking-wider mb-3">{t("org.khatibProgress")}</h2>
      </div>

      {khatibStats.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-ink/15 mb-2">group</span>
          <p className="text-mute text-sm">{t("org.noActiveKhatibs")}</p>
          <Link href="/org/khatibs" className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">
            {t("org.inviteKhatibs")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {khatibStats.map((k) => {
            const progress = k.total_sermons > 0 ? Math.round((k.delivered_sermons / 52) * 100) : 0;
            return (
              <Link key={k.member_id} href={`/org/khatibs/${k.member_id}`} className="bg-white border border-line rounded-xl p-5 hover:border-primary/30 transition-colors block">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {k.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{k.name}</p>
                    <p className="text-xs text-mute">{k.total_sermons} {t("org.sermons")} &middot; {k.delivered_sermons} {t("org.delivered")}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-mute">{t("org.yearProgress")}</span>
                    <span className="font-semibold text-ink">{progress}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* This week */}
                {k.this_week_sermon ? (
                  <div className="bg-surface rounded-lg p-3 flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${k.this_week_sermon.status === "ready" ? "text-emerald-500" : k.this_week_sermon.status === "delivered" ? "text-primary" : "text-amber-500"}`}>
                      {k.this_week_sermon.status === "ready" ? "check_circle" : k.this_week_sermon.status === "delivered" ? "verified" : "edit_note"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{k.this_week_sermon.title}</p>
                      <p className="text-[10px] text-mute">{t("org.thisWeek")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-lg p-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-ink/20">event_busy</span>
                    <p className="text-xs text-mute">{t("org.noSermonThisWeek")}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
