"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type Sermon = {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  updated_at: string;
  theme_name: string | null;
  theme_color: string | null;
};

type MemberData = {
  member: { id: string; name: string; status: string };
  sermons: Sermon[];
  stats: { total: number; drafts: number; ready: number; delivered: number };
};

export default function KhatibSermonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/org/members/${id}/sermons`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.member) {
    return (
      <div className="text-center py-20">
        <p className="text-mute">{t("org.memberNotFound")}</p>
      </div>
    );
  }

  const { member, sermons, stats } = data;
  const progress = stats.total > 0 ? Math.round((stats.delivered / 52) * 100) : 0;

  const statusColor = (s: string) => {
    if (s === "delivered") return "bg-primary/10 text-primary";
    if (s === "ready") return "bg-emerald-50 text-emerald-700";
    return "bg-amber-50 text-amber-700";
  };

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/org/khatibs"
        className="flex items-center gap-1 text-mute hover:text-primary text-sm mb-4 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">{isAr ? "arrow_forward" : "arrow_back"}</span>
        {t("org.backToKhatibs")}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
          {member.name[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{member.name}</h1>
          <p className="text-sm text-mute">{t("org.viewOnly")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("org.totalSermons"), value: stats.total, icon: "description" },
          { label: t("org.statDrafts"), value: stats.drafts, icon: "edit_note" },
          { label: t("org.statReady"), value: stats.ready, icon: "check_circle" },
          { label: t("org.statDelivered"), value: stats.delivered, icon: "event_available" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-line rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-sm text-mute">{s.icon}</span>
              <span className="text-[10px] text-mute font-semibold">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-white border border-line rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-mute font-semibold">{t("org.yearProgress")}</span>
          <span className="font-bold text-ink">{progress}%</span>
        </div>
        <div className="h-2.5 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-mute mt-2">{stats.delivered}/52 {t("org.delivered")}</p>
      </div>

      {/* Sermons list */}
      <h2 className="text-sm font-bold text-ink/50 uppercase tracking-wider mb-3">{t("org.sermonsList")}</h2>

      {sermons.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-ink/15 mb-2">description</span>
          <p className="text-mute text-sm">{t("org.noSermons")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sermons.map((s) => (
            <div key={s.id} className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{s.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {s.theme_name && (
                    <span className="text-[10px] text-mute">{s.theme_name}</span>
                  )}
                  {s.scheduled_date && (
                    <span className="text-[10px] text-mute">{formatDate(s.scheduled_date)}</span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(s.status)}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
