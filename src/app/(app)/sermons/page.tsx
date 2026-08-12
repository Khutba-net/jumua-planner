"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const typeLabel: Record<string, string> = {
  friday: "Friday",
  eid: "Eid",
  talk: "Talk",
  other: "Other",
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

function formatDate(iso: string) {
  return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SermonsPage() {
  const router = useRouter();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"friday" | "eid" | "talk" | "other">("friday");
  const [creating, setCreating] = useState(false);

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
    const t = s.type || "friday";
    acc[t] = (acc[t] || 0) + 1;
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
          <h1 className="text-2xl font-bold text-ink">Sermons</h1>
          <p className="text-sm text-mute mt-1">
            {sermons.length} sermon{sermons.length !== 1 && "s"} total
          </p>
        </div>
        <button
          onClick={() => { setShowNewForm(true); setNewTitle(""); setNewType("friday"); }}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
        >
          + New Sermon
        </button>
      </div>

      {/* New Sermon Form */}
      {showNewForm && (
        <div className="bg-white border border-line p-5 mb-6">
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
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
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
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 border border-line text-sm text-mute hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
              className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create sermon"}
            </button>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="flex gap-2 mb-4">
        {["all", "friday", "eid", "talk", "other"].map((t) => {
          const count = t === "all" ? sermons.length : (typeCounts[t] || 0);
          if (t !== "all" && count === 0) return null;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors rounded-full ${
                typeFilter === t
                  ? "bg-primary/10 text-primary"
                  : "text-mute hover:text-ink hover:bg-surface"
              }`}
            >
              {t !== "all" && (
                <span className="material-symbols-outlined text-sm">{typeIcon[t]}</span>
              )}
              {t === "all" ? "All" : typeLabel[t]}
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
            {f === "all" ? "All statuses" : statusLabel[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-mute">Loading sermons...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-line mb-4 block">
            description
          </span>
          <p className="text-mute mb-4">
            {sermons.length === 0
              ? "No sermons yet. Start writing your first khutbah."
              : "No sermons match this filter."}
          </p>
          {sermons.length === 0 && (
            <button
              onClick={() => setShowNewForm(true)}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
            >
              + New Sermon
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
                            <span className="text-mute/30">·</span>
                            <span className="text-xs text-accent-gold">{sermon.theme_name}</span>
                          </>
                        )}
                        <span className="text-mute/30">·</span>
                        <span className="text-xs text-mute">{wordCount(sermon.content)} words</span>
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
