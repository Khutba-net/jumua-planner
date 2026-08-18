"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface Sermon {
  id: string;
  title: string;
  status: string;
  type: string;
  content: string | null;
  scheduled_date: string | null;
  updated_at: string;
  theme_name: string | null;
}

const statusDot: Record<string, string> = {
  draft: "bg-mute/40",
  ready: "bg-green-500",
  delivered: "bg-primary",
  archived: "bg-mute/30",
};

const typeIcon: Record<string, string> = {
  friday: "mosque",
  eid: "auto_awesome",
  talk: "mic",
  other: "note",
};

function wordCount(text: string | null) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function SermonsPage() {
  const router = useRouter();
  const { t, isAr } = useI18n();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"friday" | "eid" | "talk" | "other">("friday");
  const [creating, setCreating] = useState(false);

  const statusLabel: Record<string, string> = {
    draft: t("status.draft"),
    ready: t("status.ready"),
    delivered: t("status.delivered"),
    archived: t("status.archived"),
  };

  const typeLabel: Record<string, string> = {
    friday: t("type.friday"),
    eid: t("type.eid"),
    talk: t("type.talk"),
    other: t("type.other"),
  };

  function formatDate(iso: string) {
    return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  useEffect(() => {
    fetch("/api/sermons")
      .then((r) => r.json())
      .then((data) => {
        setSermons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = sermons.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (typeFilter !== "all" && (s.type || "friday") !== typeFilter) return false;
    return true;
  });

  const typeCounts = sermons.reduce<Record<string, number>>((acc, s) => {
    const tp = s.type || "friday";
    acc[tp] = (acc[tp] || 0) + 1;
    return acc;
  }, {});

  async function handleCreate() {
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("sermons.title")}</h1>
          <p className="text-sm text-mute mt-1">
            {sermons.length} {sermons.length !== 1 ? t("sermons.title").toLowerCase() : t("cal.sermon")} {t("sermons.total")}
          </p>
        </div>
        <button
          onClick={() => { setShowNewForm(true); setNewTitle(""); setNewType("friday"); }}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
        >
          {t("sermons.newSermon")}
        </button>
      </div>

      {/* New Sermon Form */}
      {showNewForm && (
        <div className="bg-white border border-line p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ink">{t("sermons.newSermonForm")}</p>
            <button onClick={() => setShowNewForm(false)} className="text-mute hover:text-ink transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <input
            type="text"
            placeholder={t("sermons.sermonTitle")}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            autoFocus
            className="w-full px-3 py-2 border border-line text-sm text-ink bg-white mb-4 focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-mute mb-2">{t("dash.type")}</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {([
              { value: "friday" as const, label: t("type.friday"), icon: "mosque" },
              { value: "eid" as const, label: t("type.eid"), icon: "auto_awesome" },
              { value: "talk" as const, label: t("type.talk"), icon: "mic" },
              { value: "other" as const, label: t("type.other"), icon: "note" },
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
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 border border-line text-sm text-mute hover:bg-surface transition-colors"
            >
              {t("sermons.cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
              className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {creating ? t("sermons.creating") : t("sermons.createSermon")}
            </button>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="flex gap-2 mb-4">
        {["all", "friday", "eid", "talk", "other"].map((tp) => {
          const count = tp === "all" ? sermons.length : (typeCounts[tp] || 0);
          if (tp !== "all" && count === 0) return null;
          return (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors rounded-full ${
                typeFilter === tp
                  ? "bg-primary/10 text-primary"
                  : "text-mute hover:text-ink hover:bg-surface"
              }`}
            >
              {tp !== "all" && (
                <span className="material-symbols-outlined text-sm">{typeIcon[tp]}</span>
              )}
              {tp === "all" ? t("sermons.all") : typeLabel[tp]}
              <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Status filters */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {["all", "draft", "ready", "delivered", "archived"].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f
                ? "bg-primary text-white"
                : "bg-white border border-line text-mute hover:text-ink"
            }`}
          >
            {f === "all" ? t("sermons.allStatuses") : statusLabel[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-mute">{t("sermons.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-line mb-4 block">
            description
          </span>
          <p className="text-mute mb-4">
            {sermons.length === 0
              ? t("sermons.noSermons")
              : t("sermons.noMatch")}
          </p>
          {sermons.length === 0 && (
            <button
              onClick={() => setShowNewForm(true)}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
            >
              {t("sermons.newSermon")}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((sermon) => {
            const sType = sermon.type || "friday";
            return (
              <Link
                key={sermon.id}
                href={`/sermons/${sermon.id}/edit`}
                className="bg-white border border-line px-5 py-4 hover:shadow-sm transition-shadow block group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[sermon.status] ?? statusDot.draft}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ink truncate">{sermon.title}</p>
                        {sType !== "friday" && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-mute bg-surface px-2 py-0.5 shrink-0">
                            <span className="material-symbols-outlined text-xs">{typeIcon[sType]}</span>
                            {typeLabel[sType]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-mute">{statusLabel[sermon.status] ?? sermon.status}</span>
                        {sermon.theme_name && (
                          <>
                            <span className="text-mute/30">&middot;</span>
                            <span className="text-xs text-accent-gold">{sermon.theme_name}</span>
                          </>
                        )}
                        <span className="text-mute/30">&middot;</span>
                        <span className="text-xs text-mute">{wordCount(sermon.content)} {t("dash.words")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {sermon.scheduled_date && (
                      <p className="text-xs text-mute">{formatDate(sermon.scheduled_date)}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
