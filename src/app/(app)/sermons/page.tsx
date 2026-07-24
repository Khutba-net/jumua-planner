"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Sermon {
  id: string;
  title: string;
  status: string;
  content: string | null;
  scheduled_date: string | null;
  updated_at: string;
  theme_name: string | null;
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  ready: "Ready",
  delivered: "Delivered",
  archived: "Archived",
};

const statusStyle: Record<string, string> = {
  draft: "bg-surface text-mute",
  in_review: "bg-orange-50 text-orange-600",
  ready: "bg-green-50 text-green-700",
  delivered: "bg-primary/10 text-primary",
  archived: "bg-surface text-mute",
};

function wordCount(text: string | null) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SermonsPage() {
  const router = useRouter();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/sermons")
      .then((r) => r.json())
      .then((data) => {
        setSermons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? sermons : sermons.filter((s) => s.status === filter);

  async function handleNew() {
    const res = await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Sermon" }),
    });
    const sermon = await res.json();
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
          onClick={handleNew}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
        >
          + New Sermon
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {["all", "draft", "in_review", "ready", "delivered", "archived"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-white border border-line text-mute hover:text-ink"
            }`}
          >
            {f === "all" ? "All" : statusLabel[f]}
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
              onClick={handleNew}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
            >
              + New Sermon
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((sermon) => (
            <Link
              key={sermon.id}
              href={`/sermons/${sermon.id}/edit`}
              className="bg-white border border-line p-5 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-ink truncate">
                    {sermon.title}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 tracking-wide ${
                        statusStyle[sermon.status] ?? "bg-surface text-mute"
                      }`}
                    >
                      {(statusLabel[sermon.status] ?? sermon.status).toUpperCase()}
                    </span>
                    {sermon.theme_name && (
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-accent-gold/10 text-accent-gold">
                        {sermon.theme_name.toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs text-mute">
                      {wordCount(sermon.content)} words
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {sermon.scheduled_date && (
                    <p className="text-xs text-mute">
                      {formatDate(sermon.scheduled_date)}
                    </p>
                  )}
                  <p className="text-[11px] text-mute/60 mt-1">
                    Edited {formatDate(sermon.updated_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
