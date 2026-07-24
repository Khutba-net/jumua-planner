"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SubTopic {
  id: string;
  name: string;
  week_number: number;
}

interface Theme {
  id: string;
  name: string;
  description: string | null;
  month: number;
  year: number;
  color: string | null;
  sub_topic_count: number;
  sermon_count: number;
  sub_topics: SubTopic[];
}

interface Sermon {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  theme_id: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const THEME_COLORS = [
  { label: "Teal", value: "#00666d" },
  { label: "Gold", value: "#C4A35A" },
  { label: "Green", value: "#4a7c59" },
  { label: "Blue", value: "#5b7fa6" },
  { label: "Rose", value: "#8a5c6e" },
  { label: "Amber", value: "#B8860B" },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "#f0eeeb", text: "#6d797a", label: "Not started" },
  in_review: { bg: "#fdf3e7", text: "#C4A35A", label: "Planned" },
  ready: { bg: "#e8f5ee", text: "#00666d", label: "Written" },
  delivered: { bg: "#eef2f7", text: "#5b7fa6", label: "Delivered" },
  archived: { bg: "#f0eeeb", text: "#6d797a", label: "Archived" },
};

const STATUS_FILTERS = ["All", "Written", "Planned", "Delivered", "Not started"];

function formatFriday(iso: string) {
  const d = new Date(iso);
  return `Fri ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function getStatusKey(label: string): string | null {
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    if (val.label === label) return key;
  }
  return null;
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#00666d");
  const [formMonthStart, setFormMonthStart] = useState(1);
  const [formMonthEnd, setFormMonthEnd] = useState(3);
  const [formTopics, setFormTopics] = useState<{ name: string; week: number }[]>([
    { name: "", week: 1 },
    { name: "", week: 2 },
    { name: "", week: 3 },
  ]);

  useEffect(() => {
    fetchAll();
  }, []);

  function fetchAll() {
    Promise.all([
      fetch("/api/themes").then((r) => r.json()),
      fetch("/api/sermons").then((r) => r.json()),
    ])
      .then(([t, s]) => {
        setThemes(t);
        setSermons(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const yearThemes = themes
    .filter((t) => t.year === year)
    .sort((a, b) => a.month - b.month);

  const filteredThemes = themeFilter
    ? yearThemes.filter((t) => t.id === themeFilter)
    : yearThemes;

  function getSermonsForTheme(themeId: string) {
    let s = sermons.filter((s) => s.theme_id === themeId);
    if (statusFilter !== "All") {
      const key = getStatusKey(statusFilter);
      if (key) s = s.filter((sr) => sr.status === key);
    }
    return s.sort((a, b) => {
      if (!a.scheduled_date) return 1;
      if (!b.scheduled_date) return -1;
      return a.scheduled_date.localeCompare(b.scheduled_date);
    });
  }

  function getAllSermonsForYear() {
    const themeIds = new Set(yearThemes.map((t) => t.id));
    return sermons.filter((s) => s.theme_id && themeIds.has(s.theme_id));
  }

  const allYearSermons = getAllSermonsForYear();
  const totalFridays = yearThemes.reduce((sum, t) => sum + (t.sub_topics.length > 0 ? t.sub_topics.length * 4 : 4), 0);
  const writtenCount = allYearSermons.filter((s) => s.status === "ready" || s.status === "delivered").length;
  const plannedCount = allYearSermons.filter((s) => s.status === "in_review").length;
  const notStartedCount = allYearSermons.filter((s) => s.status === "draft").length;

  const nextFriday = allYearSermons
    .filter((s) => s.scheduled_date && new Date(s.scheduled_date) >= new Date())
    .sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!))[0];

  const focusTheme = yearThemes.find((t) => {
    const now = new Date();
    return now.getMonth() + 1 >= t.month && now.getMonth() + 1 <= t.month + 2;
  });

  function toggleCollapse(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openCreate() {
    setEditingTheme(null);
    setShowCreate(true);
    const nextIdx = yearThemes.length;
    const startMonth = Math.min(12, nextIdx * 3 + 1);
    setFormName("");
    setFormDesc("");
    setFormColor(THEME_COLORS[nextIdx % THEME_COLORS.length].value);
    setFormMonthStart(startMonth);
    setFormMonthEnd(Math.min(12, startMonth + 2));
    setFormTopics([
      { name: "", week: 1 },
      { name: "", week: 2 },
      { name: "", week: 3 },
    ]);
  }

  function openEdit(theme: Theme) {
    setShowCreate(false);
    setEditingTheme(theme);
    setFormName(theme.name);
    setFormDesc(theme.description ?? "");
    setFormColor(theme.color ?? "#00666d");
    setFormMonthStart(theme.month);
    setFormMonthEnd(theme.month);
    const topics = theme.sub_topics.length > 0
      ? theme.sub_topics.map((st) => ({ name: st.name, week: st.week_number }))
      : [{ name: "", week: 1 }, { name: "", week: 2 }, { name: "", week: 3 }];
    setFormTopics(topics);
  }

  function closeForm() {
    setShowCreate(false);
    setEditingTheme(null);
  }

  async function handleSave() {
    const subTopics = formTopics.filter((t) => t.name.trim().length > 0);

    if (editingTheme) {
      await fetch(`/api/themes/${editingTheme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          color: formColor,
          month: formMonthStart,
          subTopics: subTopics,
        }),
      });
    } else {
      await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          month: formMonthStart,
          year,
          color: formColor,
          subTopics: subTopics,
        }),
      });
    }

    closeForm();
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this theme? Sermons linked to it will be unlinked.")) return;
    await fetch(`/api/themes/${id}`, { method: "DELETE" });
    closeForm();
    fetchAll();
  }

  function addSubTopic() {
    setFormTopics([...formTopics, { name: "", week: formTopics.length + 1 }]);
  }

  function updateSubTopic(idx: number, name: string) {
    const updated = [...formTopics];
    updated[idx] = { ...updated[idx], name };
    setFormTopics(updated);
  }

  function removeSubTopic(idx: number) {
    setFormTopics(formTopics.filter((_, i) => i !== idx));
  }

  const isFormOpen = showCreate || editingTheme !== null;

  function getMonthRange(theme: Theme) {
    const start = MONTH_SHORT[(theme.month - 1)];
    const endMonth = Math.min(12, theme.month + 2);
    const end = MONTH_SHORT[endMonth - 1];
    return `${start} – ${end}`;
  }

  function getThemeStats(theme: Theme) {
    const themeSermons = sermons.filter((s) => s.theme_id === theme.id);
    const written = themeSermons.filter((s) => s.status === "ready" || s.status === "delivered").length;
    const planned = themeSermons.filter((s) => s.status === "in_review" || s.status === "draft").length;
    if (themeSermons.length === 0) return "not started";
    if (written > 0) return `${written} written`;
    return `${planned} planned`;
  }

  return (
    <div className="flex min-h-screen bg-[#FAF7F2]">
      {/* Main content */}
      <div className="flex-1">

        {/* ── Top header ── */}
        <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-4 border-b border-[#bcc9ca]/20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold text-[#00666d] italic tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Full year plan — {year}
              </h1>
              <p className="text-[12px] text-[#6d797a] mt-0.5" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
                {allYearSermons.length > 0 ? allYearSermons.length : 48} جمعة ~ {year} ميلادي
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full border border-[#bcc9ca]/30 shadow-sm">
                <button
                  onClick={() => setYear(year - 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#6d797a] hover:text-[#00666d] transition-colors text-sm font-bold rounded-l-full hover:bg-[#00666d]/5"
                >
                  ‹
                </button>
                <span className="text-sm font-bold text-[#00666d] px-2 min-w-[48px] text-center">{year}</span>
                <button
                  onClick={() => setYear(year + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#6d797a] hover:text-[#00666d] transition-colors text-sm font-bold rounded-r-full hover:bg-[#00666d]/5"
                >
                  ›
                </button>
              </div>
              <button className="text-[11px] px-4 py-2 border border-[#bcc9ca]/40 bg-white/70 text-[#3d494a] font-semibold hover:bg-white transition-all shadow-sm">
                Export year plan
              </button>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="flex overflow-x-auto border border-[#bcc9ca]/25 bg-white/60 backdrop-blur-sm">
            {[
              { n: allYearSermons.length > 0 ? Math.max(totalFridays, 48) : 48, label: "Fridays", accent: true },
              ...yearThemes.slice(0, 4).map((t, i) => {
                const count = sermons.filter((s) => s.theme_id === t.id).length;
                return { n: count, label: `Theme ${i + 1}`, accent: false, color: t.color };
              }),
              { n: writtenCount, label: "Written", accent: false },
              { n: allYearSermons.length, label: "Total", accent: false },
            ].map((stat, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[72px] px-3 py-3 text-center border-r border-[#bcc9ca]/20 last:border-r-0 ${
                  stat.accent ? "bg-[#00666d]/[0.04]" : ""
                }`}
              >
                <div
                  className="text-xl sm:text-2xl font-bold leading-tight"
                  style={{ color: stat.accent ? "#00666d" : (stat as { color?: string }).color || "#1a1c1e" }}
                >
                  {stat.n}
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold tracking-[1px] text-[#6d797a] uppercase mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters & Actions bar ── */}
        <div className="px-4 sm:px-6 lg:px-10 py-3 border-b border-[#bcc9ca]/15 space-y-2.5">
          {/* Theme filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setThemeFilter(null)}
              className={`text-[11px] px-3.5 py-1.5 font-bold whitespace-nowrap transition-all ${
                themeFilter === null
                  ? "bg-[#00666d] text-white shadow-sm"
                  : "bg-white/60 text-[#3d494a] border border-[#bcc9ca]/30 hover:bg-white"
              }`}
            >
              All themes
            </button>
            {yearThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeFilter(themeFilter === t.id ? null : t.id)}
                className={`text-[11px] px-3.5 py-1.5 font-semibold whitespace-nowrap transition-all ${
                  themeFilter === t.id
                    ? "text-white shadow-sm"
                    : "bg-white/60 text-[#3d494a] border border-[#bcc9ca]/30 hover:bg-white"
                }`}
                style={themeFilter === t.id ? { backgroundColor: t.color || "#00666d" } : undefined}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf}
                onClick={() => setStatusFilter(sf)}
                className={`text-[10px] px-3 py-1 font-semibold whitespace-nowrap transition-all border ${
                  statusFilter === sf
                    ? "bg-[#00666d]/10 border-[#00666d]/20 text-[#00666d]"
                    : "bg-white/40 border-[#bcc9ca]/20 text-[#6d797a] hover:bg-white/70"
                }`}
              >
                {sf}
              </button>
            ))}
          </div>

          {/* Action buttons + hint */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openCreate}
              className="text-[11px] px-4 py-1.5 bg-[#00666d] text-white font-bold hover:bg-[#004a50] transition-all shadow-sm active:scale-95"
            >
              + Add main theme
            </button>
            <button
              onClick={() => {
                if (yearThemes.length > 0) openEdit(yearThemes[0]);
                else openCreate();
              }}
              className="text-[11px] px-4 py-1.5 border border-[#bcc9ca]/40 bg-white/70 text-[#3d494a] font-semibold hover:bg-white transition-all"
            >
              + Add sub-theme
            </button>
            <button className="text-[11px] px-4 py-1.5 border border-[#bcc9ca]/40 bg-white/70 text-[#3d494a] font-semibold hover:bg-white transition-all">
              + Add Friday
            </button>
            <span className="text-[10px] text-[#bcc9ca] italic hidden sm:inline ml-1">
              Drag Fridays to reorder · Click a Friday to open the editor
            </span>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            {nextFriday && (
              <span className="text-[10px] px-3 py-1.5 bg-[#00666d]/8 border border-[#00666d]/12 text-[#00666d] font-semibold">
                Next Friday · {nextFriday.scheduled_date ? formatFriday(nextFriday.scheduled_date) : ""} · {nextFriday.title}
              </span>
            )}
            {notStartedCount > 0 && (
              <span className="text-[10px] px-3 py-1.5 bg-[#C4A35A]/10 border border-[#C4A35A]/15 text-[#C4A35A] font-semibold">
                Pending · {notStartedCount} not started
              </span>
            )}
            {focusTheme && (
              <span className="text-[10px] px-3 py-1.5 bg-[#00666d]/8 border border-[#00666d]/12 text-[#00666d] font-semibold">
                Focus · {focusTheme.name}
              </span>
            )}
          </div>
        </div>

        {/* ── Tree ── */}
        <div className="p-4 sm:p-6 lg:px-10 lg:py-6 flex flex-col gap-3 max-w-5xl">
          {loading ? (
            <div className="text-center py-20 text-[#6d797a] text-sm">Loading themes...</div>
          ) : filteredThemes.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-[#00666d]/15 mb-3 block">calendar_month</span>
              <p className="text-[#6d797a] text-sm mb-1">
                {yearThemes.length === 0
                  ? <>No themes yet for <span className="font-bold text-[#00666d]">{year}</span></>
                  : "No themes match the current filter."
                }
              </p>
              <p className="text-[#bcc9ca] text-xs mb-5">Start building your annual sermon roadmap.</p>
              <button
                onClick={openCreate}
                className="bg-[#00666d] text-white font-bold text-sm px-8 py-3 hover:bg-[#004a50] transition-all shadow-md active:scale-95"
              >
                + Create First Theme
              </button>
            </div>
          ) : (
            filteredThemes.map((theme, themeIdx) => {
              const themeSermons = getSermonsForTheme(theme.id);
              const allThemeSermons = sermons.filter((s) => s.theme_id === theme.id);
              const isCollapsed = collapsed[theme.id];
              const themeColor = theme.color || "#00666d";
              const globalIdx = yearThemes.indexOf(theme);

              return (
                <div
                  key={theme.id}
                  className="bg-white/70 backdrop-blur-sm border border-[#bcc9ca]/25 overflow-hidden"
                  style={{ boxShadow: "0 6px 20px -6px rgba(0,102,109,0.05)" }}
                >
                  {/* Theme header */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-3 cursor-pointer gap-2 hover:bg-white/40 transition-colors"
                    onClick={() => toggleCollapse(theme.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: themeColor }}
                      />
                      <div>
                        <p className="text-[9px] font-bold tracking-[1.5px] text-[#6d797a] uppercase">
                          Theme {globalIdx + 1} · {getMonthRange(theme)}
                        </p>
                        <p
                          className="text-[15px] font-bold text-[#1a1c1e] cursor-pointer hover:text-[#00666d] transition-colors italic"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          onClick={(e) => { e.stopPropagation(); openEdit(theme); }}
                        >
                          {theme.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] px-3 py-1 font-bold border"
                        style={{
                          backgroundColor: `${themeColor}10`,
                          borderColor: `${themeColor}20`,
                          color: themeColor,
                        }}
                      >
                        {theme.sub_topic_count} sub-themes · {getThemeStats(theme)}
                      </span>
                      <button
                        className="text-[10px] px-3 py-1 border border-[#bcc9ca]/30 bg-white/60 text-[#3d494a] font-semibold hover:bg-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); openEdit(theme); }}
                      >
                        + Sub-theme
                      </button>
                      <span
                        className="material-symbols-outlined text-[#bcc9ca] text-lg transition-transform"
                        style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0)" }}
                      >
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Theme body */}
                  {!isCollapsed && (
                    <div className="px-3 sm:px-4 pb-3 pt-1 flex flex-col gap-2">
                      {theme.sub_topics.length === 0 && themeSermons.length === 0 ? (
                        <div className="text-center py-8 text-[#bcc9ca] text-xs">
                          <span className="material-symbols-outlined text-xl block mb-1.5 text-[#00666d]/15">add_circle_outline</span>
                          No sub-themes yet. Click the theme name to add topics.
                        </div>
                      ) : (
                        <>
                          {theme.sub_topics.map((subTopic, subIdx) => {
                            const subCount = theme.sub_topics.length;
                            const perSub = Math.ceil(themeSermons.length / subCount);
                            const subSermons = themeSermons.slice(subIdx * perSub, (subIdx + 1) * perSub);

                            return (
                              <div key={subTopic.id} className="border border-[#bcc9ca]/20 overflow-hidden bg-white/40">
                                {/* Sub-topic header */}
                                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#FAF7F2]/50">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="w-[7px] h-[7px] rounded-full shrink-0"
                                      style={{ backgroundColor: themeColor }}
                                    />
                                    <span className="text-[12px] font-bold text-[#1a1c1e]">{subTopic.name}</span>
                                    <span className="text-[10px] text-[#6d797a]">
                                      {subSermons.length > 0 ? `${subSermons.length} Fridays` : `Week ${subTopic.week_number}`}
                                    </span>
                                  </div>
                                  <button className="text-[10px] px-2.5 py-0.5 border border-[#bcc9ca]/25 bg-white/50 text-[#6d797a] font-semibold hover:bg-white hover:text-[#00666d] transition-colors">
                                    + Friday
                                  </button>
                                </div>

                                {/* Friday rows */}
                                {subSermons.length > 0 && (
                                  <div>
                                    {subSermons.map((sermon) => {
                                      const st = STATUS_MAP[sermon.status] || STATUS_MAP.draft;
                                      return (
                                        <Link
                                          key={sermon.id}
                                          href={`/sermons/${sermon.id}/edit`}
                                          className="grid grid-cols-[80px_1fr_auto] sm:grid-cols-[100px_1fr_auto] items-center gap-2 sm:gap-4 px-3.5 py-2.5 border-t border-[#bcc9ca]/12 hover:bg-[#00666d]/[0.02] transition-colors"
                                        >
                                          <span className="text-[11px] text-[#6d797a] font-medium">
                                            {sermon.scheduled_date ? formatFriday(sermon.scheduled_date) : "No date"}
                                          </span>
                                          <span className="text-[12px] font-semibold text-[#1a1c1e] truncate">
                                            {sermon.title}
                                          </span>
                                          <span
                                            className="text-[9px] px-2.5 py-1 rounded font-bold whitespace-nowrap"
                                            style={{ backgroundColor: st.bg, color: st.text }}
                                          >
                                            {st.label}
                                          </span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {theme.sub_topics.length === 0 && themeSermons.length > 0 && (
                            <div className="border border-[#bcc9ca]/20 overflow-hidden bg-white/40">
                              {themeSermons.map((sermon) => {
                                const st = STATUS_MAP[sermon.status] || STATUS_MAP.draft;
                                return (
                                  <Link
                                    key={sermon.id}
                                    href={`/sermons/${sermon.id}/edit`}
                                    className="grid grid-cols-[80px_1fr_auto] sm:grid-cols-[100px_1fr_auto] items-center gap-2 sm:gap-4 px-3.5 py-2.5 border-t border-[#bcc9ca]/12 first:border-t-0 hover:bg-[#00666d]/[0.02] transition-colors"
                                  >
                                    <span className="text-[11px] text-[#6d797a] font-medium">
                                      {sermon.scheduled_date ? formatFriday(sermon.scheduled_date) : "No date"}
                                    </span>
                                    <span className="text-[12px] font-semibold text-[#1a1c1e] truncate">
                                      {sermon.title}
                                    </span>
                                    <span
                                      className="text-[9px] px-2.5 py-1 rounded font-bold whitespace-nowrap"
                                      style={{ backgroundColor: st.bg, color: st.text }}
                                    >
                                      {st.label}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel — Create / Edit ── */}
      {isFormOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={closeForm} />

          <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 lg:z-auto lg:relative lg:w-[360px] border-l border-[#bcc9ca]/30 bg-[#FAF7F2]/95 backdrop-blur-md overflow-y-auto shrink-0">
            <div className="sticky top-0 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#bcc9ca]/30 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <span className="text-[#C4A35A] font-bold text-[10px] tracking-[2px] uppercase">
                  {editingTheme ? `Theme · ${MONTHS[(editingTheme.month - 1)]}` : "New Theme"}
                </span>
                <p className="text-lg font-bold text-[#00666d]">
                  {editingTheme ? "Edit Theme" : "Create Theme"}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="w-8 h-8 rounded-full bg-white/70 border border-[#bcc9ca]/30 flex items-center justify-center text-[#6d797a] hover:text-[#00666d] hover:bg-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6">
              {/* Name */}
              <div className="mb-5">
                <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">Theme Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Aqeedah & Faith"
                  className="w-full text-[14px] font-semibold text-[#1a1c1e] border border-[#bcc9ca]/40 rounded-xl px-4 py-3 outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#bcc9ca]"
                />
              </div>

              {/* Month range */}
              <div className="mb-5 flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">Start Month</label>
                  <select
                    value={formMonthStart}
                    onChange={(e) => setFormMonthStart(Number(e.target.value))}
                    className="w-full text-[13px] font-semibold text-[#1a1c1e] border border-[#bcc9ca]/40 rounded-xl px-3 py-3 outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all bg-white/70"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">End Month</label>
                  <select
                    value={formMonthEnd}
                    onChange={(e) => setFormMonthEnd(Number(e.target.value))}
                    className="w-full text-[13px] font-semibold text-[#1a1c1e] border border-[#bcc9ca]/40 rounded-xl px-3 py-3 outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all bg-white/70"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color */}
              <div className="mb-5">
                <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-2">Color</label>
                <div className="flex gap-3">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFormColor(c.value)}
                      className={`w-8 h-8 rounded-full transition-all shadow-sm ${
                        formColor === c.value ? "ring-2 ring-offset-2 ring-[#00666d] scale-110" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief description of this theme..."
                  rows={3}
                  className="w-full text-[13px] text-[#1a1c1e] border border-[#bcc9ca]/40 rounded-xl px-4 py-3 outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all resize-none bg-white/70 placeholder:text-[#bcc9ca]"
                />
              </div>

              {/* Sub-themes */}
              <div className="mb-6">
                <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-2">Sub-themes</label>
                <div className="flex flex-col gap-2.5">
                  {formTopics.map((topic, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: formColor }}
                      />
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => updateSubTopic(idx, e.target.value)}
                        placeholder={`Sub-theme ${idx + 1}...`}
                        className="flex-1 text-[13px] text-[#1a1c1e] border border-[#bcc9ca]/40 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all bg-white/70 placeholder:text-[#bcc9ca]"
                      />
                      {formTopics.length > 1 && (
                        <button
                          onClick={() => removeSubTopic(idx)}
                          className="text-[#bcc9ca] hover:text-red-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formTopics.length < 6 && (
                  <button
                    onClick={addSubTopic}
                    className="text-[11px] text-[#00666d] hover:text-[#004a50] mt-2.5 font-bold transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add sub-theme
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={!formName.trim()}
                  className={`w-full py-3 text-[13px] font-bold transition-all ${
                    formName.trim()
                      ? "bg-[#00666d] text-white hover:bg-[#004a50] shadow-lg hover:shadow-xl active:scale-[0.98]"
                      : "bg-[#bcc9ca]/20 text-[#bcc9ca] cursor-not-allowed"
                  }`}
                >
                  {editingTheme ? "Update Theme" : "Create Theme"}
                </button>
                {editingTheme && (
                  <button
                    onClick={() => handleDelete(editingTheme.id)}
                    className="w-full py-2.5 text-[12px] font-semibold text-red-400 border border-red-200 hover:bg-red-50 transition-all"
                  >
                    Delete Theme
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
